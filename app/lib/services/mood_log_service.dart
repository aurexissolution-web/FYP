import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/analyze_result.dart';

class MoodLogService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<void> logResult(
    AnalyzeResult result, {
    required String source,
    required String language,
    String? conversationText,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    final row = await _client
        .from('mood_logs')
        .insert({
          'user_id': userId,
          'source': source,
          'text_result': result.textResult?.label,
          'audio_result': result.audioResult?.label,
          'fusion_result': result.fusionResult.label,
          'confidence': result.fusionResult.confidence,
          'crisis_triggered': result.crisis,
          'conversation_text': conversationText,
        })
        .select('id')
        .single();

    final moodLogId = row['id'] as String;

    final plans = result.selfCarePlan
        .map(
          (item) => {
            'user_id': userId,
            'mood_log_id': moodLogId,
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

  Future<void> toggleSelfCare(String planId, bool completed) async {
    await _client.from('self_care_plans').update({
      'completed_at': completed ? DateTime.now().toIso8601String() : null,
    }).eq('id', planId);
  }
}
