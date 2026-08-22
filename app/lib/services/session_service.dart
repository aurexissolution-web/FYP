import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/analyze_result.dart';

class SessionService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<String> createSession({String? title, String? language}) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    final row = await _client
        .from('mood_logs')
        .insert({
          'user_id': userId,
          'title': title ?? 'Check-in',
          'source': 'text',
          'fusion_result': 'neutral',
          'confidence': 0.0,
          'crisis_triggered': false,
        })
        .select('id')
        .single();

    return row['id'] as String;
  }

  Future<void> updateSessionTitle(String sessionId, String title) async {
    await _client.from('mood_logs').update({'title': title}).eq('id', sessionId);
  }

  Future<void> addMessage({
    required String sessionId,
    required String role,
    required String type,
    String? content,
    Map<String, dynamic>? metadata,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    await _client.from('chat_messages').insert({
      'session_id': sessionId,
      'user_id': userId,
      'role': role,
      'type': type,
      'content': content,
      'metadata': metadata ?? {},
    });
  }

  Future<List<Map<String, dynamic>>> getSessions() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final response = await _client
        .from('mood_logs')
        .select('id, title, created_at, source, fusion_result, crisis_triggered')
        .eq('user_id', userId)
        .order('created_at', ascending: false);

    return (response as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> getSessionMessages(String sessionId) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final response = await _client
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', ascending: true);

    return (response as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> saveAnalysis({
    required String sessionId,
    required AnalyzeResult result,
    required String source,
    required String language,
    String? conversationText,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    await _client.from('mood_logs').update({
      'source': source,
      'text_result': result.textResult?.label,
      'audio_result': result.audioResult?.label,
      'fusion_result': result.fusionResult.label,
      'confidence': result.fusionResult.confidence,
      'crisis_triggered': result.crisis,
      'conversation_text': conversationText,
    }).eq('id', sessionId);

    await _client.from('chat_messages').insert({
      'session_id': sessionId,
      'user_id': userId,
      'role': 'ai',
      'type': result.crisis ? 'crisis' : 'mood',
      'content': result.responseMessage,
      'metadata': {'result': result.toJson()},
    });

    if (!result.crisis && result.selfCarePlan.isNotEmpty) {
      await _client.from('chat_messages').insert({
        'session_id': sessionId,
        'user_id': userId,
        'role': 'ai',
        'type': 'plan',
        'content': null,
        'metadata': {'result': result.toJson()},
      });

      final plans = result.selfCarePlan
          .map(
            (item) => {
              'user_id': userId,
              'mood_log_id': sessionId,
              'day_index': item.day,
              'activity': item.activity,
              'language': language,
            },
          )
          .toList();

      if (plans.isNotEmpty) {
        await _client.from('self_care_plans').insert(plans);
      }
    }
  }

  /// Backwards-compatible helper used by the legacy CheckInPage flow.
  Future<void> logResult(
    AnalyzeResult result, {
    required String source,
    required String language,
    String? conversationText,
  }) async {
    final sessionId = await createSession(
      title: result.selfCarePlan.isNotEmpty
          ? 'Check-in: ${result.fusionResult.label}'
          : 'Check-in',
    );
    await saveAnalysis(
      sessionId: sessionId,
      result: result,
      source: source,
      language: language,
      conversationText: conversationText,
    );
  }

  Future<void> toggleSelfCare(String planId, bool completed) async {
    await _client.from('self_care_plans').update({
      'completed_at': completed ? DateTime.now().toIso8601String() : null,
    }).eq('id', planId);
  }

  Future<List<Map<String, dynamic>>> fetchMoodLogs() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final response = await _client
        .from('mood_logs')
        .select('*, self_care_plans(*)')
        .eq('user_id', userId)
        .order('created_at', ascending: false);

    return (response as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> deleteSession(String sessionId) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    await _client
        .from('mood_logs')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);
  }
}
