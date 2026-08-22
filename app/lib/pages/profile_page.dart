import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../services/session_service.dart';
import '../services/notification_service.dart';
import '../theme.dart';
import '../widgets/biometric_guard.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _service = SessionService();
  List<Map<String, dynamic>> _logs = [];
  bool _loading = true;
  bool _reminders = true;
  bool _biometric = false;
  TimeOfDay? _reminderTime;

  @override
  void initState() {
    super.initState();
    _load();
    _loadReminderPrefs();
    _loadBiometricPref();
  }

  Future<void> _loadBiometricPref() async {
    final enabled = await isBiometricEnabled();
    if (mounted) setState(() => _biometric = enabled);
  }

  Future<void> _load() async {
    try {
      final logs = await _service.fetchMoodLogs();
      setState(() {
        _logs = logs;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadReminderPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final hour = prefs.getInt('reminder_hour');
    final minute = prefs.getInt('reminder_minute');
    final enabled = prefs.getBool('reminders_enabled') ?? true;
    setState(() {
      _reminders = enabled;
      if (hour != null && minute != null) {
        _reminderTime = TimeOfDay(hour: hour, minute: minute);
      }
    });
  }

  Future<void> _saveReminderPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('reminders_enabled', _reminders);
    if (_reminderTime != null) {
      await prefs.setInt('reminder_hour', _reminderTime!.hour);
      await prefs.setInt('reminder_minute', _reminderTime!.minute);
    }
    await NotificationService.scheduleDailyCheckIn();
  }

  Future<void> _pickReminderTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _reminderTime ?? const TimeOfDay(hour: 20, minute: 0),
    );
    if (picked == null) return;
    setState(() => _reminderTime = picked);
    await _saveReminderPrefs();
  }

  Future<void> _signOut(BuildContext context) async {
    await Supabase.instance.client.auth.signOut();
  }

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
  }

  int get _totalCheckins => _logs.length;

  int get _completedPlans => _logs.fold<int>(
        0,
        (sum, log) {
          final plans = (log['self_care_plans'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>();
          return sum + plans.where((p) => p['completed_at'] != null).length;
        },
      );

  int get _streakDays {
    final dates = _logs
        .map((l) => DateTime.tryParse(l['created_at'] as String))
        .whereType<DateTime>()
        .map((d) => DateTime(d.year, d.month, d.day))
        .toSet()
        .toList()
      ..sort((a, b) => b.compareTo(a));
    if (dates.isEmpty) return 0;
    int streak = 1;
    for (int i = 1; i < dates.length; i++) {
      if (dates[i].difference(dates[i - 1]).inDays == -1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final session = Supabase.instance.client.auth.currentSession;
    final email = session?.user.email ?? '';
    final displayName = email.split('@').first;
    final isLight = Theme.of(context).brightness == Brightness.light;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Settings',
            onPressed: () => Navigator.of(context).pushNamed('/settings'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colorScheme.surface,
              colorScheme.surface,
              isLight ? Colors.white : const Color(0xFF14131C),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: const [0.0, 0.6, 1.0],
          ),
        ),
        child: SafeArea(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [colorScheme.primary, colorScheme.secondary],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            color: colorScheme.primary.withOpacity(0.35),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 70,
                            height: 70,
                            decoration: const BoxDecoration(
                              color: Colors.white24,
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              displayName.isNotEmpty
                                  ? displayName[0].toUpperCase()
                                  : '?',
                              style: textTheme.headlineMedium?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ),
                          const SizedBox(width: 18),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  displayName,
                                  style: textTheme.titleLarge?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                      ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  email,
                                  style: textTheme.bodyMedium?.copyWith(
                                        color: Colors.white.withOpacity(0.85),
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            label: 'Streak',
                            value: '${_streakDays}d',
                            icon: Icons.local_fire_department,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            label: 'Check-ins',
                            value: '$_totalCheckins',
                            icon: Icons.check_circle_outline,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            label: 'Done',
                            value: '$_completedPlans',
                            icon: Icons.done_all,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    _SectionCard(
                      title: 'Preferences',
                      children: [
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
                    const SizedBox(height: 18),
                    _SectionCard(
                      title: 'Daily reminder',
                      children: [
                        SwitchListTile(
                          value: _reminders,
                          onChanged: (v) {
                            setState(() => _reminders = v);
                            _saveReminderPrefs();
                          },
                          title: const Text('Remind me to check in'),
                          secondary: Icon(Icons.notifications_active_outlined,
                              color: colorScheme.primary),
                        ),
                        if (_reminders)
                          ListTile(
                            leading: Icon(Icons.access_time,
                                color: colorScheme.primary),
                            title: const Text('Reminder time'),
                            trailing: Text(
                              _reminderTime != null
                                  ? _reminderTime!.format(context)
                                  : '8:00 PM',
                              style: textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            onTap: _pickReminderTime,
                          ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    _SectionCard(
                      title: 'Support',
                      children: [
                        ListTile(
                          leading: Icon(Icons.phone_in_talk,
                              color: colorScheme.error),
                          title: const Text('Crisis helplines'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => Navigator.of(context).pushNamed('/settings'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    _SectionCard(
                      title: 'Account',
                      children: [
                        SwitchListTile(
                          value: _biometric,
                          onChanged: (v) async {
                            setState(() => _biometric = v);
                            await setBiometricEnabled(v);
                          },
                          title: const Text('Use Face ID / biometrics'),
                          subtitle: const Text('Protect your check-ins at launch'),
                          secondary: Icon(Icons.fingerprint,
                              color: colorScheme.primary),
                        ),
                        const Divider(height: 1, indent: 16, endIndent: 16),
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
                  ],
                ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.outline.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: colorScheme.primary, size: 26),
          const SizedBox(height: 8),
          Text(
            value,
            style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          Text(
            label,
            style: textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurface.withOpacity(0.6),
                ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.outline.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow.withOpacity(0.08),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}
