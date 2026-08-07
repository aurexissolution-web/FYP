import 'dart:io';

Future<List<int>> readAudioBytes(String path) => File(path).readAsBytes();
