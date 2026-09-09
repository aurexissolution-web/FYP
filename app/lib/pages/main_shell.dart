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
      onOpenPlan: () => setState(() => _index = 2),
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
    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _index,
        children: _pages,
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              height: 64,
              decoration: BoxDecoration(
                // Ink glass: the same dark floating pill as the website's nav,
                // so the app and the site read as one product. Inverts in dark mode.
                color: const Color(0xFF2E2A3A).withOpacity(0.92),
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Colors.white.withOpacity(0.12)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.32),
                    blurRadius: 30,
                    offset: const Offset(0, 14),
                  ),
                ],
              ),
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
    // Fixed colours -- the pill itself never changes with the app's theme,
    // so its content must not either.
    const onBar = Colors.white;
    const accent = Color(0xFFCEC2E8);
    final color = selected ? onBar : onBar.withOpacity(0.55);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOut,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: selected ? onBar.withOpacity(0.14) : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  selected ? data.selectedIcon : data.icon,
                  size: 21,
                  color: selected ? accent : color,
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
