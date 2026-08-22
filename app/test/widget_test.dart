import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:emobuddy/main.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(
      url: 'https://example.supabase.co',
      publishableKey: 'test-anon-key',
    );
  });

  testWidgets('Unauthenticated user sees the sign-in page',
      (WidgetTester tester) async {
    await tester.pumpWidget(const EmoBuddyApp(
      showOnboarding: false,
      showPrivacyConsent: false,
    ));
    await tester.pump();

    expect(find.text('SIGN IN'), findsWidgets);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}
