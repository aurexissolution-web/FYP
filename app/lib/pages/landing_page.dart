import 'package:flutter/material.dart';

import '../auth/auth_gate.dart';
import '../auth/sign_in_page.dart';
import '../widgets/logo_hero.dart';
import 'main_shell.dart';

class LandingPage extends StatefulWidget {
  const LandingPage({super.key});

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> {
  final _scrollController = ScrollController();
  final _homeKey = GlobalKey();
  final _aboutKey = GlobalKey();
  final _howItWorksKey = GlobalKey();

  Future<void> _scrollTo(GlobalKey key) async {
    final context = key.currentContext;
    if (context == null) return;
    await Scrollable.ensureVisible(
      context,
      duration: const Duration(milliseconds: 550),
      curve: Curves.easeOutCubic,
      alignment: 0.05,
    );
  }

  void _openAuth({required bool signUp}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AuthGate(
          authenticatedBuilder: (_) => const MainShell(),
          unauthenticatedBuilder: (_) => SignInPage(initialSignUp: signUp),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F6FB),
      body: SelectionArea(
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverAppBar(
              pinned: true,
              toolbarHeight: 76,
              backgroundColor: const Color(0xFFF8F6FB).withValues(alpha: 0.96),
              surfaceTintColor: Colors.transparent,
              titleSpacing: 0,
              title: _PageWidth(child: _buildNavigation(context)),
            ),
            SliverToBoxAdapter(child: _buildHero(context)),
            SliverToBoxAdapter(child: _buildAbout(context)),
            SliverToBoxAdapter(child: _buildHowItWorks(context)),
            SliverToBoxAdapter(child: _buildFinalCta(context)),
            SliverToBoxAdapter(child: _buildFooter(context)),
          ],
        ),
      ),
    );
  }

  Widget _buildNavigation(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 900;
    return Row(
      children: [
        const LogoHero(size: 46),
        const SizedBox(width: 10),
        Text(
          'EmoBuddy',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: const Color(0xFF2E2A3A),
          ),
        ),
        const Spacer(),
        if (!compact) ...[
          _navButton('Home', () => _scrollTo(_homeKey)),
          _navButton('About', () => _scrollTo(_aboutKey)),
          _navButton('How It Works', () => _scrollTo(_howItWorksKey)),
          const SizedBox(width: 12),
        ],
        TextButton(
          onPressed: () => _openAuth(signUp: false),
          child: const Text('Sign In'),
        ),
        const SizedBox(width: 8),
        FilledButton(
          onPressed: () => _openAuth(signUp: true),
          style: FilledButton.styleFrom(
            padding: EdgeInsets.symmetric(
              horizontal: compact ? 14 : 20,
              vertical: 13,
            ),
          ),
          child: const Text('Sign Up'),
        ),
        if (compact)
          PopupMenuButton<String>(
            tooltip: 'Open navigation',
            onSelected: (value) {
              if (value == 'home') _scrollTo(_homeKey);
              if (value == 'about') _scrollTo(_aboutKey);
              if (value == 'how') _scrollTo(_howItWorksKey);
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'home', child: Text('Home')),
              PopupMenuItem(value: 'about', child: Text('About')),
              PopupMenuItem(value: 'how', child: Text('How It Works')),
            ],
          ),
      ],
    );
  }

  Widget _navButton(String label, VoidCallback onPressed) {
    return TextButton(onPressed: onPressed, child: Text(label));
  }

  Widget _buildHero(BuildContext context) {
    return Container(
      key: _homeKey,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF8F6FB), Color(0xFFE4F2F0)],
        ),
      ),
      child: _PageWidth(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 80),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final stacked = constraints.maxWidth < 820;
              final copy = _heroCopy(context);
              final preview = const _ChatPreview();
              return stacked
                  ? Column(
                      children: [copy, const SizedBox(height: 48), preview],
                    )
                  : Row(
                      children: [
                        Expanded(flex: 11, child: copy),
                        const SizedBox(width: 72),
                        Expanded(flex: 9, child: preview),
                      ],
                    );
            },
          ),
        ),
      ),
    );
  }

  Widget _heroCopy(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFE8E0F3),
            borderRadius: BorderRadius.circular(99),
          ),
          child: const Text(
            'A calmer space for your emotions',
            style: TextStyle(
              color: Color(0xFF6B5B8A),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Understand how you feel, one conversation at a time.',
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
            color: const Color(0xFF2E2A3A),
            fontWeight: FontWeight.w800,
            height: 1.1,
            letterSpacing: -1.2,
          ),
        ),
        const SizedBox(height: 22),
        Text(
          'EmoBuddy helps you check in through text or voice, reflect on your emotions, and take small, caring steps forward.',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: const Color(0xFF625D6D),
            fontSize: 18,
            height: 1.6,
          ),
        ),
        const SizedBox(height: 32),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            FilledButton.icon(
              onPressed: () => _openAuth(signUp: true),
              icon: const Icon(Icons.arrow_forward_rounded),
              label: const Text('Get Started Free'),
            ),
            OutlinedButton(
              onPressed: () => _scrollTo(_howItWorksKey),
              child: const Text('See How It Works'),
            ),
          ],
        ),
        const SizedBox(height: 20),
        const Text(
          'Private by design · English and Bahasa Melayu · Available anytime',
          style: TextStyle(color: Color(0xFF7A7489), fontSize: 13),
        ),
      ],
    );
  }

  Widget _buildAbout(BuildContext context) {
    return Container(
      key: _aboutKey,
      color: Colors.white,
      child: _PageWidth(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 88),
          child: Column(
            children: [
              const _SectionHeading(
                eyebrow: 'ABOUT EMOBUDDY',
                title: 'Support that starts by listening',
                body:
                    'EmoBuddy is an emotion-aware wellbeing companion designed to help you pause, express yourself, and better understand your day.',
              ),
              const SizedBox(height: 44),
              LayoutBuilder(
                builder: (context, constraints) {
                  final cards = [
                    const _FeatureCard(
                      icon: Icons.chat_bubble_outline_rounded,
                      title: 'Supportive chat',
                      body:
                          'Share what is on your mind in a calm, judgment-free conversation.',
                      color: Color(0xFFE8E0F3),
                    ),
                    const _FeatureCard(
                      icon: Icons.mic_none_rounded,
                      title: 'Text or voice',
                      body:
                          'Check in in the way that feels most natural to you.',
                      color: Color(0xFFD6EBE8),
                    ),
                    const _FeatureCard(
                      icon: Icons.spa_outlined,
                      title: 'Personalized steps',
                      body:
                          'Receive practical self-care ideas and a focused three-day plan.',
                      color: Color(0xFFFFE8D7),
                    ),
                  ];
                  if (constraints.maxWidth < 760) {
                    return Column(
                      children: cards
                          .map(
                            (card) => Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: card,
                            ),
                          )
                          .toList(),
                    );
                  }
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: cards
                        .map(
                          (card) => Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                              ),
                              child: card,
                            ),
                          ),
                        )
                        .toList(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHowItWorks(BuildContext context) {
    const steps = [
      (
        '01',
        'Create your account',
        'Sign up securely so your check-ins and conversations stay connected to you.',
      ),
      (
        '02',
        'Share how you feel',
        'Type a message or record a short voice note in English or Bahasa Melayu.',
      ),
      (
        '03',
        'Talk with EmoBuddy',
        'Continue the conversation and receive gentle, relevant support.',
      ),
      (
        '04',
        'Take the next step',
        'Review your history and follow a simple personalized self-care plan.',
      ),
    ];
    return Container(
      key: _howItWorksKey,
      child: _PageWidth(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 88),
          child: Column(
            children: [
              const _SectionHeading(
                eyebrow: 'HOW IT WORKS',
                title: 'A simple check-in can make a difference',
                body:
                    'Get started in minutes. EmoBuddy keeps the experience clear, supportive, and focused on small steps.',
              ),
              const SizedBox(height: 48),
              LayoutBuilder(
                builder: (context, constraints) {
                  final width = constraints.maxWidth < 720
                      ? constraints.maxWidth
                      : (constraints.maxWidth - 24) / 2;
                  return Wrap(
                    spacing: 24,
                    runSpacing: 24,
                    children: steps
                        .map(
                          (step) => SizedBox(
                            width: width,
                            child: _StepCard(
                              number: step.$1,
                              title: step.$2,
                              body: step.$3,
                            ),
                          ),
                        )
                        .toList(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFinalCta(BuildContext context) {
    return _PageWidth(
      child: Container(
        margin: const EdgeInsets.only(bottom: 72),
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 54),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6B5B8A), Color(0xFF577F83)],
          ),
          borderRadius: BorderRadius.circular(32),
        ),
        child: Column(
          children: [
            Text(
              'Ready to check in with yourself?',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Create an account and start your first conversation with EmoBuddy.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: () => _openAuth(signUp: true),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF6B5B8A),
              ),
              child: const Text('Create Your Account'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      color: const Color(0xFF2E2A3A),
      child: _PageWidth(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 36),
          child: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 32,
            runSpacing: 18,
            children: [
              const Text(
                'EmoBuddy · Final Year Project',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                'EmoBuddy is not a replacement for professional or emergency mental health support.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.65),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PageWidth extends StatelessWidget {
  final Widget child;

  const _PageWidth({required this.child});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1180),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: child,
        ),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String body;

  const _SectionHeading({
    required this.eyebrow,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 720),
      child: Column(
        children: [
          Text(
            eyebrow,
            style: const TextStyle(
              color: Color(0xFF6B5B8A),
              fontWeight: FontWeight.w800,
              letterSpacing: 1.6,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: const Color(0xFF2E2A3A),
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            body,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: const Color(0xFF6E6878)),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String body;
  final Color color;

  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.body,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        color: const Color(0xFFFAF9FC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE8E4ED)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: const Color(0xFF5F5475)),
          ),
          const SizedBox(height: 22),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          Text(
            body,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: const Color(0xFF6E6878)),
          ),
        ],
      ),
    );
  }
}

class _StepCard extends StatelessWidget {
  final String number;
  final String title;
  final String body;

  const _StepCard({
    required this.number,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          number,
          style: const TextStyle(
            color: Color(0xFF7FB9B4),
            fontSize: 32,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                body,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF6E6878),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ChatPreview extends StatelessWidget {
  const _ChatPreview();

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 430),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F40394F),
            blurRadius: 40,
            offset: Offset(0, 20),
          ),
        ],
      ),
      child: Column(
        children: [
          const Row(
            children: [
              LogoHero(size: 42),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'EmoBuddy',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                ),
              ),
              CircleAvatar(radius: 5, backgroundColor: Color(0xFF7FB9B4)),
            ],
          ),
          const Divider(height: 32),
          _bubble('How are you feeling today?', false),
          const SizedBox(height: 12),
          _bubble('I have been feeling overwhelmed with my studies.', true),
          const SizedBox(height: 12),
          _bubble(
            'That sounds like a lot to carry. Would you like to take a small pause and unpack what feels most urgent?',
            false,
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F0F7),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Row(
              children: [
                Expanded(
                  child: Text(
                    'Share what is on your mind...',
                    style: TextStyle(color: Color(0xFF8A8492)),
                  ),
                ),
                Icon(Icons.mic_none_rounded, color: Color(0xFF6B5B8A)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _bubble(String text, bool user) {
    return Align(
      alignment: user ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 310),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: user ? const Color(0xFF6B5B8A) : const Color(0xFFDDEEEB),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: user ? Colors.white : const Color(0xFF354C49),
            height: 1.4,
          ),
        ),
      ),
    );
  }
}
