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

  @override
  void initState() {
    super.initState();
    NotificationService.requestPermission().catchError((_) => false);
    NotificationService.scheduleDailyCheckIn().catchError((_) {});
  }

  final _pages = const [
    ChatScreen(),
    HistoryPage(),
    PlanPage(),
    ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: _pages,
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
            child: Container(
              decoration: BoxDecoration(
                // Semi-transparent so the blurred content behind shows
                // through slightly, for a subtle frosted-glass look.
                color: Theme.of(context).colorScheme.surface.withOpacity(0.7),
                border: Border.all(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).colorScheme.shadow.withOpacity(0.18),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: NavigationBar(
                selectedIndex: _index,
                onDestinationSelected: (i) => setState(() => _index = i),
                backgroundColor: Colors.transparent,
                elevation: 0,
                destinations: const [
                  NavigationDestination(
                    icon: Icon(Icons.chat_bubble_outline, size: 24),
                    selectedIcon: Icon(Icons.chat_bubble, size: 28),
                    label: 'Chat',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.history_outlined, size: 24),
                    selectedIcon: Icon(Icons.history, size: 28),
                    label: 'History',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.spa_outlined, size: 24),
                    selectedIcon: Icon(Icons.spa, size: 28),
                    label: 'Plan',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.person_outline, size: 24),
                    selectedIcon: Icon(Icons.person, size: 28),
                    label: 'Profile',
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
