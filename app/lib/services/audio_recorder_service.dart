import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import 'audio_bytes_reader.dart';

class AudioRecorderService {
  final AudioRecorder _recorder = AudioRecorder();

  // WAV (uncompressed PCM) so ml-service's librosa/soundfile decode it
  // without needing extra codec support -- matches the training data format.
  static const _config = RecordConfig(
    encoder: AudioEncoder.wav,
    sampleRate: 22050,
    numChannels: 1,
  );

  Future<bool> requestPermission() => _recorder.hasPermission();

  Future<void> start() async {
    final path = kIsWeb
        ? 'checkin_${DateTime.now().millisecondsSinceEpoch}.wav'
        : await _nativeTempPath();
    await _recorder.start(_config, path: path);
  }

  Future<String> _nativeTempPath() async {
    final dir = await getTemporaryDirectory();
    return '${dir.path}/checkin_${DateTime.now().millisecondsSinceEpoch}.wav';
  }

  Future<bool> get isRecording => _recorder.isRecording();

  /// Stops recording and returns the clip as a base64 string, or null if
  /// nothing was recorded.
  Future<String?> stop() async {
    final pathOrUrl = await _recorder.stop();
    if (pathOrUrl == null) return null;
    final bytes = await readAudioBytes(pathOrUrl);
    return base64Encode(bytes);
  }

  Future<void> cancel() => _recorder.cancel();

  void dispose() {
    _recorder.dispose();
  }
}
