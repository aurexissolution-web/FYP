import 'dart:async';

import 'package:flutter/material.dart';

import '../services/session_service.dart';
import '../widgets/emoji_avatar.dart';
import '../utils/mood_visuals.dart';
import '../widgets/emotion_chip.dart';

class HistoryPage extends StatefulWidget {
  final ValueChanged<String>? onSessionSelected;

  const HistoryPage({super.key, this.onSessionSelected});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  final _service = SessionService();
  List<Map<String, dynamic>> _logs = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final logs = await _service.getSessions();
      setState(() {
        _logs = logs;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error =
            "Couldn't load your conversations. Check your connection and try again.";
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Conversations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: _load,
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
              : _error != null
                  ? _buildError()
                  : _logs.isEmpty
                      ? const _EmptyHistoryView()
                      : _buildList(),
        ),
      ),
    );
  }

  Widget _buildList() {
    final grouped = _groupSessions(_logs);

    return RefreshIndicator(
      onRefresh: _load,
      displacement: 20,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
        children: [
          for (final entry in grouped) ...[
            Padding(
              padding: const EdgeInsets.only(top: 20, bottom: 8),
              child: Text(
                entry.label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withOpacity(0.5),
                    ),
              ),
            ),
            ...entry.logs.map(
              (log) => _HistorySessionCard(
                log: log,
                onTap: () => widget.onSessionSelected?.call(log['id'] as String),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildError() {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: colorScheme.error),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: textTheme.bodyLarge?.copyWith(
                    color: colorScheme.onSurface.withOpacity(0.7),
                  ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _GroupedSessions {
  final String label;
  final List<Map<String, dynamic>> logs;

  _GroupedSessions({required this.label, required this.logs});
}

List<_GroupedSessions> _groupSessions(List<Map<String, dynamic>> logs) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final yesterday = today.subtract(const Duration(days: 1));
  final weekAgo = today.subtract(const Duration(days: 7));

  final groups = <String, List<Map<String, dynamic>>>{'Today': [], 'Yesterday': [], 'This week': [], 'Earlier': []};

  for (final log in logs) {
    final createdAt = DateTime.parse(log['created_at'] as String);
    final date = DateTime(createdAt.year, createdAt.month, createdAt.day);
    if (date == today) {
      groups['Today']!.add(log);
    } else if (date == yesterday) {
      groups['Yesterday']!.add(log);
    } else if (date.isAfter(weekAgo)) {
      groups['This week']!.add(log);
    } else {
      groups['Earlier']!.add(log);
    }
  }

  return groups.entries
      .where((e) => e.value.isNotEmpty)
      .map((e) => _GroupedSessions(label: e.key, logs: e.value))
      .toList();
}

class _EmptyHistoryView extends StatelessWidget {
  const _EmptyHistoryView();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: const Text(
                '�',
                style: TextStyle(fontSize: 48),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No conversations yet',
              style: textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Start a chat from the Chat tab and it will appear here.',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurface.withOpacity(0.6),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistorySessionCard extends StatelessWidget {
  final Map<String, dynamic> log;
  final VoidCallback onTap;

  const _HistorySessionCard({required this.log, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final createdAt = DateTime.parse(log['created_at'] as String);
    final time =
        '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
    final mood = MoodVisual.forLabel(log['fusion_result'] as String? ?? 'neutral');
    final title = (log['title'] as String?) ?? 'Check-in';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              EmojiAvatar(
                emoji: moodEmoji(mood.label),
                size: 46,
                backgroundColor: mood.lightColor,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      time,
                      style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurface.withOpacity(0.55),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              EmotionChip(
                label: mood.label,
                icon: mood.icon,
                color: mood.color,
              ),
              const SizedBox(width: 4),
              Icon(
                Icons.chevron_right_rounded,
                color: colorScheme.onSurface.withOpacity(0.4),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}


