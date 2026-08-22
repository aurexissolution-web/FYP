import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/analyze_result.dart';
import '../services/analyze_api.dart';
import '../services/session_service.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatMessage {
  final bool isUser;
  final String? text;
  final AnalyzeResult? result;
  final bool isError;
  final bool isLoading;

  _ChatMessage._({
    this.isUser = false,
    this.text,
    this.result,
    this.isError = false,
    this.isLoading = false,
  });

  factory _ChatMessage.user(String text) =>
      _ChatMessage._(isUser: true, text: text);

  factory _ChatMessage.aiText(String text) => _ChatMessage._(text: text);

  factory _ChatMessage.aiResult(AnalyzeResult result) =>
      _ChatMessage._(result: result);

  factory _ChatMessage.error(String text) =>
      _ChatMessage._(isError: true, text: text);

  factory _ChatMessage.loading() => _ChatMessage._(isLoading: true);
}

class _ChatPageState extends State<ChatPage> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  final _api = AnalyzeApi();
  final _sessionService = SessionService();

  final List<_ChatMessage> _messages = [];
  String _language = 'en';
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _messages.add(
      _ChatMessage.aiText(
        "Hi! I'm EmoBuddy. How are you feeling right now?",
      ),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();

    setState(() {
      _sending = true;
      _messages.add(_ChatMessage.user(text));
      _messages.add(_ChatMessage.loading());
    });
    _scrollToBottom();

    try {
      final result = await _api.analyze(text: text, language: _language);
      setState(() {
        _messages.removeLast();
        _messages.add(_ChatMessage.aiResult(result));
      });
      _scrollToBottom();

      try {
        await _sessionService.logResult(
          result,
          source: 'text',
          language: _language,
        );
      } catch (e) {
        setState(
          () => _messages.add(
            _ChatMessage.aiText(
              "I couldn't save this check-in right now, but your result is still here.",
            ),
          ),
        );
        _scrollToBottom();
      }
    } catch (e) {
      setState(() {
        _messages.removeLast();
        _messages.add(_ChatMessage.error(e.toString()));
      });
      _scrollToBottom();
    } finally {
      setState(() => _sending = false);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'EmoBuddy',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'en', label: Text('EN')),
                ButtonSegment(value: 'ms', label: Text('MS')),
              ],
              selected: {_language},
              onSelectionChanged: (s) => setState(() => _language = s.first),
              style: SegmentedButton.styleFrom(
                backgroundColor: Colors.white,
                selectedBackgroundColor: colorScheme.primaryContainer,
                selectedForegroundColor: colorScheme.onPrimaryContainer,
                side: const BorderSide(color: Color(0xFFD2D9DC)),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.history_outlined),
            tooltip: 'Mood history',
            onPressed: () => Navigator.of(context).pushNamed('/history'),
          ),
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Sign out',
            onPressed: () => Supabase.instance.client.auth.signOut(),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              itemCount: _messages.length,
              itemBuilder: (context, index) => _buildMessage(_messages[index]),
            ),
          ),
          _buildInput(),
        ],
      ),
    );
  }

  Widget _buildMessage(_ChatMessage message) {
    if (message.isUser) return _UserBubble(text: message.text ?? '');
    if (message.isLoading) return const _TypingBubble();
    if (message.isError) return _ErrorBubble(text: message.text ?? 'Error');
    if (message.result != null) {
      return _ResultBubble(
        result: message.result!,
        language: _language,
      );
    }
    return _AiBubble(child: Text(message.text ?? ''));
  }

  Widget _buildInput() {
    final colorScheme = Theme.of(context).colorScheme;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: InputDecoration(
                  hintText: 'How are you feeling?',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            FloatingActionButton.small(
              backgroundColor: colorScheme.primary,
              foregroundColor: colorScheme.onPrimary,
              onPressed: _sending ? null : _send,
              child: _sending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.send),
            ),
          ],
        ),
      ),
    );
  }
}

class _UserBubble extends StatelessWidget {
  final String text;

  const _UserBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: const BoxDecoration(
          color: Color(0xFFE8E0F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(4),
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(color: Color(0xFF2F3639)),
        ),
      ),
    );
  }
}

class _AiBubble extends StatelessWidget {
  final Widget child;
  final Color? color;

  const _AiBubble({required this.child, this.color});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.85,
        ),
        decoration: BoxDecoration(
          color: color ?? Colors.white,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(4),
            bottomRight: Radius.circular(20),
          ),
          border: color == null
              ? Border.all(color: const Color(0xFFE5EAEC))
              : null,
        ),
        child: child,
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    return _AiBubble(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(width: 10),
          const Text('Analyzing...'),
        ],
      ),
    );
  }
}

class _ErrorBubble extends StatelessWidget {
  final String text;

  const _ErrorBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return _AiBubble(
      color: colorScheme.errorContainer,
      child: Text(text, style: TextStyle(color: colorScheme.onErrorContainer)),
    );
  }
}

class _ResultBubble extends StatelessWidget {
  final AnalyzeResult result;
  final String language;

  const _ResultBubble({required this.result, required this.language});

  @override
  Widget build(BuildContext context) {
    if (result.crisis) return _CrisisView(result: result);

    final textTheme = Theme.of(context).textTheme;
    final mood = _moodVisual(result.fusionResult.label);
    final confidence =
        (result.fusionResult.confidence * 100).toStringAsFixed(0);

    return _AiBubble(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(mood.icon, color: mood.color, size: 24),
              const SizedBox(width: 8),
              Text(
                mood.label,
                style: textTheme.titleMedium?.copyWith(
                      color: mood.color,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(width: 8),
              Text(
                '$confidence% confident',
                style: textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            result.responseMessage,
            style: textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
          if (result.selfCarePlan.isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(
              '3-day self-care plan:',
              style: textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            ...result.selfCarePlan.map((i) => _SelfCareItem(item: i)),
          ],
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

    return _AiBubble(
      color: colorScheme.errorContainer,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(
                Icons.warning_amber_rounded,
                color: colorScheme.onErrorContainer,
              ),
              const SizedBox(width: 8),
              Text(
                'You are not alone',
                style: textTheme.titleMedium?.copyWith(
                      color: colorScheme.onErrorContainer,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            result.responseMessage,
            style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onErrorContainer,
                  height: 1.5,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            'Please reach out now:',
            style: textTheme.titleSmall?.copyWith(
                  color: colorScheme.onErrorContainer,
                ),
          ),
          ...result.hotlines.map(
            (h) => ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: Icon(
                Icons.phone,
                color: colorScheme.onErrorContainer,
                size: 20,
              ),
              title: Text(
                h.name,
                style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onErrorContainer,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              subtitle: h.phone.isNotEmpty
                  ? Text(
                      h.phone,
                      style: textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onErrorContainer,
                          ),
                    )
                  : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _SelfCareItem extends StatelessWidget {
  final SelfCareItem item;

  const _SelfCareItem({required this.item});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: colorScheme.primaryContainer,
            child: Text(
              '${item.day}',
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onPrimaryContainer,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              item.activity,
              style: Theme.of(context).textTheme.bodyMedium,
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
  final String label;

  _MoodVisual({required this.icon, required this.color, required this.label});
}

_MoodVisual _moodVisual(String label) {
  switch (label.toLowerCase()) {
    case 'happy':
      return _MoodVisual(
        icon: Icons.sentiment_satisfied_rounded,
        color: const Color(0xFF86B45B),
        label: 'Happy',
      );
    case 'sad':
      return _MoodVisual(
        icon: Icons.sentiment_dissatisfied_rounded,
        color: const Color(0xFF6B92C9),
        label: 'Sad',
      );
    case 'angry':
      return _MoodVisual(
        icon: Icons.sentiment_very_dissatisfied_rounded,
        color: const Color(0xFFD97964),
        label: 'Angry',
      );
    case 'neutral':
    default:
      return _MoodVisual(
        icon: Icons.sentiment_neutral_rounded,
        color: const Color(0xFF9AA5AB),
        label: 'Neutral',
      );
  }
}
