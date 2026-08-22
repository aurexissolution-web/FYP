import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/analyze_result.dart';

/// Base URL for the FastAPI ml-service.
///
/// Override at build/run time with:
///   flutter run --dart-define=ML_SERVICE_URL=http://10.0.2.2:8123   (Android emulator)
///   flutter run --dart-define=ML_SERVICE_URL=http://LAN_IP:8123   (physical device)
const String kMlServiceBaseUrl = String.fromEnvironment(
  'ML_SERVICE_URL',
  defaultValue: 'http://127.0.0.1:8123',
);

class ChatReply {
  final String reply;
  final bool crisis;

  ChatReply({required this.reply, required this.crisis});
}

class AnalyzeApiException implements Exception {
  final String message;
  AnalyzeApiException(this.message);

  @override
  String toString() => message;
}

class AnalyzeApi {
  final String baseUrl;
  final http.Client _client;

  AnalyzeApi({this.baseUrl = kMlServiceBaseUrl, http.Client? client})
      : _client = client ?? http.Client();

  Future<AnalyzeResult> analyze({
    String? text,
    String? audioBase64,
    String language = 'en',
  }) async {
    return _postAnalyze(text: text, audioBase64: audioBase64, language: language);
  }

  Future<AnalyzeResult> analyzeConversation({
    required List<String> messages,
    String language = 'en',
  }) async {
    final response = await _client
        .post(
          Uri.parse('$baseUrl/analyze/conversation'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'messages': messages,
            'language': language,
          }),
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      throw AnalyzeApiException(
        'ml-service returned ${response.statusCode}: ${response.body}',
      );
    }

    return AnalyzeResult.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<ChatReply> getChatReply({
    required List<String> messages,
    String language = 'en',
  }) async {
    final response = await _client
        .post(
          Uri.parse('$baseUrl/chat/reply'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'messages': messages,
            'language': language,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw AnalyzeApiException(
        'ml-service returned ${response.statusCode}: ${response.body}',
      );
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return ChatReply(
      reply: json['reply'] as String,
      crisis: json['crisis'] as bool? ?? false,
    );
  }

  Future<AnalyzeResult> _postAnalyze({
    String? text,
    String? audioBase64,
    String language = 'en',
  }) async {
    final response = await _client
        .post(
          Uri.parse('$baseUrl/analyze'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'text': text,
            'audio_base64': audioBase64,
            'language': language,
          }),
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      throw AnalyzeApiException(
        'ml-service returned ${response.statusCode}: ${response.body}',
      );
    }

    return AnalyzeResult.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }
}
