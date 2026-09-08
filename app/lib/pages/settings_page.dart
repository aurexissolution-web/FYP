import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../theme.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  Future<void> _resetDemo(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset demo?'),
        content: const Text(
          'This clears the local onboarding flag and signs you out so the next launch starts fresh.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_onboarding', false);
    await Supabase.instance.client.auth.signOut();
    if (!context.mounted) return;
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  Future<void> _signOut(BuildContext context) async {
    await Supabase.instance.client.auth.signOut();
    if (!context.mounted) return;
    // This page is reached via Navigator.pushNamed('/settings'), stacked on
    // top of AuthGate's home route. AuthGate reacts to onAuthStateChange and
    // swaps its content to the sign-in screen, but that swap happens on the
    // route underneath — invisible while this pushed route stays on top. Pop
    // back to root so the sign-in screen AuthGate just swapped in is shown.
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('EmoBuddy', style: textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text(
                      'Competition build',
                      style: textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurface.withOpacity(0.6),
                          ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Appearance', style: textTheme.titleMedium),
                    const SizedBox(height: 12),
                    ValueListenableBuilder<ThemeMode>(
                      valueListenable: emoBuddyThemeMode,
                      builder: (context, mode, _) {
                        return SegmentedButton<ThemeMode>(
                          segments: const [
                            ButtonSegment(
                              value: ThemeMode.light,
                              label: Text('Light'),
                              icon: Icon(Icons.light_mode_outlined),
                            ),
                            ButtonSegment(
                              value: ThemeMode.system,
                              label: Text('System'),
                              icon: Icon(Icons.brightness_auto_outlined),
                            ),
                            ButtonSegment(
                              value: ThemeMode.dark,
                              label: Text('Dark'),
                              icon: Icon(Icons.dark_mode_outlined),
                            ),
                          ],
                          selected: {mode},
                          onSelectionChanged: (s) {
                            if (s.isNotEmpty) {
                              setEmoBuddyThemeMode(s.first);
                            }
                          },
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.logout, color: colorScheme.primary),
                    title: const Text('Sign out'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _signOut(context),
                  ),
                  const Divider(height: 1, indent: 16, endIndent: 16),
                  ListTile(
                    leading: Icon(Icons.refresh, color: colorScheme.primary),
                    title: const Text('Reset demo'),
                    subtitle: const Text('For judges: start fresh on next launch'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _resetDemo(context),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Crisis resources', style: textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(
                      'If you or someone you know is in crisis, please reach out to a trusted person or local helpline immediately.',
                      style: textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurface.withOpacity(0.7),
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
