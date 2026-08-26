import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:emobuddy/main.dart';
import 'package:emobuddy/pages/landing_page.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(
      url: 'https://example.supabase.co',
      publishableKey: 'test-anon-key',
    );
  });

  testWidgets('Unauthenticated native user sees authentication choices', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const EmoBuddyApp(showOnboarding: false, showPrivacyConsent: false),
    );
    await tester.pump();

    expect(find.text('SIGN IN'), findsOneWidget);
    expect(find.text('CREATE ACCOUNT'), findsOneWidget);
  });

  testWidgets('Landing page presents the core navigation and hero', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1200, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const MaterialApp(home: LandingPage()));

    expect(find.byTooltip('Open navigation'), findsOneWidget);
    expect(
      find.text('Understand how you feel, one conversation at a time.'),
      findsOneWidget,
    );
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Sign Up'), findsOneWidget);
  });

  testWidgets('Landing sign-up action opens account creation', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1200, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const MaterialApp(home: LandingPage()));

    await tester.tap(find.text('Sign Up'));
    await tester.pumpAndSettle();

    expect(find.text('Create an account'), findsOneWidget);
    expect(find.text('SIGN UP'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(3));
  });
}
