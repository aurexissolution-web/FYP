import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A calm, slowly drifting gradient backdrop.
///
/// The 8-second cycle deliberately matches the paced-breathing exercise the
/// app prescribes, so the motion reads as part of the product rather than
/// decoration. Everything animates via transform/opacity only, to stay cheap
/// enough for a low-end device during a live demo.
class BreathingBackground extends StatefulWidget {
  final Widget child;

  const BreathingBackground({super.key, required this.child});

  @override
  State<BreathingBackground> createState() => _BreathingBackgroundState();
}

class _BreathingBackgroundState extends State<BreathingBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  static const _orbs = <_Orb>[
    _Orb(alignment: Alignment(-0.8, -0.7), size: 0.95, hue: Color(0xFF8FD3FF), phase: 0),
    _Orb(alignment: Alignment(0.9, -0.2), size: 0.8, hue: Color(0xFF9BE7DD), phase: 0.35),
    _Orb(alignment: Alignment(-0.4, 0.85), size: 1.05, hue: Color(0xFFB5C8F5), phase: 0.7),
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Honours the platform "reduce motion" accessibility setting: the orbs are
  /// still drawn, they simply hold still.
  bool _syncToMotionPreference(BuildContext context) {
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduceMotion && _controller.isAnimating) {
      _controller.stop();
    } else if (!reduceMotion && !_controller.isAnimating) {
      _controller.repeat();
    }
    return reduceMotion;
  }

  @override
  Widget build(BuildContext context) {
    _syncToMotionPreference(context);
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF5B8BD8), Color(0xFF7FB9B4)],
        ),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final shortest = math.min(constraints.maxWidth, constraints.maxHeight);
          return Stack(
            fit: StackFit.expand,
            children: [
              for (final orb in _orbs)
                AnimatedBuilder(
                  animation: _controller,
                  builder: (context, _) {
                    final t = (_controller.value + orb.phase) % 1.0;
                    final wave = math.sin(t * 2 * math.pi);
                    final diameter = shortest * orb.size * (1 + 0.06 * wave);
                    return Align(
                      alignment: Alignment(
                        orb.alignment.x + 0.05 * wave,
                        orb.alignment.y + 0.04 * math.cos(t * 2 * math.pi),
                      ),
                      child: Opacity(
                        opacity: 0.20 + 0.06 * wave,
                        child: Container(
                          width: diameter,
                          height: diameter,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [orb.hue, orb.hue.withValues(alpha: 0)],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              widget.child,
            ],
          );
        },
      ),
    );
  }
}

class _Orb {
  final Alignment alignment;
  final double size;
  final Color hue;
  final double phase;

  const _Orb({
    required this.alignment,
    required this.size,
    required this.hue,
    required this.phase,
  });
}

/// The logo, breathing on the same 8-second cycle as the background.
class BreathingLogo extends StatefulWidget {
  final double size;

  const BreathingLogo({super.key, this.size = 160});

  @override
  State<BreathingLogo> createState() => _BreathingLogoState();
}

class _BreathingLogoState extends State<BreathingLogo>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduceMotion && _controller.isAnimating) {
      _controller.stop();
    } else if (!reduceMotion && !_controller.isAnimating) {
      _controller.repeat();
    }
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final wave = math.sin(_controller.value * 2 * math.pi);
        return SizedBox(
          width: widget.size * 1.55,
          height: widget.size * 1.55,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // halo expanding on the in-breath
              Container(
                width: widget.size * (1.18 + 0.20 * ((wave + 1) / 2)),
                height: widget.size * (1.18 + 0.20 * ((wave + 1) / 2)),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(
                    alpha: 0.14 - 0.07 * ((wave + 1) / 2),
                  ),
                ),
              ),
              Transform.scale(scale: 1 + 0.025 * wave, child: child),
            ],
          ),
        );
      },
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(widget.size * 0.24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.14),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        padding: EdgeInsets.all(widget.size * 0.12),
        child: Image.asset('assets/logo_icon.png', fit: BoxFit.contain),
      ),
    );
  }
}

/// Fades and lifts its child into place after [delay] — used to stagger the
/// welcome screen so it assembles calmly instead of appearing all at once.
class FadeInUp extends StatefulWidget {
  final Widget child;
  final Duration delay;

  const FadeInUp({super.key, required this.child, this.delay = Duration.zero});

  @override
  State<FadeInUp> createState() => _FadeInUpState();
}

class _FadeInUpState extends State<FadeInUp>
    with SingleTickerProviderStateMixin {
  static const _travel = Duration(milliseconds: 620);

  late final AnimationController _controller;
  late final Animation<double> _curve;

  @override
  void initState() {
    super.initState();
    // The delay is expressed as an Interval on one controller rather than a
    // Future.delayed, so no timer can outlive the widget.
    final total = widget.delay + _travel;
    _controller = AnimationController(vsync: this, duration: total);
    final start = total.inMilliseconds == 0
        ? 0.0
        : widget.delay.inMilliseconds / total.inMilliseconds;
    _curve = CurvedAnimation(
      parent: _controller,
      curve: Interval(start, 1, curve: Curves.easeOutCubic),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) {
      return widget.child;
    }
    return AnimatedBuilder(
      animation: _curve,
      builder: (context, child) => Opacity(
        opacity: _curve.value,
        child: Transform.translate(
          offset: Offset(0, 18 * (1 - _curve.value)),
          child: child,
        ),
      ),
      child: widget.child,
    );
  }
}
