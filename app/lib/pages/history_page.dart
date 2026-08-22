import 'dart:async';

import 'package:flutter/material.dart';

import '../services/mood_log_service.dart';
import '../widgets/emoji_avatar.dart';
import '../widgets/emotion_chip.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  final _service = MoodLogService();
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
      final logs = await _service.fetchMoodLogs();
      setState(() {
        _logs = logs;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error =
            "Couldn't load your mood history. Check your connection and try again.";
        _loading = false;
      });
    }
  }

  Future<void> _togglePlan(Map<String, dynamic> plan) async {
    final completed = plan['completed_at'] != null;
    final newCompleted = !completed;
    try {
      await _service.toggleSelfCare(plan['id'] as String, newCompleted);
      setState(() {
        plan['completed_at'] =
            newCompleted ? DateTime.now().toIso8601String() : null;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not update plan: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mood History')),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildError()
                : _logs.isEmpty
                    ? const _EmptyHistoryView()
                    : _buildList(),
      ),
    );
  }

  Widget _buildList() {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: _logs.length,
        itemBuilder: (context, index) => _HistoryLogCard(
          log: _logs[index],
          onToggle: (plan) => unawaited(_togglePlan(plan)),
        ),
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
                '📔',
                style: TextStyle(fontSize: 48),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No check-ins yet',
              style: textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Your past moods and self-care plans will appear here.',
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

class _HistoryLogCard extends StatelessWidget {
  final Map<String, dynamic> log;
  final void Function(Map<String, dynamic> plan) onToggle;

  const _HistoryLogCard({required this.log, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    final createdAt = DateTime.parse(log['created_at'] as String);
    final date =
        '${createdAt.day.toString().padLeft(2, '0')}/${createdAt.month.toString().padLeft(2, '0')}/${createdAt.year}';
    final time =
        '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
    final mood = _MoodVisual.forLabel(log['fusion_result'] as String);
    final plans = (log['self_care_plans'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>();

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                EmojiAvatar(emoji: _moodEmoji(mood.label), size: 48),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      EmotionChip(
                        label: mood.label,
                        icon: mood.icon,
                        color: mood.color,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '$date · $time · ${log['source']}',
                        style: textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurface.withOpacity(0.55),
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (plans.isNotEmpty) ...[
              const SizedBox(height: 18),
              Text(
                'Self-care plan',
                style: textTheme.titleMedium,
              ),
              const SizedBox(height: 10),
              ...plans.map(
                (plan) => _HistoryPlanItem(
                  plan: plan,
                  onToggle: () => onToggle(plan),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

String _moodEmoji(String label) {
  return switch (label.toLowerCase()) {
    'happy' => '😊',
    'sad' => '😔',
    'angry' => '😠',
    _ => '😐',
  };
}

class _HistoryPlanItem extends StatelessWidget {
  final Map<String, dynamic> plan;
  final VoidCallback onToggle;

  const _HistoryPlanItem({required this.plan, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final completed = plan['completed_at'] != null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onToggle,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: completed
                ? colorScheme.primaryContainer.withOpacity(0.5)
                : colorScheme.surfaceContainerHighest.withOpacity(0.5),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: completed
                  ? colorScheme.primary.withOpacity(0.25)
                  : colorScheme.outline.withOpacity(0.2),
            ),
          ),
          child: Row(
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                transitionBuilder: (child, anim) =>
                    ScaleTransition(scale: anim, child: child),
                child: Icon(
                  completed ? Icons.check_circle_rounded : Icons.circle_outlined,
                  key: ValueKey(completed),
                  color: completed
                      ? colorScheme.primary
                      : colorScheme.onSurface.withOpacity(0.35),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '${plan['day_index']}. ${plan['activity']}',
                  style: textTheme.bodyMedium?.copyWith(
                        decoration:
                            completed ? TextDecoration.lineThrough : null,
                        color: completed
                            ? colorScheme.onSurface.withOpacity(0.55)
                            : colorScheme.onSurface,
                      ),
                ),
              ),
            ],
          ),
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
