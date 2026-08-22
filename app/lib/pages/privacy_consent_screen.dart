import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../auth/auth_gate.dart';
import '../pages/main_shell.dart';
import '../widgets/logo_hero.dart';

const _privacyAcceptedKey = 'has_accepted_privacy_consent';

Future<bool> hasAcceptedPrivacyConsent() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(_privacyAcceptedKey) ?? false;
}

Future<void> setPrivacyConsentAccepted(bool accepted) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(_privacyAcceptedKey, accepted);
}

class PrivacyConsentScreen extends StatefulWidget {
  const PrivacyConsentScreen({super.key});

  @override
  State<PrivacyConsentScreen> createState() => _PrivacyConsentScreenState();
}

class _PrivacyConsentScreenState extends State<PrivacyConsentScreen> {
  bool _accepted = false;
  bool _loading = false;

  Future<void> _continue() async {
    if (!_accepted) return;
    setState(() => _loading = true);
    await setPrivacyConsentAccepted(true);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => AuthGate(
          authenticatedBuilder: (context) => const MainShell(),
        ),
      ),
    );
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              colorScheme.primary,
              colorScheme.secondary,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                const Center(child: LogoHero(size: 140)),
                const SizedBox(height: 32),
                Text(
                  'Your privacy comes first',
                  style: textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'EmoBuddy stores your conversations securely so you can '
                  'continue them later. We never share your data with third '
                  'parties.',
                  style: textTheme.bodyLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.85),
                        height: 1.5,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _bullet('Your chats are tied to your account only.'),
                      const SizedBox(height: 12),
                      _bullet('Voice notes are processed and not stored as audio.'),
                      const SizedBox(height: 12),
                      _bullet('You can delete your account and data at any time.'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                GestureDetector(
                  onTap: () => setState(() => _accepted = !_accepted),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _accepted
                          ? Colors.white.withValues(alpha: 0.2)
                          : Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: _accepted
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.3),
                        width: _accepted ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: _accepted
                                ? Colors.white
                                : Colors.transparent,
                            border: Border.all(
                              color: Colors.white,
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: _accepted
                              ? Icon(
                                  Icons.check,
                                  size: 16,
                                  color: colorScheme.primary,
                                )
                              : null,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'I agree to the Privacy Policy and Terms of Use.',
                            style: textTheme.bodyMedium?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.9),
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton(
                      onPressed: () => _openUrl('https://emobuddy.example/privacy'),
                      child: Text(
                        'Privacy Policy',
                        style: textTheme.labelLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.9),
                              decoration: TextDecoration.underline,
                            ),
                      ),
                    ),
                    Text(
                      ' · ',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                    ),
                    TextButton(
                      onPressed: () => _openUrl('https://emobuddy.example/terms'),
                      child: Text(
                        'Terms of Use',
                        style: textTheme.labelLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.9),
                              decoration: TextDecoration.underline,
                            ),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                FilledButton(
                  onPressed: _accepted && !_loading ? _continue : null,
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: colorScheme.primary,
                    disabledBackgroundColor:
                        Colors.white.withValues(alpha: 0.3),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Continue'),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _bullet(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 8,
          height: 8,
          margin: const EdgeInsets.only(top: 7, right: 12),
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
          ),
        ),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                  height: 1.45,
                ),
          ),
        ),
      ],
    );
  }
}

