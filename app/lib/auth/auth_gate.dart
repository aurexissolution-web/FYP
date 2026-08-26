import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../widgets/biometric_guard.dart';
import 'sign_in_page.dart';

class AuthGate extends StatelessWidget {
  final Widget Function(BuildContext context) authenticatedBuilder;
  final Widget Function(BuildContext context)? unauthenticatedBuilder;

  const AuthGate({
    super.key,
    required this.authenticatedBuilder,
    this.unauthenticatedBuilder,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final session = Supabase.instance.client.auth.currentSession;
        if (session != null) {
          return BiometricGuard(child: authenticatedBuilder(context));
        }
        return unauthenticatedBuilder?.call(context) ?? const SignInPage();
      },
    );
  }
}
