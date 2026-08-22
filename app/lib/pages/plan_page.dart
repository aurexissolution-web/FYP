import 'package:flutter/material.dart';

import '../services/mood_log_service.dart';

class PlanPage extends StatefulWidget {
  const PlanPage({super.key});

  @override
  State<PlanPage> createState() => _PlanPageState();
}

class _PlanPageState extends State<PlanPage> {
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
        _error = "Couldn't load your plan. Check your connection and try again.";
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
                  : _logs.isEmpty
                      ? const _EmptyPlanView()
                      : _buildPlan(),
        ),
      ),
    );
  }

  Widget _buildPlan() {
    final latest = _logs.first;
    final older = _logs.skip(1).toList();
    final plans = (latest['self_care_plans'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>();
    final completed = plans.where((p) => p['completed_at'] != null).length;
    final total = plans.length;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _ProgressHeader(
            completed: completed,
            total: total,
            plans: plans,
            onToggle: _togglePlan,
          ),
          const SizedBox(height: 20),
          _LatestPlanCard(
            log: latest,
            plans: plans,
            onToggle: _togglePlan,
          ),
          if (older.isNotEmpty) ...[
            const SizedBox(height: 28),
            Text(
              'Previous plans',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 12),
            ...older.map((log) => _PastPlanCard(
                  log: log,
                  onToggle: _togglePlan,
                )),
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

class _ProgressHeader extends StatelessWidget {
  final int completed;
  final int total;
  final List<Map<String, dynamic>> plans;
  final void Function(Map<String, dynamic>) onToggle;

  const _ProgressHeader({
    required this.completed,
    required this.total,
    required this.plans,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final value = total == 0 ? 0.0 : completed / total;
    final allDone = plans.every((p) => p['completed_at'] != null);

    String message;
    if (value == 0) {
      message = 'A small step today can mean a lot.';
    } else if (value < 1) {
      message = 'Keep going — you are doing great.';
    } else {
      message = 'All done! Be proud of yourself.';
    }

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
          SizedBox(
            width: 78,
            height: 78,
            child: TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0, end: value),
              duration: const Duration(milliseconds: 800),
              curve: Curves.easeOutCubic,
              builder: (context, v, child) {
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: v,
                      strokeWidth: 8,
                      backgroundColor: Colors.white.withOpacity(0.25),
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Colors.white,
                      ),
                    ),
                    Text(
                      '${(v * 100).round()}%',
                      style: textTheme.titleSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                  ],
                );
              },
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$completed of $total completed',
                  style: textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withOpacity(0.9),
                      ),
                ),
                if (!allDone && plans.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: GestureDetector(
                      onTap: () {
                        final incomplete = plans
                            .where((p) => p['completed_at'] == null)
                            .toList();
                        for (final p in incomplete) {
                          onToggle(p);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.done_all, color: Colors.white, size: 16),
                            SizedBox(width: 6),
                            Text(
                              'Mark all done',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
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

class _LatestPlanCard extends StatelessWidget {
  final Map<String, dynamic> log;
  final List<Map<String, dynamic>> plans;
  final void Function(Map<String, dynamic>) onToggle;

  const _LatestPlanCard({
    required this.log,
    required this.plans,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final createdAt = DateTime.parse(log['created_at'] as String);
    final date =
        '${createdAt.day.toString().padLeft(2, '0')}/${createdAt.month.toString().padLeft(2, '0')}/${createdAt.year}';

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
          const SizedBox(height: 20),
          ...plans.asMap().entries.map((e) {
            final index = e.key;
            final plan = e.value;
            return _PlanDayTile(
              plan: plan,
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
  final bool isLast;
  final VoidCallback onToggle;

  const _PlanDayTile({
    required this.plan,
    required this.isLast,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final completed = plan['completed_at'] != null;

    return GestureDetector(
      onTap: onToggle,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        margin: EdgeInsets.only(bottom: isLast ? 0 : 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: completed
              ? colorScheme.primaryContainer.withOpacity(0.5)
              : colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: completed
                ? colorScheme.primary.withOpacity(0.25)
                : colorScheme.outline.withOpacity(0.2),
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
                        '${plan['day_index']}',
                        style: textTheme.labelLarge?.copyWith(
                              color: colorScheme.onSurface
                                  .withOpacity(0.8),
                              fontWeight: FontWeight.w800,
                            ),
                      ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                '${plan['activity']}',
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
    final createdAt = DateTime.parse(log['created_at'] as String);
    final date =
        '${createdAt.day.toString().padLeft(2, '0')}/${createdAt.month.toString().padLeft(2, '0')}/${createdAt.year}';
    final fusion = log['fusion_result'] as String? ?? 'mood';
    final plans = (log['self_care_plans'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>();
    final completed = plans.where((p) => p['completed_at'] != null).length;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        collapsedShape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Plan from $date', style: textTheme.titleMedium),
        subtitle: Text(
          '$completed of ${plans.length} completed · $fusion',
          style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurface.withOpacity(0.6),
              ),
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
  const _EmptyPlanView();

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
          ],
        ),
      ),
    );
  }
}
