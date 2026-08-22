import 'package:flutter/material.dart';

import '../services/session_service.dart';
import '../utils/mood_visuals.dart';
import '../widgets/emoji_avatar.dart';
import '../widgets/emotion_chip.dart';

class PlanPage extends StatefulWidget {
  final VoidCallback? onStartChat;

  const PlanPage({super.key, this.onStartChat});

  @override
  State<PlanPage> createState() => _PlanPageState();
}

class _PlanPageState extends State<PlanPage> {
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
      final logs = await _service.fetchMoodLogs();
      setState(() {
        _logs = logs;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error =
            "Couldn't load your plan. Check your connection and try again.";
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

  List<Map<String, dynamic>> _sortedPlans(Map<String, dynamic> log) {
    final plans = (log['self_care_plans'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>();
    return plans.toList()
      ..sort((a, b) {
        final ai = (a['day_index'] as int?) ?? 0;
        final bi = (b['day_index'] as int?) ?? 0;
        return ai.compareTo(bi);
      });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;

    return Scaffold(
      appBar: AppBar(title: const Text('Self-care Plan')),
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
                  : _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    final logsWithPlans = _logs.where((log) {
      final plans = (log['self_care_plans'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      return plans.isNotEmpty;
    }).toList();

    if (logsWithPlans.isEmpty) {
      return _EmptyPlanView(onStartChat: widget.onStartChat);
    }

    final active = logsWithPlans.first;
    final previous = logsWithPlans.skip(1).toList();
    final plans = _sortedPlans(active);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _TodayTaskCard(
            log: active,
            plans: plans,
            onToggle: _togglePlan,
          ),
          const SizedBox(height: 20),
          _ThreeDayPlanCard(
            log: active,
            plans: plans,
            onToggle: _togglePlan,
          ),
          if (previous.isNotEmpty) ...[
            const SizedBox(height: 28),
            Text(
              'Previous plans',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 12),
            ...previous.map(
              (log) => _PastPlanCard(
                log: log,
                onToggle: _togglePlan,
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

DateTime _dateOnly(DateTime dt) => DateTime(dt.year, dt.month, dt.day);

String _formatDate(DateTime dt) =>
    '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';

String _formatTime(DateTime dt) =>
    '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

class _TodayTaskCard extends StatelessWidget {
  final Map<String, dynamic> log;
  final List<Map<String, dynamic>> plans;
  final void Function(Map<String, dynamic>) onToggle;

  const _TodayTaskCard({
    required this.log,
    required this.plans,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final planDate =
        _dateOnly(DateTime.parse(log['created_at'] as String).toLocal());
    final today = _dateOnly(DateTime.now());
    final allDone = plans.every((p) => p['completed_at'] != null);

    final Map<String, dynamic> targetPlan;
    final String label;
    if (allDone) {
      targetPlan = plans.first;
      label = 'Plan complete';
    } else {
      final todayPlan = plans.firstWhere(
        (p) {
          final dayIndex = (p['day_index'] as int?) ?? 1;
          return planDate.add(Duration(days: dayIndex - 1)) == today;
        },
        orElse: () => <String, dynamic>{},
      );
      if (todayPlan.isNotEmpty) {
        targetPlan = todayPlan;
        label = "Today's self-care";
      } else {
        final incomplete =
            plans.where((p) => p['completed_at'] == null).toList();
        targetPlan = incomplete.first;
        final dayIndex = (targetPlan['day_index'] as int?) ?? 1;
        final dueDate = planDate.add(Duration(days: dayIndex - 1));
        final daysDiff = dueDate.difference(today).inDays;
        if (daysDiff < 0) {
          label = 'Day $dayIndex · overdue';
        } else {
          label =
              'Day $dayIndex · due in $daysDiff ${daysDiff == 1 ? 'day' : 'days'}';
        }
      }
    }

    final completed = targetPlan['completed_at'] != null;

    return Container(
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: textTheme.labelLarge?.copyWith(
                        color: Colors.white.withOpacity(0.9),
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 10),
                Text(
                  '${targetPlan['activity']}',
                  style: textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        height: 1.25,
                      ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _progressText(plans),
                    style: textTheme.labelMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: () => onToggle(targetPlan),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: completed
                    ? Colors.white
                    : Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withOpacity(0.4),
                  width: 2,
                ),
              ),
              child: Center(
                child: completed
                    ? Icon(Icons.check,
                        color: colorScheme.primary, size: 28)
                    : const Icon(Icons.radio_button_unchecked,
                        color: Colors.white, size: 28),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _progressText(List<Map<String, dynamic>> plans) {
    final done = plans.where((p) => p['completed_at'] != null).length;
    return '$done of ${plans.length} done';
  }
}

class _ThreeDayPlanCard extends StatelessWidget {
  final Map<String, dynamic> log;
  final List<Map<String, dynamic>> plans;
  final void Function(Map<String, dynamic>) onToggle;

  const _ThreeDayPlanCard({
    required this.log,
    required this.plans,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final createdAt = DateTime.parse(log['created_at'] as String);
    final date = _formatDate(createdAt);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: colorScheme.outline.withOpacity(0.25)),
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow.withOpacity(0.1),
            blurRadius: 16,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your 3-day plan',
            style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            'From your check-in on $date',
            style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurface.withOpacity(0.6),
                ),
          ),
          const SizedBox(height: 16),
          ...plans.asMap().entries.map((e) {
            final index = e.key;
            final plan = e.value;
            return _PlanDayTile(
              plan: plan,
              logDate: createdAt,
              isLast: index == plans.length - 1,
              onToggle: () => onToggle(plan),
            );
          }),
        ],
      ),
    );
  }
}

class _PlanDayTile extends StatelessWidget {
  final Map<String, dynamic> plan;
  final DateTime logDate;
  final bool isLast;
  final VoidCallback onToggle;

  const _PlanDayTile({
    required this.plan,
    required this.logDate,
    required this.isLast,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final completed = plan['completed_at'] != null;
    final dayIndex = (plan['day_index'] as int?) ?? 1;
    final planDate = _dateOnly(logDate.toLocal());
    final today = _dateOnly(DateTime.now());
    final dueDate = planDate.add(Duration(days: dayIndex - 1));
    final isToday = dueDate == today;

    String status;
    if (completed) {
      status = 'Completed';
    } else if (isToday) {
      status = 'Today';
    } else if (dueDate.isBefore(today)) {
      status = 'Overdue';
    } else {
      final days = dueDate.difference(today).inDays;
      status = 'In $days ${days == 1 ? 'day' : 'days'}';
    }

    return GestureDetector(
      onTap: onToggle,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        margin: EdgeInsets.only(bottom: isLast ? 0 : 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: completed
              ? colorScheme.primaryContainer.withOpacity(0.5)
              : isToday
                  ? colorScheme.primaryContainer.withOpacity(0.2)
                  : colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: completed
                ? colorScheme.primary.withOpacity(0.25)
                : isToday
                    ? colorScheme.primary.withOpacity(0.35)
                    : colorScheme.outline.withOpacity(0.2),
            width: isToday ? 1.5 : 1,
          ),
          boxShadow: completed
              ? null
              : [
                  BoxShadow(
                    color: colorScheme.shadow.withOpacity(0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: completed
                    ? colorScheme.primary
                    : colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: completed
                    ? Icon(Icons.check,
                        color: colorScheme.onPrimary, size: 18)
                    : Text(
                        '$dayIndex',
                        style: textTheme.labelLarge?.copyWith(
                              color:
                                  colorScheme.onSurface.withOpacity(0.8),
                              fontWeight: FontWeight.w800,
                            ),
                      ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${plan['activity']}',
                    style: textTheme.bodyMedium?.copyWith(
                          decoration:
                              completed ? TextDecoration.lineThrough : null,
                          color: completed
                              ? colorScheme.onSurface.withOpacity(0.55)
                              : colorScheme.onSurface,
                          fontWeight:
                              isToday ? FontWeight.w700 : FontWeight.normal,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    status,
                    style: textTheme.labelSmall?.copyWith(
                          color: completed
                              ? colorScheme.primary
                              : colorScheme.onSurface.withOpacity(0.5),
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PastPlanCard extends StatelessWidget {
  final Map<String, dynamic> log;
  final void Function(Map<String, dynamic>) onToggle;

  const _PastPlanCard({
    required this.log,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final createdAt = DateTime.parse(log['created_at'] as String).toLocal();
    final date = _formatDate(createdAt);
    final time = _formatTime(createdAt);
    final fusion = log['fusion_result'] as String? ?? 'neutral';
    final mood = MoodVisual.forLabel(fusion);
    final plans = (log['self_care_plans'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>()
      ..sort((a, b) {
        final ai = (a['day_index'] as int?) ?? 0;
        final bi = (b['day_index'] as int?) ?? 0;
        return ai.compareTo(bi);
      });
    final completed = plans.where((p) => p['completed_at'] != null).length;
    final title = (log['title'] as String?) ?? 'Check-in';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24)),
        collapsedShape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        leading: EmojiAvatar(
          emoji: moodEmoji(mood.label),
          size: 42,
          gradient: [mood.lightColor, mood.lightColor],
        ),
        title: Text(
          '$title · $date',
          style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        subtitle: Row(
          children: [
            EmotionChip(
              label: mood.label,
              icon: mood.icon,
              color: mood.color,
            ),
            const SizedBox(width: 8),
            Text(
              '$completed of ${plans.length} done · $time',
              style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurface.withOpacity(0.6),
                  ),
            ),
          ],
        ),
        children: plans
            .map(
              (plan) => CheckboxListTile(
                value: plan['completed_at'] != null,
                onChanged: (_) => onToggle(plan),
                title: Text(
                  '${plan['day_index']}. ${plan['activity']}',
                  style: textTheme.bodyMedium,
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                controlAffinity: ListTileControlAffinity.leading,
                activeColor: colorScheme.primary,
                checkColor: colorScheme.onPrimary,
              ),
            )
            .toList(),
      ),
    );
  }
}

class _EmptyPlanView extends StatelessWidget {
  final VoidCallback? onStartChat;

  const _EmptyPlanView({this.onStartChat});

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
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [colorScheme.primary, colorScheme.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: colorScheme.primary.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: Icon(
                Icons.spa,
                color: colorScheme.onPrimary,
                size: 44,
              ),
            ),
            const SizedBox(height: 24),
            Text('No self-care plan yet', style: textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Complete a check-in to get your first 3-day plan.',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurface.withOpacity(0.6),
                  ),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onStartChat,
              icon: const Icon(Icons.chat_bubble_outline),
              label: const Text('Start a check-in'),
            ),
          ],
        ),
      ),
    );
  }
}
