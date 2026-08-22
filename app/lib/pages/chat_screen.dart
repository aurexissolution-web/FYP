import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/analyze_result.dart';
import '../services/analyze_api.dart';
import '../services/audio_recorder_service.dart';
import '../services/session_service.dart';
import '../services/notification_service.dart';
import '../theme.dart';
import '../widgets/emoji_avatar.dart';
import '../widgets/typing_indicator.dart';

String _formatTime(DateTime time) {
  final hour = time.hour;
  final minute = time.minute.toString().padLeft(2, '0');
  final period = hour >= 12 ? 'PM' : 'AM';
  final displayHour = hour % 12 == 0 ? 12 : hour % 12;
  return '$displayHour:$minute $period';
}

enum _Sentiment { positive, negative, neutral }

class _MoodChipData {
  final String label;
  final String value;

  const _MoodChipData({required this.label, required this.value});
}

class ChatScreen extends StatefulWidget {
  final ValueNotifier<String?>? sessionIdNotifier;

  const ChatScreen({super.key, this.sessionIdNotifier});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatMessage {
  final bool isUser;
  final String? text;
  final bool isVoice;
  final int? durationSeconds;
  final AnalyzeResult? result;
  final bool isPlan;
  final bool isError;
  final bool isLoading;
  final DateTime timestamp;

  _ChatMessage._({
    this.isUser = false,
    this.text,
    this.isVoice = false,
    this.durationSeconds,
    this.result,
    this.isPlan = false,
    this.isError = false,
    this.isLoading = false,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory _ChatMessage.userText(String text, {DateTime? timestamp}) =>
      _ChatMessage._(isUser: true, text: text, timestamp: timestamp);

  factory _ChatMessage.userVoice(int seconds, {DateTime? timestamp}) =>
      _ChatMessage._(isUser: true, isVoice: true, durationSeconds: seconds, timestamp: timestamp);

  factory _ChatMessage.aiText(String text, {DateTime? timestamp}) =>
      _ChatMessage._(text: text, timestamp: timestamp);

  factory _ChatMessage.aiMood(AnalyzeResult result, {DateTime? timestamp}) =>
      _ChatMessage._(result: result, timestamp: timestamp);

  factory _ChatMessage.aiPlan(AnalyzeResult result, {DateTime? timestamp}) =>
      _ChatMessage._(result: result, isPlan: true, timestamp: timestamp);

  factory _ChatMessage.error(String text, {DateTime? timestamp}) =>
      _ChatMessage._(isError: true, text: text, timestamp: timestamp);

  factory _ChatMessage.loading({DateTime? timestamp}) =>
      _ChatMessage._(isLoading: true, timestamp: timestamp);
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  final _scroll = ScrollController();
  final _api = AnalyzeApi();
  final _sessionService = SessionService();
  final _recorder = AudioRecorderService();

  final List<_ChatMessage> _messages = [];
  final List<String> _conversation = [];
  int _conversationTurns = 0;
  String _language = 'en';
  bool _sending = false;
  bool _recording = false;
  bool _requestingPermission = false;
  int _elapsedSeconds = 0;
  bool _showScrollButton = false;
  bool _hasResult = false;
  String? _sessionId;
  ValueNotifier<String?>? _sessionIdNotifier;
  VoidCallback? _onSessionIdChanged;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _messages.add(
      _ChatMessage.aiText(
        _language == 'ms'
            ? 'Hai! Apa khabar hari ini?'
            : "Hi! I'm EmoBuddy. How are you feeling? Type or send a voice note.",
      ),
    );
    _scroll.addListener(_onScroll);

    if (widget.sessionIdNotifier != null) {
      _sessionIdNotifier = widget.sessionIdNotifier;
      _onSessionIdChanged = () {
        final id = _sessionIdNotifier!.value;
        if (id == null) {
          _startNewChat(notify: false, confirm: false);
        } else {
          _loadSession(id);
        }
      };
      _sessionIdNotifier!.addListener(_onSessionIdChanged!);
      final initialId = _sessionIdNotifier!.value;
      if (initialId != null) _loadSession(initialId);
    }
  }

  bool get _isWelcomeView => _conversationTurns == 0 && _messages.length <= 1;
  bool get _shouldShowPlanPrompt => !_hasResult && _conversationTurns >= 2;

  void _onScroll() {
    if (!_scroll.hasClients) return;
    final max = _scroll.position.maxScrollExtent;
    final current = _scroll.position.pixels;
    final nearBottom = max <= 0 || current >= max - 80;
    if (_showScrollButton != !nearBottom) {
      setState(() => _showScrollButton = !nearBottom);
    }
  }

  Future<void> _showMoreMenu() async {
    final colorScheme = Theme.of(context).colorScheme;
    final isMs = _language == 'ms';

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return SafeArea(
          child: Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: colorScheme.outline.withOpacity(0.25)),
              boxShadow: [
                BoxShadow(
                  color: colorScheme.shadow.withOpacity(0.2),
                  blurRadius: 24,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 8, bottom: 4),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: colorScheme.outline.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                ListTile(
                  leading: Icon(Icons.language_rounded, color: colorScheme.primary),
                  title: Text(isMs ? 'Bahasa' : 'Language'),
                  subtitle: Text(isMs ? 'Bahasa Melayu' : 'English'),
                  onTap: () {
                    setState(() => _language = _language == 'en' ? 'ms' : 'en');
                    Navigator.pop(sheetContext);
                  },
                ),
                ListTile(
                  leading: Icon(Icons.add_circle_outline_rounded, color: colorScheme.primary),
                  title: Text(isMs ? 'Sembang baharu' : 'New chat'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    _startNewChat();
                  },
                ),
                ListTile(
                  leading: Icon(Icons.settings_outlined, color: colorScheme.primary),
                  title: const Text('Settings'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    Navigator.of(context).pushNamed('/settings');
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _startNewChat({bool notify = true, bool confirm = true}) async {
    if (confirm && _conversation.isNotEmpty) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(
            _language == 'ms' ? 'Sembang baharu?' : 'Start a new chat?',
          ),
          content: Text(
            _language == 'ms'
                ? 'Perbualan semasa akan dikosongkan. Anda boleh dapatkan pelan dahulu jika belum.'
                : "This will clear the current conversation. Grab your plan first if you haven't yet.",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(_language == 'ms' ? 'Batal' : 'Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(_language == 'ms' ? 'Sembang baharu' : 'New chat'),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }
    _focusNode.unfocus();
    setState(() {
      _sessionId = null;
      _hasResult = false;
      _messages.clear();
      _conversation.clear();
      _conversationTurns = 0;
      _messages.add(
        _ChatMessage.aiText(
          _language == 'ms'
              ? 'Hai! Apa khabar hari ini?'
              : "Hi! I'm EmoBuddy. How are you feeling? Type or send a voice note.",
        ),
      );
    });
    if (notify) _sessionIdNotifier?.value = null;
  }

  String _shortTitle(String text) {
    final trimmed = text.trim();
    if (trimmed.length <= 30) return trimmed;
    return '${trimmed.substring(0, 30)}...';
  }

  Future<void> _loadSession(String? id) async {
    if (id == null || id == _sessionId) return;
    _focusNode.unfocus();
    setState(() => _sending = true);

    try {
      final rows = await _sessionService.getSessionMessages(id);
      final loaded = <_ChatMessage>[];
      final conversation = <String>[];
      for (final row in rows) {
        final role = row['role'] as String;
        final type = row['type'] as String;
        final content = row['content'] as String?;
        final metadata = row['metadata'] as Map<String, dynamic>?;
        final createdAt = DateTime.parse(row['created_at'] as String);

        if (role == 'user') {
          if (type == 'voice') {
            final duration = (metadata?['duration_seconds'] as num?)?.toInt() ?? 0;
            loaded.add(_ChatMessage.userVoice(duration, timestamp: createdAt));
          } else {
            final text = content ?? '';
            loaded.add(_ChatMessage.userText(text, timestamp: createdAt));
            conversation.add(text);
          }
        } else {
          if (type == 'text') {
            loaded.add(_ChatMessage.aiText(content ?? '', timestamp: createdAt));
          } else if (type == 'mood' || type == 'crisis' || type == 'plan') {
            final resultMap = metadata?['result'] as Map<String, dynamic>?;
            if (resultMap != null) {
              final result = AnalyzeResult.fromJson(resultMap);
              if (type == 'plan') {
                loaded.add(_ChatMessage.aiPlan(result, timestamp: createdAt));
              } else {
                loaded.add(_ChatMessage.aiMood(result, timestamp: createdAt));
              }
            }
          }
        }
      }

      setState(() {
        _sessionId = id;
        _messages.clear();
        _conversation
          ..clear()
          ..addAll(conversation);
        _conversationTurns = conversation.length;
        _hasResult = loaded.any((m) => m.result != null);
        _messages.addAll(loaded);
        _sending = false;
      });
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _sending = false;
        _messages.add(_ChatMessage.error('Could not load this conversation.'));
      });
      _scrollToBottom();
    }
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

  Future<void> _sendText() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    _controller.clear();
    _focusNode.unfocus();
    HapticFeedback.lightImpact();
    await _submitUserMessage(text);
  }

  /// Sends a user message (typed or from a quick-reply chip) and fetches
  /// the AI's reply, falling back to a canned local reply on API failure.
  Future<void> _submitUserMessage(String text) async {
    if (text.isEmpty || _sending) return;

    if (_isGreeting(text)) {
      setState(() {
        _messages.add(_ChatMessage.userText(text));
        _messages.add(_ChatMessage.aiText(_greetingReply));
      });
      _scrollToBottom();
      return;
    }

    _sessionId ??= await _sessionService.createSession(
      title: _shortTitle(text),
      language: _language,
    );

    await _sessionService.addMessage(
      sessionId: _sessionId!,
      role: 'user',
      type: 'text',
      content: text,
    );

    setState(() {
      _sending = true;
      _messages.add(_ChatMessage.userText(text));
      _conversation.add(text);
      _conversationTurns++;
      _messages.add(_ChatMessage.loading());
    });
    _scrollToBottom();

    try {
      final chatReply = await _api.getChatReply(
        messages: List<String>.from(_conversation),
        language: _language,
      );
      setState(() => _messages.removeLast());
      if (chatReply.crisis) {
        setState(() => _messages.add(_ChatMessage.aiText(chatReply.reply)));
        _scrollToBottom();
        setState(() => _sending = false);
        await _sessionService.addMessage(
          sessionId: _sessionId!,
          role: 'ai',
          type: 'text',
          content: chatReply.reply,
        );
        await _analyzeConversation();
        return;
      }
      setState(() => _messages.add(_ChatMessage.aiText(chatReply.reply)));
      await _sessionService.addMessage(
        sessionId: _sessionId!,
        role: 'ai',
        type: 'text',
        content: chatReply.reply,
      );
    } catch (e) {
      final reply = _conversationFollowUp(text, _conversationTurns);
      setState(() {
        _messages.removeLast();
        _messages.add(_ChatMessage.aiText(reply));
      });
      await _sessionService.addMessage(
        sessionId: _sessionId!,
        role: 'ai',
        type: 'text',
        content: reply,
      );
    } finally {
      setState(() => _sending = false);
    }
    _scrollToBottom();
  }

  Future<void> _sendVoice(String audioBase64, int duration) async {
    _sessionId ??= await _sessionService.createSession(
      title: 'Voice check-in',
      language: _language,
    );

    await _sessionService.addMessage(
      sessionId: _sessionId!,
      role: 'user',
      type: 'voice',
      content: null,
      metadata: {'duration_seconds': duration},
    );

    setState(() {
      _sending = true;
      _messages.add(_ChatMessage.userVoice(duration));
      _messages.add(_ChatMessage.loading());
    });
    _scrollToBottom();

    try {
      final result = await _api.analyze(
        audioBase64: audioBase64,
        language: _language,
      );
      await _showResult(result, source: 'voice');
    } catch (e) {
      setState(() {
        _messages.removeLast();
        _messages.add(_ChatMessage.error(_friendlyErrorMessage(e)));
      });
      _scrollToBottom();
    } finally {
      setState(() => _sending = false);
    }
  }

  Future<void> _showResult(
    AnalyzeResult result, {
    required String source,
    String? conversationText,
  }) async {
    setState(() {
      _messages.removeLast();
      _messages.add(_ChatMessage.aiMood(result));
      if (!result.crisis && result.selfCarePlan.isNotEmpty) {
        _messages.add(_ChatMessage.aiPlan(result));
      }
      _hasResult = true;
    });
    _scrollToBottom();

    try {
      _sessionId ??= await _sessionService.createSession(
        title: _shortTitle(conversationText ?? 'Voice check-in'),
        language: _language,
      );
      await _sessionService.saveAnalysis(
        sessionId: _sessionId!,
        result: result,
        source: source,
        language: _language,
        conversationText: conversationText,
      );
      if (!result.crisis && result.selfCarePlan.isNotEmpty) {
        final activities = result.selfCarePlan.map((i) => i.activity).toList();
        await NotificationService.schedulePlanReminders(
          activities,
        ).catchError((_) {});
      }
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
  }

  Future<void> _toggleRecording() async {
    if (_recording) {
      await _stopRecording();
      return;
    }

    setState(() => _requestingPermission = true);
    try {
      final granted = await _recorder.requestPermission();
      if (!granted) {
        setState(() => _requestingPermission = false);
        _showError('Microphone permission denied.');
        return;
      }
      await _recorder.start();
      HapticFeedback.mediumImpact();
      setState(() {
        _requestingPermission = false;
        _recording = true;
        _elapsedSeconds = 0;
      });
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        setState(() => _elapsedSeconds++);
        if (_elapsedSeconds >= 15) {
          _stopRecording();
        }
      });
    } catch (e) {
      setState(() => _requestingPermission = false);
      _showError('Could not start recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    _timer?.cancel();
    setState(() => _recording = false);
    HapticFeedback.lightImpact();
    try {
      final base64 = await _recorder.stop();
      final duration = _elapsedSeconds;
      if (base64 != null && base64.isNotEmpty) {
        await _sendVoice(base64, duration);
      }
    } catch (e) {
      _showError('Recording failed: $e');
    }
  }

  void _showError(String message) {
    setState(() => _messages.add(_ChatMessage.error(message)));
    _scrollToBottom();
  }

  /// Turns a raw network/API exception into a short, user-facing message
  /// instead of dumping the stack trace/exception text into the chat.
  String _friendlyErrorMessage(Object error) {
    // Log the real error for debugging without showing it to the user.
    debugPrint('EmoBuddy API error: $error');

    if (error is TimeoutException) {
      return _language == 'ms'
          ? 'Sambungan mengambil masa terlalu lama. Sila cuba lagi.'
          : "That took too long to respond. Please try again.";
    }
    if (error is AnalyzeApiException) {
      return _language == 'ms'
          ? 'Pelayan EmoBuddy menghadapi masalah. Sila cuba sebentar lagi.'
          : "EmoBuddy's server ran into a problem. Please try again shortly.";
    }
    return _language == 'ms'
        ? 'Tidak dapat menghubungi pelayan EmoBuddy. Semak sambungan internet anda dan cuba lagi.'
        : "Couldn't reach EmoBuddy's server. Check your connection and try again.";
  }

  Future<void> _analyzeConversation() async {
    if (_conversation.isEmpty || _sending) return;
    setState(() {
      _sending = true;
      _messages.add(_ChatMessage.loading());
    });
    _scrollToBottom();

    try {
      final result = await _api.analyzeConversation(
        messages: List<String>.from(_conversation),
        language: _language,
      );
      await _showResult(
        result,
        source: 'text',
        conversationText: _conversation.join('\n'),
      );
    } catch (e) {
      setState(() {
        _messages.removeLast();
        _messages.add(_ChatMessage.error(_friendlyErrorMessage(e)));
      });
      _scrollToBottom();
    } finally {
      setState(() => _sending = false);
    }
  }

  static final _rng = Random();

  String _conversationFollowUp(String text, int turn) {
    final isMs = _language == 'ms';
    final sentiment = _detectSentiment(text);
    final topic = _detectTopic(text);

    final options = _followUpOptions(sentiment, topic, turn, isMs);
    final base = options[_rng.nextInt(options.length)];

    if (turn == 2) {
      return isMs
          ? '$base Atau tekan "Dapatkan pelan saya" di bawah bila-bila anda sedia.'
          : '$base Or tap "Get my plan" below whenever you feel ready.';
    }
    return base;
  }

  _Sentiment _detectSentiment(String text) {
    final t = text.toLowerCase();
    const positive = [
      'happy',
      'good',
      'great',
      'fun',
      'excited',
      'love',
      'glad',
      'awesome',
      'nice',
      'relax',
      'calm',
      'better',
      'grateful',
      'amazing',
      'proud',
      'gembira',
      'baik',
      'best',
      'seronok',
      'lega',
    ];
    const negative = [
      'sad',
      'tired',
      'stress',
      'anxious',
      'angry',
      'upset',
      'bad',
      'depress',
      'worried',
      'lonely',
      'hurt',
      'cry',
      'pain',
      'hard',
      'difficult',
      'exhaust',
      'overwhelm',
      'scared',
      'afraid',
      'sedih',
      'penat',
      'takut',
      'marah',
      'risau',
    ];
    if (negative.any((w) => t.contains(w))) return _Sentiment.negative;
    if (positive.any((w) => t.contains(w))) return _Sentiment.positive;
    return _Sentiment.neutral;
  }

  String? _detectTopic(String text) {
    final t = text.toLowerCase();
    const topics = {
      'girlfriend': ['girlfriend', 'boyfriend', 'partner', 'relationship'],
      'family': [
        'family',
        'mom',
        'dad',
        'mother',
        'father',
        'parents',
        'keluarga',
      ],
      'work': ['work', 'job', 'boss', 'office', 'kerja'],
      'school': [
        'school',
        'exam',
        'study',
        'class',
        'college',
        'university',
        'peperiksaan',
      ],
      'friends': ['friend', 'friends', 'kawan'],
      'sleep': ['sleep', 'tidur', 'insomnia'],
    };
    for (final entry in topics.entries) {
      if (entry.value.any((w) => t.contains(w))) return entry.key;
    }
    return null;
  }

  List<String> _followUpOptions(
    _Sentiment sentiment,
    String? topic,
    int turn,
    bool isMs,
  ) {
    final topicPhraseEn = switch (topic) {
      'girlfriend' => ' about that',
      'family' => ' with your family',
      'work' => ' at work',
      'school' => ' with school',
      'friends' => ' with your friends',
      'sleep' => ' with your sleep',
      _ => '',
    };
    final topicPhraseMs = switch (topic) {
      'girlfriend' => ' tentang itu',
      'family' => ' dengan keluarga anda',
      'work' => ' di tempat kerja',
      'school' => ' dengan sekolah',
      'friends' => ' dengan kawan-kawan anda',
      'sleep' => ' dengan tidur anda',
      _ => '',
    };

    if (sentiment == _Sentiment.positive) {
      return isMs
          ? [
              'Bagus! Saya gembira dengar itu$topicPhraseMs. Apa yang menjadikannya begitu istimewa?',
              'Suka dengar itu! Ceritakan lagi apa yang berlaku.',
              'Itu hebat! Bagaimana perasaan anda sekarang?',
            ]
          : [
              "That's wonderful to hear! What made it feel that way$topicPhraseEn?",
              'I love that. Tell me a bit more about it.',
              "That's great! How are you feeling right now?",
            ];
    }
    if (sentiment == _Sentiment.negative) {
      return isMs
          ? [
              'Saya faham, itu tidak mudah$topicPhraseMs. Mahu ceritakan lebih lanjut?',
              'Maaf mendengar itu. Saya di sini untuk dengar, teruskan bila anda sedia.',
              'Itu terdengar berat. Apa yang paling membebankan anda sekarang?',
            ]
          : [
              "That sounds tough$topicPhraseEn. Do you want to tell me more about it?",
              "I'm sorry you're going through that. I'm here, take your time.",
              'That sounds like a lot to carry. What feels heaviest right now?',
            ];
    }
    if (turn == 1) {
      return isMs
          ? ['Terima kasih kerana berkongsi. Boleh ceritakan lebih lanjut?']
          : ['Thanks for sharing. Can you tell me a bit more about what happened?'];
    }
    return isMs
        ? [
            'Saya faham. Teruskan berkongsi jika anda mahu.',
            'Menarik. Apa lagi yang ada dalam fikiran anda?',
          ]
        : [
            'Got it, thanks for sharing that.',
            "I hear you. What else is on your mind?",
          ];
  }

  bool _isGreeting(String text) {
    final normalized = text
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z\s]'), '')
        .trim();
    const greetings = <String>{
      'hi',
      'hello',
      'hey',
      'heyy',
      'yo',
      'sup',
      'howdy',
      'morning',
      'good morning',
      'good afternoon',
      'good evening',
      'hola',
      'hai',
      'halo',
      'hey there',
      'selamat pagi',
      'selamat petang',
      'selamat malam',
    };
    return normalized.split(' ').length <= 4 && greetings.contains(normalized);
  }

  String get _greetingReply {
    if (_language == 'ms') {
      return 'Hai! Apa khabar? Ceritakan sedikit tentang perasaan anda hari ini.';
    }
    return 'Hey there! How are you feeling today? Tell me a bit about it.';
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _recorder.dispose();
    _controller.dispose();
    _focusNode.dispose();
    _scroll.dispose();
    if (_onSessionIdChanged != null) {
      _sessionIdNotifier?.removeListener(_onSessionIdChanged!);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;

    return Scaffold(
      appBar: AppBar(
        title: const _AppLogo(),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                colorScheme.primary.withOpacity(isLight ? 0.10 : 0.16),
                colorScheme.secondary.withOpacity(isLight ? 0.08 : 0.12),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        actions: [
          _SoftIconButton(
            icon: Icons.more_horiz_rounded,
            tooltip: _language == 'ms' ? 'Lagi' : 'More',
            onPressed: _showMoreMenu,
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: Container(
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
            ),
          ),
          // Soft, out-of-focus color "blobs" behind the chat content --
          // purely decorative, so they must never intercept touches.
          Positioned.fill(
            child: IgnorePointer(
              child: Stack(
                children: [
                  Positioned(
                    top: -80,
                    right: -60,
                    child: _BackgroundBlob(
                      size: 260,
                      color: colorScheme.primary,
                      opacity: isLight ? 0.16 : 0.22,
                    ),
                  ),
                  Positioned(
                    top: 220,
                    left: -100,
                    child: _BackgroundBlob(
                      size: 220,
                      color: colorScheme.secondary,
                      opacity: isLight ? 0.14 : 0.16,
                    ),
                  ),
                  Positioned(
                    bottom: 40,
                    right: -80,
                    child: _BackgroundBlob(
                      size: 240,
                      color: colorScheme.primary,
                      opacity: isLight ? 0.10 : 0.14,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned.fill(
            child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => _focusNode.unfocus(),
          child: SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: _isWelcomeView
                      ? _buildWelcomeView()
                      : ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                          itemCount: _messages.length,
                          itemBuilder: (context, index) => _AnimatedBubble(
                            key: ValueKey(index),
                            child: _buildMessageItem(index),
                          ),
                        ),
                ),
                // The mood shortcut chips are only shown on the welcome
                // screen (inside _buildWelcomeView) -- once a conversation
                // has started, only the plan-prompt chip appears here.
                if (_shouldShowPlanPrompt) _buildPlanPromptChip(),
                _buildComposer(),
              ],
            ),
          ),
        ),
      ),
          if (_showScrollButton)
            Positioned(
              right: 20,
              bottom: 100,
              child: FloatingActionButton.small(
                onPressed: _scrollToBottom,
                elevation: 4,
                backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: Icon(
                  Icons.keyboard_arrow_down,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMessageItem(int index) {
    final message = _messages[index];
    final separator = index > 0 && !_isSameDay(
      _messages[index - 1].timestamp,
      message.timestamp,
    )
        ? _buildDateSeparator(message.timestamp)
        : const SizedBox.shrink();

    return Column(
      children: [
        separator,
        _buildMessage(message),
      ],
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  Widget _buildDateSeparator(DateTime date) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final now = DateTime.now();
    String label;
    if (_isSameDay(date, now)) {
      label = 'Today';
    } else if (_isSameDay(
        date, now.subtract(const Duration(days: 1)))) {
      label = 'Yesterday';
    } else {
      label = '${date.day.toString().padLeft(2, '0')}/'
          '${date.month.toString().padLeft(2, '0')}/${date.year}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: colorScheme.outline.withOpacity(0.3))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              label,
              style: textTheme.labelSmall?.copyWith(
                    color: colorScheme.onSurface.withOpacity(0.5),
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
          Expanded(child: Divider(color: colorScheme.outline.withOpacity(0.3))),
        ],
      ),
    );
  }

  Widget _buildMessage(_ChatMessage message) {
    if (message.isUser) {
      if (message.isVoice) {
        return _VoiceBubble(
            seconds: message.durationSeconds ?? 0,
            timestamp: message.timestamp);
      }
      return _UserBubble(
          text: message.text ?? '', timestamp: message.timestamp);
    }
    if (message.isLoading) return const _TypingBubble();
    if (message.isError) return _ErrorBubble(text: message.text ?? 'Error');
    if (message.isPlan && message.result != null) {
      return _PlanBubble(result: message.result!);
    }
    if (message.result != null) {
      return _MoodBubble(result: message.result!);
    }
    return _AiTextBubble(
        text: message.text ?? '', timestamp: message.timestamp);
  }

  Widget _buildWelcomeView() {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  colorScheme.primary.withOpacity(0.18),
                  colorScheme.primary.withOpacity(0.0),
                ],
              ),
            ),
            child: const _AiAvatar(size: 80),
          ),
          const SizedBox(height: 24),
          Text(
            _language == 'ms' ? 'Apa khabar?' : 'How are you feeling?',
            style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            _language == 'ms'
                ? 'Kongsikan perasaan anda — taip atau rakam nota suara.'
                : 'Share how you feel — type or send a voice note.',
            style: textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSurface.withOpacity(0.6),
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          _buildQuickReplyChips(),
        ],
      ),
    );
  }

  Widget _buildQuickReplyChips() {
    final textTheme = Theme.of(context).textTheme;
    final chips = _language == 'ms'
        ? const [
            _MoodChipData(label: 'Cemas', value: 'Saya rasa cemas.'),
            _MoodChipData(label: 'Gembira', value: 'Saya rasa gembira!'),
            _MoodChipData(label: 'Letih', value: 'Saya rasa sangat letih.'),
            _MoodChipData(label: 'Sedih', value: 'Saya rasa sedih.'),
            _MoodChipData(label: 'Marah', value: 'Saya rasa marah.'),
            _MoodChipData(label: 'Perlu bantuan', value: 'Saya perlukan bantuan.'),
          ]
        : const [
            _MoodChipData(label: 'Stressed', value: 'I feel stressed.'),
            _MoodChipData(label: 'Happy', value: 'I feel happy!'),
            _MoodChipData(label: 'Tired', value: 'I feel really tired.'),
            _MoodChipData(label: 'Sad', value: 'I feel sad.'),
            _MoodChipData(label: 'Anxious', value: 'I feel anxious.'),
            _MoodChipData(label: 'Need help', value: 'I need help.'),
          ];

    return Center(
      child: Wrap(
        alignment: WrapAlignment.center,
        spacing: 10,
        runSpacing: 10,
        children: chips
            .asMap()
            .entries
            .map(
              (entry) {
                final accent =
                    AppTheme.moodAccents[entry.key % AppTheme.moodAccents.length];
                final chip = entry.value;
                return ActionChip(
                  label: Text(chip.label),
                  labelStyle: textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: accent,
                      ),
                  backgroundColor: accent.withOpacity(0.14),
                  side: BorderSide(color: accent.withOpacity(0.35)),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  onPressed: _sending || _recording
                      ? null
                      : () => _submitUserMessage(chip.value),
                );
              },
            )
            .toList(),
      ),
    );
  }

  Widget _buildPlanPromptChip() {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Material(
        color: colorScheme.primaryContainer.withOpacity(0.6),
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: _sending ? null : _analyzeConversation,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.spa,
                  color: colorScheme.onPrimaryContainer,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _language == 'ms'
                        ? 'Sedia untuk pelan penjagaan diri?'
                        : 'Ready for your self-care plan?',
                    style: textTheme.labelLarge?.copyWith(
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: colorScheme.onPrimaryContainer,
                  size: 18,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildComposer() {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: colorScheme.primary.withOpacity(0.25)),
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: colorScheme.primary.withOpacity(0.12),
            blurRadius: 24,
            spreadRadius: -6,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              textInputAction: TextInputAction.send,
              enabled: !_recording,
              onSubmitted: (_) => _sendText(),
              maxLines: null,
              decoration: InputDecoration(
                hintText: _recording
                    ? 'Recording... $_elapsedSeconds s'
                    : (_language == 'ms'
                          ? 'Apa yang anda rasa?'
                          : 'How are you feeling?'),
                hintStyle: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSurface.withOpacity(0.55),
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: _controller,
            builder: (context, value, child) {
              final hasText = value.text.trim().isNotEmpty;
              return AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                transitionBuilder: (child, anim) =>
                    ScaleTransition(scale: anim, child: child),
                child: _buildActionButton(hasText: hasText),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({required bool hasText}) {
    final colorScheme = Theme.of(context).colorScheme;

    if (_requestingPermission) {
      return const Padding(
        padding: EdgeInsets.all(12),
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    if (_recording) {
      return _RecordingMicButton(
        progress: _elapsedSeconds / 15,
        onPressed: _toggleRecording,
      );
    }

    if (hasText) {
      return _SendButton(
        key: const ValueKey('send'),
        onPressed: _sending ? null : _sendText,
        loading: _sending,
      );
    }

    return IconButton(
      key: const ValueKey('mic'),
      onPressed: _toggleRecording,
      icon: const Icon(Icons.mic),
      color: colorScheme.primary,
    );
  }
}

class _AppLogo extends StatelessWidget {
  const _AppLogo();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Emo',
          style: textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: colorScheme.onSurface,
          ),
        ),
        Text(
          'Buddy',
          style: textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: colorScheme.primary,
          ),
        ),
      ],
    );
  }
}

/// A large, soft-edged circle of color used to give the chat background a
/// gentle "aurora" feel instead of a flat wash. Purely decorative.
class _BackgroundBlob extends StatelessWidget {
  final double size;
  final Color color;
  final double opacity;

  const _BackgroundBlob({
    required this.size,
    required this.color,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            color.withOpacity(opacity),
            color.withOpacity(0),
          ],
        ),
      ),
    );
  }
}

class _AiAvatar extends StatelessWidget {
  final double size;

  const _AiAvatar({this.size = 34});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [colorScheme.primary, colorScheme.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: colorScheme.primary.withOpacity(0.25),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Center(
        child: Icon(
          Icons.auto_awesome_rounded,
          color: colorScheme.onPrimary,
          size: size * 0.45,
        ),
      ),
    );
  }
}

class _SoftIconButton extends StatelessWidget {
  final IconData icon;
  final String? tooltip;
  final VoidCallback? onPressed;

  const _SoftIconButton({
    required this.icon,
    this.tooltip,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Tooltip(
      message: tooltip ?? '',
      child: Material(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(14),
          child: SizedBox(
            width: 40,
            height: 40,
            child: Icon(
              icon,
              color: colorScheme.onSurface.withOpacity(0.75),
              size: 22,
            ),
          ),
        ),
      ),
    );
  }
}

class _AnimatedBubble extends StatefulWidget {
  final Widget child;

  const _AnimatedBubble({required this.child, super.key});

  @override
  State<_AnimatedBubble> createState() => _AnimatedBubbleState();
}

class _AnimatedBubbleState extends State<_AnimatedBubble>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 260),
    );
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.18),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _controller,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

class _UserBubble extends StatelessWidget {
  final String text;
  final DateTime timestamp;

  const _UserBubble({required this.text, required this.timestamp});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colorScheme.primary,
              colorScheme.primary.withOpacity(0.85),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(4),
          ),
          boxShadow: [
            BoxShadow(
              color: colorScheme.primary.withOpacity(0.18),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              text,
              style: TextStyle(
                color: colorScheme.onPrimary,
                fontSize: 15,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(timestamp),
              style: textTheme.labelSmall?.copyWith(
                    color: colorScheme.onPrimary.withOpacity(0.7),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VoiceBubble extends StatelessWidget {
  final int seconds;
  final DateTime timestamp;

  const _VoiceBubble({required this.seconds, required this.timestamp});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.6,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colorScheme.primary,
              colorScheme.primary.withOpacity(0.85),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(4),
          ),
          boxShadow: [
            BoxShadow(
              color: colorScheme.primary.withOpacity(0.18),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.mic, color: colorScheme.onPrimary, size: 20),
            const SizedBox(width: 8),
            Text(
              '$seconds s',
              style: TextStyle(color: colorScheme.onPrimary, fontSize: 15),
            ),
            const SizedBox(width: 8),
            Text(
              _formatTime(timestamp),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colorScheme.onPrimary.withOpacity(0.7),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AiTextBubble extends StatelessWidget {
  final String text;
  final DateTime timestamp;

  const _AiTextBubble({required this.text, required this.timestamp});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        const _AiAvatar(size: 34),
        const SizedBox(width: 8),
        Flexible(
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  colorScheme.surfaceContainerHighest,
                  Color.alphaBlend(
                    colorScheme.secondary.withOpacity(0.08),
                    colorScheme.surfaceContainerHighest,
                  ),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(20),
              ),
              border: Border.all(color: colorScheme.secondary.withOpacity(0.2)),
              boxShadow: [
                BoxShadow(
                  color: colorScheme.shadow.withOpacity(0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  text,
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontSize: 15,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatTime(timestamp),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colorScheme.onSurface.withOpacity(0.5),
                      ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        const _AiAvatar(size: 34),
        const SizedBox(width: 8),
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainerHighest,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
              bottomLeft: Radius.circular(4),
              bottomRight: Radius.circular(20),
            ),
            border: Border.all(color: colorScheme.outline.withOpacity(0.25)),
            boxShadow: [
              BoxShadow(
                color: colorScheme.shadow.withOpacity(0.12),
                blurRadius: 16,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [TypingIndicator(color: colorScheme.primary, dotSize: 7)],
          ),
        ),
      ],
    );
  }
}

class _ErrorBubble extends StatelessWidget {
  final String text;

  const _ErrorBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        const _AiAvatar(size: 34),
        const SizedBox(width: 8),
        Flexible(
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: colorScheme.errorContainer,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(20),
              ),
              border: Border.all(color: colorScheme.error.withOpacity(0.15)),
            ),
            child: Text(
              text,
              style: TextStyle(
                color: colorScheme.onErrorContainer,
                fontSize: 14,
                height: 1.45,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MoodBubble extends StatelessWidget {
  final AnalyzeResult result;

  const _MoodBubble({required this.result});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    if (result.crisis) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _AiAvatar(size: 40),
          const SizedBox(width: 8),
          Flexible(child: _CrisisView(result: result)),
        ],
      );
    }
    final mood = _moodVisual(result.fusionResult.label);
    final confidence = result.fusionResult.confidence;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        EmojiAvatar(emoji: _moodEmoji(mood.label), size: 40),
        const SizedBox(width: 8),
        Flexible(
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: colorScheme.outline.withOpacity(0.3)),
              boxShadow: [
                BoxShadow(
                  color: colorScheme.shadow.withOpacity(0.12),
                  blurRadius: 14,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        mood.lightColor,
                        colorScheme.surfaceContainerHighest,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(24),
                      topRight: Radius.circular(24),
                      bottomLeft: Radius.circular(12),
                      bottomRight: Radius.circular(12),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(mood.icon, color: mood.color, size: 28),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              mood.label,
                              style: textTheme.titleMedium?.copyWith(
                                color: mood.color,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: confidence,
                                minHeight: 6,
                                backgroundColor: colorScheme.outline
                                    .withOpacity(0.2),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  mood.color,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '${(confidence * 100).toStringAsFixed(0)}%',
                        style: textTheme.labelLarge?.copyWith(
                          color: mood.color,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(18),
                  child: Text(
                    result.responseMessage,
                    style: textTheme.bodyMedium?.copyWith(height: 1.55),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _PlanBubble extends StatelessWidget {
  final AnalyzeResult result;

  const _PlanBubble({required this.result});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final plans = result.selfCarePlan;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        EmojiAvatar(emoji: '✨', size: 40),
        const SizedBox(width: 8),
        Flexible(
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer.withOpacity(0.55),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(24),
              ),
              border: Border.all(color: colorScheme.primary.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Your 3-day self-care plan',
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 14),
                ...plans.asMap().entries.map((e) {
                  final index = e.key;
                  final item = e.value;
                  return _TimelineItem(
                    item: item,
                    isLast: index == plans.length - 1,
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final SelfCareItem item;
  final bool isLast;

  const _TimelineItem({required this.item, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: colorScheme.primary.withOpacity(0.25),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '${item.day}',
                    style: textTheme.labelLarge?.copyWith(
                      color: colorScheme.onPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: colorScheme.primary.withOpacity(0.2),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                item.activity,
                style: textTheme.bodyMedium?.copyWith(height: 1.45),
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

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: colorScheme.error.withOpacity(0.2),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: colorScheme.error.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: colorScheme.error.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.warning_amber_rounded,
                  color: colorScheme.error,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'You are not alone',
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onErrorContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            result.responseMessage,
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onErrorContainer,
              height: 1.55,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Please reach out now:',
            style: textTheme.titleSmall?.copyWith(
              color: colorScheme.onErrorContainer,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          ...result.hotlines.map(
            (h) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: colorScheme.error.withOpacity(0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Icon(Icons.phone, color: colorScheme.error, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          h.name,
                          style: textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onErrorContainer,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (h.phone.isNotEmpty)
                          Text(
                            h.phone,
                            style: textTheme.bodyMedium?.copyWith(
                              color: colorScheme.onErrorContainer,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SendButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final bool loading;

  const _SendButton({
    super.key,
    required this.onPressed,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.all(4),
      child: Material(
        color: colorScheme.primary,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onPressed,
          child: SizedBox(
            width: 42,
            height: 42,
            child: loading
                ? const Padding(
                    padding: EdgeInsets.all(10),
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Icon(Icons.send, color: colorScheme.onPrimary, size: 20),
          ),
        ),
      ),
    );
  }
}

class _RecordingMicButton extends StatefulWidget {
  final double progress;
  final VoidCallback onPressed;

  const _RecordingMicButton({required this.progress, required this.onPressed});

  @override
  State<_RecordingMicButton> createState() => _RecordingMicButtonState();
}

class _RecordingMicButtonState extends State<_RecordingMicButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        final scale = 1.0 + 0.08 * _pulseController.value;
        return Transform.scale(scale: scale, child: child);
      },
      child: Container(
        width: 56,
        height: 56,
        margin: const EdgeInsets.only(left: 4, right: 4),
        child: Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 52,
              height: 52,
              child: CircularProgressIndicator(
                value: widget.progress,
                strokeWidth: 5,
                backgroundColor: colorScheme.error.withOpacity(0.15),
                valueColor: AlwaysStoppedAnimation<Color>(colorScheme.error),
              ),
            ),
            Material(
              color: colorScheme.error,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: widget.onPressed,
                child: SizedBox(
                  width: 42,
                  height: 42,
                  child: Icon(Icons.stop, color: colorScheme.onError, size: 22),
                ),
              ),
            ),
          ],
        ),
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

_MoodVisual _moodVisual(String label) => _MoodVisual.forLabel(label);

String _moodEmoji(String label) {
  return switch (label.toLowerCase()) {
    'happy' => '😊',
    'sad' => '😔',
    'angry' => '😠',
    _ => '😐',
  };
}
