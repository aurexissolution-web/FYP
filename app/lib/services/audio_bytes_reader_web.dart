import 'package:http/http.dart' as http;

// On web, record's stop() returns a blob: object URL rather than a
// filesystem path -- fetch it to get the actual encoded WAV bytes.
Future<List<int>> readAudioBytes(String blobUrl) async {
  final response = await http.get(Uri.parse(blobUrl));
  return response.bodyBytes;
}
