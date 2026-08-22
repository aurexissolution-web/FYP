import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../widgets/logo_hero.dart';

class ConfirmEmailPage extends StatelessWidget {
  final String email;

  const ConfirmEmailPage({super.key, required this.email});

  Future<void> _openEmailApp() async {
    final uri = Uri.parse('mailto:');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF4A7DBA),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF5B8BD8),
              Color(0xFF7FB9B4),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                      shape: const CircleBorder(),
                    ),
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
                const Spacer(flex: 2),
                const Center(child: LogoHero(size: 140)),
                const SizedBox(height: 36),
                const Text(
                  'Verify your email',
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                Text(
                  'We have sent a confirmation link to $email. Tap it to activate your account, then sign in.',
                  style: const TextStyle(
                    color: Colors.white70,
                    height: 1.5,
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
                const Spacer(flex: 3),
                _glassButton(
                  onPressed: _openEmailApp,
                  child: const Text(
                    'OPEN EMAIL APP',
                    style: TextStyle(
                      color: Colors.white,
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _glassButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(
                    'BACK TO SIGN IN',
                    style: TextStyle(
                      color: Colors.white,
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _glassButton({
    required Widget child,
    required VoidCallback? onPressed,
    double height = 56,
  }) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        shape: const StadiumBorder(),
        minimumSize: Size(double.infinity, height),
        overlayColor: Colors.white.withValues(alpha: 0.08),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(height / 2),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            height: height,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.white.withValues(alpha: 0.25),
                  Colors.white.withValues(alpha: 0.06),
                ],
              ),
              borderRadius: BorderRadius.circular(height / 2),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.4),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
