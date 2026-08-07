import 'audio_bytes_reader_stub.dart'
    if (dart.library.io) 'audio_bytes_reader_io.dart'
    if (dart.library.html) 'audio_bytes_reader_web.dart' as impl;

Future<List<int>> readAudioBytes(String pathOrUrl) => impl.readAudioBytes(pathOrUrl);
