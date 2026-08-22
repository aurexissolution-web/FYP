import 'dart:ui';

import 'package:flutter/material.dart';

import '../services/notification_service.dart';
import 'chat_screen.dart';
import 'history_page.dart';
import 'plan_page.dart';
import 'profile_page.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  final _selectedSessionId = ValueNotifier<String?>(null);

  @override
  void initState() {
    super.initState();
    NotificationService.requestPermission().catchError((_) => false);
    NotificationService.scheduleDailyCheckIn().catchError((_) {});
  }

  @override
  void dispose() {
    _selectedSessionId.dispose();
    super.dispose();
  }

  late final _pages = [
    ChatScreen(
      sessionIdNotifier: _selectedSessionId,
      onBackToHistory: () => setState(() => _index = 1),
    ),
    HistoryPage(
      onSessionSelected: (id) {
        _selectedSessionId.value = id;
        setState(() => _index = 0);
      },
    ),
    PlanPage(
      onStartChat: () => setState(() => _index = 0),
    ),
    const ProfilePage(),
  ];

  static const List<_NavItemData> _items = [
    _NavItemData(
      icon: Icons.chat_bubble_outline,
      selectedIcon: Icons.chat_bubble,
      label: 'Chat',
    ),
    _NavItemData(
      icon: Icons.history_outlined,
      selectedIcon: Icons.history,
      label: 'History',
    ),
    _NavItemData(
      icon: Icons.spa_outlined,
      selectedIcon: Icons.spa,
      label: 'Plan',
    ),
    _NavItemData(
      icon: Icons.person_outline,
      selectedIcon: Icons.person,
      label: 'Profile',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: _pages,
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: Container(
              height: 68,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(32),
                // A faint primary/secondary tint over the frosted glass so
                // the bar reads as "branded" instead of plain gray-on-blur.
                gradient: LinearGradient(
                  colors: [
                    colorScheme.primary.withOpacity(0.22),
                    colorScheme.surface.withOpacity(0.55),
                    colorScheme.secondary.withOpacity(0.2),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(
                  color: colorScheme.outline.withOpacity(0.25),
                ),
                boxShadow: [
                  BoxShadow(
                    color: colorScheme.shadow.withOpacity(0.28),
                    blurRadius: 24,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              // A plain Row of equally-sized, centered tap targets --
              // guarantees the icons/labels line up evenly, unlike
              // NavigationBar's layout at non-default heights.
              child: Row(
                children: [
                  for (var i = 0; i < _items.length; i++)
                    Expanded(
                      child: _NavItem(
                        data: _items[i],
                        selected: i == _index,
                        onTap: () => setState(() => _index = i),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItemData {
  final IconData icon;
  final IconData selectedIcon;
  final String label;

  const _NavItemData({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });
}

class _NavItem extends StatelessWidget {
  final _NavItemData data;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({
    required this.data,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = selected
        ? colorScheme.onPrimaryContainer
        : colorScheme.onSurface.withOpacity(0.6);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                decoration: BoxDecoration(
                  color: selected
                      ? colorScheme.primaryContainer.withOpacity(0.9)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  selected ? data.selectedIcon : data.icon,
                  size: selected ? 22 : 20,
                  color: color,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                data.label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: color,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
