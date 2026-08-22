import 'package:flutter/material.dart';

class MoodVisual {
  final IconData icon;
  final Color color;
  final Color lightColor;
  final String label;

  const MoodVisual(this.icon, this.color, this.lightColor, this.label);

  static MoodVisual forLabel(String label) {
    switch (label.toLowerCase()) {
      case 'happy':
        return const MoodVisual(
          Icons.sentiment_satisfied_rounded,
          Color(0xFF86B45B),
          Color(0xFFE6F4D8),
          'Happy',
        );
      case 'sad':
        return const MoodVisual(
          Icons.sentiment_dissatisfied_rounded,
          Color(0xFF6B92C9),
          Color(0xFFE2ECF8),
          'Sad',
        );
      case 'angry':
        return const MoodVisual(
          Icons.sentiment_very_dissatisfied_rounded,
          Color(0xFFD97964),
          Color(0xFFFCECE9),
          'Angry',
        );
      case 'neutral':
      default:
        return const MoodVisual(
          Icons.sentiment_neutral_rounded,
          Color(0xFF9AA5AB),
          Color(0xFFEDF0F2),
          'Neutral',
        );
    }
  }
}

String moodEmoji(String label) {
  return switch (label.toLowerCase()) {
    'happy' => '😊',
    'sad' => '😔',
    'angry' => '😠',
    _ => '😐',
  };
}
