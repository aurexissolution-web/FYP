import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../pages/privacy_consent_screen.dart';
import '../widgets/logo_hero.dart';

const _onboardingKey = 'has_seen_onboarding';
const _languageKey = 'app_language';

const _languages = [
  ('en', 'English'),
  ('ms', 'Bahasa Melayu'),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;
  String _language = 'en';

  late final _pages = [
    _OnboardingPage(
      language: _language,
      emoji: '👋',
      titleKey: 'welcome',
      bodyKey: 'welcomeBody',
    ),
    _OnboardingPage(
      language: _language,
      emoji: '🗣️',
      titleKey: 'talk',
      bodyKey: 'talkBody',
    ),
    _OnboardingPage(
      language: _language,
      emoji: '✨',
      titleKey: 'plan',
      bodyKey: 'planBody',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_languageKey) ?? 'en';
    if (mounted) setState(() => _language = saved);
  }

  Future<void> _setLanguage(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languageKey, value);
    setState(() => _language = value);
  }

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, true);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const PrivacyConsentScreen(),
      ),
    );
  }

  void _next() {
    if (_index < _pages.length - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    } else {
      _finish();
    }
  }

  String _t(String key) {
    return switch (key) {
      'welcome' => _language == 'ms' ? 'Selamat datang ke EmoBuddy' : 'Welcome to EmoBuddy',
      'welcomeBody' => _language == 'ms'
          ? 'Ruang selamat dan mesra untuk berkongsi perasaan anda — menerusi teks atau suara.'
          : 'A safe, friendly space to talk about how you feel — by text or voice.',
      'talk' => _language == 'ms' ? 'Bercakap atau rakam' : 'Talk or record',
      'talkBody' => _language == 'ms'
          ? 'Taip mesej pendek atau rakam nota suara. EmoBuddy akan mendengar.'
          : 'Type a short message or record a voice note. EmoBuddy is here to listen.',
      'plan' => _language == 'ms' ? 'Dapatkan pelan 3 hari' : 'Get a 3-day plan',
      'planBody' => _language == 'ms'
          ? 'Selepas perbualan, terima cadangan penjagaan diri kecil yang disesuaikan untuk anda.'
          : 'After chatting, get a small self-care plan tailored just for you.',
      'next' => _language == 'ms' ? 'Seterusnya' : 'Next',
      'getStarted' => _language == 'ms' ? 'Mula' : 'Get started',
      'skip' => _language == 'ms' ? 'Langkau' : 'Skip',
      _ => key,
    };
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: _finish,
                    child: Text(_t('skip')),
                  ),
                  DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _language,
                      icon: const Icon(Icons.language_rounded, size: 18),
                      borderRadius: BorderRadius.circular(12),
                      items: _languages.map((entry) {
                        return DropdownMenuItem<String>(
                          value: entry.$1,
                          child: Text(entry.$2),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) _setLanguage(value);
                      },
                    ),
                  ),
                ],
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemBuilder: (context, index) => _pages[index],
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _pages.length,
                  (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    width: i == _index ? 24 : 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: i == _index
                          ? colorScheme.primary
                          : colorScheme.outline.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _next,
                  child: Text(
                    _index == _pages.length - 1 ? _t('getStarted') : _t('next'),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  final String language;
  final String emoji;
  final String titleKey;
  final String bodyKey;

  const _OnboardingPage({
    required this.language,
    required this.emoji,
    required this.titleKey,
    required this.bodyKey,
  });

  String _t(String key) {
    return switch (key) {
      'welcome' => language == 'ms' ? 'Selamat datang ke EmoBuddy' : 'Welcome to EmoBuddy',
      'welcomeBody' => language == 'ms'
          ? 'Ruang selamat dan mesra untuk berkongsi perasaan anda — menerusi teks atau suara.'
          : 'A safe, friendly space to talk about how you feel — by text or voice.',
      'talk' => language == 'ms' ? 'Bercakap atau rakam' : 'Talk or record',
      'talkBody' => language == 'ms'
          ? 'Taip mesej pendek atau rakam nota suara. EmoBuddy akan mendengar.'
          : 'Type a short message or record a voice note. EmoBuddy is here to listen.',
      'plan' => language == 'ms' ? 'Dapatkan pelan 3 hari' : 'Get a 3-day plan',
      'planBody' => language == 'ms'
          ? 'Selepas perbualan, terima cadangan penjagaan diri kecil yang disesuaikan untuk anda.'
          : 'After chatting, get a small self-care plan tailored just for you.',
      _ => key,
    };
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const LogoHero(size: 120),
          const SizedBox(height: 40),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  colorScheme.primaryContainer,
                  colorScheme.secondaryContainer,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: colorScheme.shadow.withValues(alpha: 0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Text(emoji, style: const TextStyle(fontSize: 40)),
          ),
          const SizedBox(height: 40),
          Text(
            _t(titleKey),
            style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 14),
          Text(
            _t(bodyKey),
            style: textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSurface.withValues(alpha: 0.7),
                  height: 1.55,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
