import 'package:flutter/material.dart';

class TypingIndicator extends StatefulWidget {
  final Color? color;
  final double dotSize;
  final double spacing;

  const TypingIndicator({
    super.key,
    this.color,
    this.dotSize = 8,
    this.spacing = 4,
  });

  @override
  State<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<TypingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? Theme.of(context).colorScheme.primary;

    return SizedBox(
      height: widget.dotSize * 2.2,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, (index) {
          return _Dot(
            controller: _controller,
            index: index,
            color: color,
            size: widget.dotSize,
            spacing: widget.spacing,
          );
        }),
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  final AnimationController controller;
  final int index;
  final Color color;
  final double size;
  final double spacing;

  const _Dot({
    required this.controller,
    required this.index,
    required this.color,
    required this.size,
    required this.spacing,
  });

  @override
  Widget build(BuildContext context) {
    final start = index * 0.15;
    final end = start + 0.7;

    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        final value = controller.value;
        double t;
        if (value < start) {
          t = 0;
        } else if (value < end) {
          t = (value - start) / (end - start);
        } else {
          t = 1 - (value - end) / (1 - end);
        }
        t = t.clamp(0.0, 1.0);
        final offsetY = -4.0 * t;
        final opacity = 0.35 + 0.65 * t;

        return Padding(
          padding: EdgeInsets.only(right: index < 2 ? spacing : 0),
          child: Transform.translate(
            offset: Offset(0, offsetY),
            child: Opacity(
              opacity: opacity,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
