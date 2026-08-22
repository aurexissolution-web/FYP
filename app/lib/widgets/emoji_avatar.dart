import 'package:flutter/material.dart';

class EmojiAvatar extends StatelessWidget {
  final String emoji;
  final double size;
  final Color? backgroundColor;
  final List<Color>? gradient;

  const EmojiAvatar({
    super.key,
    this.emoji = '🤗',
    this.size = 40,
    this.backgroundColor,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final bg = gradient ??
        [
          colorScheme.primaryContainer,
          colorScheme.secondaryContainer,
        ];

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: bg,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow.withOpacity(0.12),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        emoji,
        style: TextStyle(fontSize: size * 0.48),
      ),
    );
  }
}
