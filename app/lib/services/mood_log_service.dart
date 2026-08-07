import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/analyze_result.dart';

class MoodLogService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<void> logResult(AnalyzeResult result, {required String source}) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    await _client.from('mood_logs').insert({
      'user_id': userId,
      'source': source,
      'text_result': result.textResult?.label,
      'audio_result': result.audioResult?.label,
      'fusion_result': result.fusionResult.label,
      'confidence': result.fusionResult.confidence,
      'crisis_triggered': result.crisis,
    });
  }
}
