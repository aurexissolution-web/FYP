import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth/auth_gate.dart';
import 'models/analyze_result.dart';
import 'pages/history_page.dart';
import 'pages/main_shell.dart';
import 'pages/onboarding_screen.dart';
import 'pages/privacy_consent_screen.dart';
import 'pages/settings_page.dart';
import 'services/analyze_api.dart';
import 'services/audio_recorder_service.dart';
import 'services/session_service.dart';
import 'services/notification_service.dart';
import 'supabase_config.dart';
import 'theme.dart';

const _maxRecordingSeconds = 15;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: kSupabaseUrl,
    anonKey: kSupabaseAnonKey,
  );
  await loadEmoBuddyThemeMode();
  final prefs = await SharedPreferences.getInstance();
  final hasSeenOnboarding = prefs.getBool('has_seen_onboarding') ?? false;
  final hasAcceptedPrivacyConsent =
      prefs.getBool('has_accepted_privacy_consent') ?? false;

  runApp(EmoBuddyApp(
    showOnboarding: !hasSeenOnboarding,
    showPrivacyConsent: !hasAcceptedPrivacyConsent,
  ));

  _initializeNotifications();
}

void _initializeNotifications() {
  NotificationService.initialize()
      .timeout(const Duration(seconds: 5))
      .then((_) => debugPrint('NotificationService initialized'))
      .catchError((Object e, StackTrace st) {
    debugPrint('NotificationService.initialize failed: $e');
    debugPrint(st.toString());
    return null;
  });
}

class EmoBuddyApp extends StatelessWidget {
  final bool showOnboarding;
  final bool showPrivacyConsent;

  const EmoBuddyApp({
    super.key,
    required this.showOnboarding,
    required this.showPrivacyConsent,
  });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: emoBuddyThemeMode,
      builder: (context, themeMode, _) {
        return MaterialApp(
          title: 'EmoBuddy',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeMode,
          routes: {
            '/settings': (_) => const SettingsPage(),
          },
          home: showOnboarding
              ? const OnboardingScreen()
              : showPrivacyConsent
                  ? const PrivacyConsentScreen()
                  : const AuthGate(authenticatedBuilder: _buildMainShell),
        );
      },
    );
  }
}

Widget _buildMainShell(BuildContext context) => const MainShell();

class CheckInPage extends StatefulWidget {
  const CheckInPage({super.key});

  @override
  State<CheckInPage> createState() => _CheckInPageState();
}

class _CheckInPageState extends State<CheckInPage> {
  final _textController = TextEditingController();
  final _api = AnalyzeApi();
  final _sessionService = SessionService();

  bool _loading = false;
  String? _error;
  String? _saveError;
  AnalyzeResult? _result;
  String? _audioBase64;
  int _audioDurationSeconds = 0;
  String _language = 'en';

  Future<void> _submit() async {
    final text = _textController.text.trim();
    if (text.isEmpty && _audioBase64 == null) return;

    setState(() {
      _loading = true;
      _error = null;
      _saveError = null;
      _result = null;
    });

    try {
      final result = await _api.analyze(
        text: text.isEmpty ? null : text,
        audioBase64: _audioBase64,
        language: _language,
      );
      setState(() => _result = result);

      final source = text.isNotEmpty && _audioBase64 != null
          ? 'both'
          : (_audioBase64 != null ? 'voice' : 'text');

      try {
        await _sessionService.logResult(
          result,
          source: source,
          language: _language,
        );
      } catch (e) {
        // Supabase may be unavailable — don't let persistence break the UX.
        setState(
          () => _saveError =
              "We couldn't save this check-in right now, but your result is still here.",
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  void _onVoiceRecorded(String? audioBase64, int durationSeconds) {
    setState(() {
      _audioBase64 = audioBase64;
      _audioDurationSeconds = durationSeconds;
    });
  }

  void _removeAudio() {
    setState(() {
      _audioBase64 = null;
      _audioDurationSeconds = 0;
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'EmoBuddy',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _LanguageToggle(
              value: _language,
              onChanged: (v) => setState(() => _language = v),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.history_outlined),
            tooltip: 'Mood history',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => HistoryPage()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Sign out',
            onPressed: () => Supabase.instance.client.auth.signOut(),
          ),
        ],
      ),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              sliver: SliverToBoxAdapter(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 640),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _GreetingHeader(),
                      const SizedBox(height: 24),
                      _CheckInCard(
                        textController: _textController,
                        enabled: !_loading,
                      ),
                      const SizedBox(height: 20),
                      _VoiceRecorderControl(
                        onRecorded: _onVoiceRecorded,
                        onCleared: _removeAudio,
                        audioBase64: _audioBase64,
                        audioDuration: _audioDurationSeconds,
                      ),
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  SizedBox(
                                    height: 18,
                                    width: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white70,
                                    ),
                                  ),
                                  SizedBox(width: 10),
                                  Text('Analyzing...'),
                                ],
                              )
                            : const Text('Analyze my check-in'),
                      ),
                      const SizedBox(height: 28),
                      if (_error != null) _ErrorBanner(message: _error!),
                      if (_saveError != null) _InfoBanner(message: _saveError!),
                      if (_loading && _result == null)
                        const _LoadingResultCard()
                      else if (_result != null)
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 400),
                          child: _ResultView(
                            key: ValueKey(_result!.crisis
                                ? 'crisis'
                                : _result!.fusionResult.label),
                            result: _result!,
                          ),
                        )
                      else
                        const _EmptyResultCard(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LanguageToggle extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _LanguageToggle({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return SegmentedButton<String>(
      segments: const [
        ButtonSegment(
          value: 'en',
          label: Padding(
            padding: EdgeInsets.symmetric(horizontal: 6),
            child: Text('EN'),
          ),
        ),
        ButtonSegment(
          value: 'ms',
          label: Padding(
            padding: EdgeInsets.symmetric(horizontal: 6),
            child: Text('MS'),
          ),
        ),
      ],
      selected: {value},
      onSelectionChanged: (s) => onChanged(s.first),
      style: SegmentedButton.styleFrom(
        backgroundColor: Colors.white,
        selectedBackgroundColor: colorScheme.primaryContainer,
        selectedForegroundColor: colorScheme.onPrimaryContainer,
        side: const BorderSide(color: Color(0xFFD2D9DC)),
      ),
    );
  }
}

class _GreetingHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final user = Supabase.instance.client.auth.currentUser;
    final firstName = (user?.email ?? 'there').split('@').first;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFFDCD6EB),
                borderRadius: BorderRadius.all(Radius.circular(16)),
              ),
              alignment: Alignment.center,
              child: const Text(
                'LOGO',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF6B5B8A),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back,',
                    style: textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF6E787C),
                        ),
                  ),
                  Text(
                    firstName,
                    style: textTheme.headlineSmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          'How are you feeling right now?',
          style: textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Share a few words or record a short voice note. '
          'EmoBuddy will listen and suggest small, caring steps.',
          style: textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF6E787C),
                height: 1.5,
              ),
        ),
      ],
    );
  }
}

class _CheckInCard extends StatelessWidget {
  final TextEditingController textController;
  final bool enabled;

  const _CheckInCard({required this.textController, required this.enabled});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: TextField(
          controller: textController,
          enabled: enabled,
          maxLines: 4,
          textInputAction: TextInputAction.newline,
          decoration: const InputDecoration(
            hintText: 'Type how your day has been...',
            border: InputBorder.none,
          ),
        ),
      ),
    );
  }
}

class _VoiceRecorderControl extends StatefulWidget {
  final void Function(String? audioBase64, int durationSeconds) onRecorded;
  final VoidCallback onCleared;
  final String? audioBase64;
  final int audioDuration;

  const _VoiceRecorderControl({
    required this.onRecorded,
    required this.onCleared,
    this.audioBase64,
    this.audioDuration = 0,
  });

  @override
  State<_VoiceRecorderControl> createState() => _VoiceRecorderControlState();
}

class _VoiceRecorderControlState extends State<_VoiceRecorderControl> {
  final _recorderService = AudioRecorderService();

  bool _recording = false;
  bool _requesting = false;
  int _elapsedSeconds = 0;
  Timer? _timer;
  String? _permissionError;

  Future<void> _toggleRecording() async {
    if (_recording) {
      await _stop();
      return;
    }

    setState(() {
      _requesting = true;
      _permissionError = null;
    });

    try {
      final granted = await _recorderService.requestPermission();
      if (!granted) {
        setState(() {
          _requesting = false;
          _permissionError = 'Microphone permission denied.';
        });
        return;
      }

      widget.onRecorded(null, 0);
      await _recorderService.start();
      setState(() {
        _requesting = false;
        _recording = true;
        _elapsedSeconds = 0;
      });
    } catch (e) {
      setState(() {
        _requesting = false;
        _permissionError = 'Could not start recording: $e';
      });
      return;
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _elapsedSeconds++);
      if (_elapsedSeconds >= _maxRecordingSeconds) {
        _stop();
      }
    });
  }

  Future<void> _stop() async {
    _timer?.cancel();
    final base64 = await _recorderService.stop();
    final duration = _elapsedSeconds;
    setState(() => _recording = false);
    widget.onRecorded(base64, duration);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _recorderService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (widget.audioBase64 != null) {
      return Card(
        color: colorScheme.primaryContainer.withValues(alpha: 0.25),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          leading: CircleAvatar(
            backgroundColor: colorScheme.primary,
            child: const Icon(Icons.mic, color: Colors.white, size: 18),
          ),
          title: Text(
            'Voice clip attached',
            style: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
          subtitle: Text(
            '${widget.audioDuration}s · ready to analyze',
            style: textTheme.bodySmall,
          ),
          trailing: IconButton(
            icon: const Icon(Icons.close, size: 20),
            onPressed: widget.onCleared,
          ),
        ),
      );
    }

    return Row(
      children: [
        if (_requesting)
          const Padding(
            padding: EdgeInsets.all(12),
            child: SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        if (!_requesting)
          OutlinedButton.icon(
            onPressed: _toggleRecording,
            icon: Icon(
              _recording ? Icons.stop_circle : Icons.mic,
              color: _recording ? colorScheme.error : null,
            ),
            label: Text(
              _recording
                  ? 'Stop ($_elapsedSeconds s / $_maxRecordingSeconds s)'
                  : 'Record voice',
            ),
          ),
        if (_recording)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 12),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: _elapsedSeconds / _maxRecordingSeconds,
                  minHeight: 8,
                  backgroundColor: colorScheme.surfaceContainerHighest,
                ),
              ),
            ),
          ),
        if (_permissionError != null)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Text(
                _permissionError!,
                style: textTheme.bodySmall?.copyWith(color: colorScheme.error),
              ),
            ),
          ),
      ],
    );
  }
}

class _EmptyResultCard extends StatelessWidget {
  const _EmptyResultCard();

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
        child: Column(
          children: [
            Icon(
              Icons.spa,
              size: 48,
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.45),
            ),
            const SizedBox(height: 16),
            Text(
              'Your check-in insights will appear here',
              textAlign: TextAlign.center,
              style: textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Take a breath, then share what is on your mind.',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(color: const Color(0xFF6E787C)),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadingResultCard extends StatelessWidget {
  const _LoadingResultCard();

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          children: [
            const SizedBox(
              height: 28,
              width: 28,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
            const SizedBox(height: 20),
            Text(
              'Analyzing your check-in...',
              style: textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'This only takes a moment.',
              style: textTheme.bodyMedium?.copyWith(color: const Color(0xFF6E787C)),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;

  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, color: colorScheme.onErrorContainer, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: colorScheme.onErrorContainer, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  final String message;

  const _InfoBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: colorScheme.onPrimaryContainer, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: colorScheme.onPrimaryContainer, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _MoodVisual {
  final IconData icon;
  final Color color;
  final Color lightColor;
  final String label;

  const _MoodVisual(this.icon, this.color, this.lightColor, this.label);

  static _MoodVisual forLabel(String label) {
    switch (label.toLowerCase()) {
      case 'happy':
        return const _MoodVisual(
          Icons.sentiment_satisfied_rounded,
          Color(0xFF86B45B),
          Color(0xFFE6F4D8),
          'Happy',
        );
      case 'sad':
        return const _MoodVisual(
          Icons.sentiment_dissatisfied_rounded,
          Color(0xFF6B92C9),
          Color(0xFFE2ECF8),
          'Sad',
        );
      case 'angry':
        return const _MoodVisual(
          Icons.sentiment_very_dissatisfied_rounded,
          Color(0xFFD97964),
          Color(0xFFFCECE9),
          'Angry',
        );
      case 'neutral':
      default:
        return const _MoodVisual(
          Icons.sentiment_neutral_rounded,
          Color(0xFF9AA5AB),
          Color(0xFFEDF0F2),
          'Neutral',
        );
    }
  }
}

class _ResultView extends StatelessWidget {
  final AnalyzeResult result;

  const _ResultView({required this.result, super.key});

  @override
  Widget build(BuildContext context) {
    if (result.crisis) return _CrisisView(result: result);

    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final mood = _MoodVisual.forLabel(result.fusionResult.label);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _MoodBadge(mood: mood, confidence: result.fusionResult.confidence),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'What we noticed',
                  style: textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  result.responseMessage,
                  style: textTheme.bodyLarge?.copyWith(height: 1.6),
                ),
                const SizedBox(height: 24),
                Text(
                  'Your 3-day self-care plan',
                  style: textTheme.titleLarge,
                ),
                const SizedBox(height: 14),
                ...result.selfCarePlan.map(
                  (item) => _SelfCareItem(item: item, colorScheme: colorScheme),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MoodBadge extends StatelessWidget {
  final _MoodVisual mood;
  final double confidence;

  const _MoodBadge({required this.mood, required this.confidence});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 22),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [mood.lightColor, Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A2B3033),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: mood.color.withValues(alpha: 0.15),
            child: Icon(mood.icon, color: mood.color, size: 34),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Detected mood',
                  style: textTheme.bodySmall?.copyWith(color: const Color(0xFF6E787C)),
                ),
                const SizedBox(height: 2),
                Text(
                  mood.label,
                  style: textTheme.headlineSmall?.copyWith(color: mood.color),
                ),
                const SizedBox(height: 2),
                Text(
                  '${(confidence * 100).toStringAsFixed(0)}% confidence',
                  style: textTheme.bodyMedium?.copyWith(color: const Color(0xFF6E787C)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SelfCareItem extends StatelessWidget {
  final SelfCareItem item;
  final ColorScheme colorScheme;

  const _SelfCareItem({required this.item, required this.colorScheme});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer.withValues(alpha: 0.35),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${item.day}',
                style: textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: colorScheme.onPrimaryContainer,
                    ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F0F7),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                item.activity,
                style: textTheme.bodyLarge?.copyWith(height: 1.45),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CrisisView extends StatelessWidget {
  final AnalyzeResult result;

  const _CrisisView({required this.result});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: colorScheme.errorContainer,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colorScheme.error.withValues(alpha: 0.25), width: 1.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.warning_amber_rounded,
                      color: colorScheme.onErrorContainer, size: 28),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'You are not alone',
                      style: textTheme.headlineSmall
                          ?.copyWith(color: colorScheme.onErrorContainer),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                result.responseMessage,
                style: textTheme.bodyLarge?.copyWith(
                      color: colorScheme.onErrorContainer,
                      height: 1.55,
                    ),
              ),
              const SizedBox(height: 20),
              Text(
                'Please reach out now:',
                style: textTheme.titleLarge
                    ?.copyWith(color: colorScheme.onErrorContainer),
              ),
              const SizedBox(height: 12),
              ...result.hotlines.map(
                (h) => _HotlineTile(hotline: h, colorScheme: colorScheme),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (result.selfCarePlan.isNotEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Gentle self-care while you reach out',
                    style: textTheme.titleLarge,
                  ),
                  const SizedBox(height: 14),
                  ...result.selfCarePlan.map(
                    (item) => _SelfCareItem(item: item, colorScheme: colorScheme),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _HotlineTile extends StatelessWidget {
  final HotlineEntry hotline;
  final ColorScheme colorScheme;

  const _HotlineTile({required this.hotline, required this.colorScheme});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.error,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.phone, color: colorScheme.error, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hotline.name,
                  style: textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: colorScheme.onError,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  hotline.phone,
                  style: textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onError,
                      ),
                ),
                if (hotline.description.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      hotline.description,
                      style: textTheme.bodySmall
                          ?.copyWith(color: colorScheme.onError.withValues(alpha: 0.85)),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

