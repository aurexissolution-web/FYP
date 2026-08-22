import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

class NotificationService {
  static final _notifications = FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    tz_data.initializeTimeZones();
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings = InitializationSettings(iOS: iosSettings);
    await _notifications.initialize(settings: initSettings);
  }

  static Future<bool> requestPermission() async {
    final ios = _notifications.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    final result = await ios?.requestPermissions(
      alert: true,
      badge: true,
      sound: true,
    );
    return result ?? false;
  }

  static Future<void> scheduleDailyCheckIn({int hour = 9, int minute = 0}) async {
    await _notifications.zonedSchedule(
      id: 0,
      title: 'How are you feeling?',
      body: 'Take a moment to check in with EmoBuddy.',
      scheduledDate: _nextInstance(hour, minute),
      notificationDetails: const NotificationDetails(iOS: DarwinNotificationDetails()),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  static Future<void> schedulePlanReminders(
    List<String> activities, {
    int hour = 9,
    int minute = 0,
  }) async {
    await cancelPlanReminders();
    for (var i = 0; i < activities.length; i++) {
      final id = 100 + i;
      await _notifications.zonedSchedule(
        id: id,
        title: 'Day ${i + 1} self-care',
        body: activities[i],
        scheduledDate: _nextInstance(hour, minute).add(Duration(days: i)),
        notificationDetails: const NotificationDetails(iOS: DarwinNotificationDetails()),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      );
    }
  }

  static Future<void> cancelPlanReminders() async {
    for (var i = 0; i < 3; i++) {
      await _notifications.cancel(id: 100 + i);
    }
  }

  static tz.TZDateTime _nextInstance(int hour, int minute) {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }
}
