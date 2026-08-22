import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

enum _AuthMode { welcome, form }

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  _AuthMode _mode = _AuthMode.welcome;
  bool _isSignUp = false;
  bool _loading = false;
  String? _error;
  String? _info;

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;

    if (_isSignUp && password != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }

    if (email.isEmpty || password.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });

    try {
      final auth = Supabase.instance.client.auth;
      if (_isSignUp) {
        await auth.signUp(email: email, password: password);
        setState(() {
          _info = 'Account created. If email confirmation is enabled, check '
              'your inbox, then sign in.';
          _isSignUp = false;
          _confirmPasswordController.clear();
        });
      } else {
        await auth.signInWithPassword(email: email, password: password);
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showSocialComingSoon(String name) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.white,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: Text(
          '$name sign-in is not configured yet.',
          style: const TextStyle(color: Color(0xFF7B4E8C)),
        ),
      ),
    );
  }

  void _setMode(_AuthMode mode, {bool isSignUp = false}) {
    setState(() {
      _mode = mode;
      _isSignUp = isSignUp;
      _error = null;
      _info = null;
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF7B4E8C),
      resizeToAvoidBottomInset: true,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFB85B8F),
              Color(0xFF8F4E8E),
              Color(0xFF6B4E8C),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 400),
              transitionBuilder: (child, animation) => ScaleTransition(
                scale: Tween<double>(begin: 0.98, end: 1).animate(
                  CurvedAnimation(parent: animation, curve: Curves.easeOut),
                ),
                child: FadeTransition(opacity: animation, child: child),
              ),
              child: _mode == _AuthMode.welcome
                  ? _buildWelcome()
                  : _buildForm(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWelcome() {
    return Column(
      key: const ValueKey('welcome'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Spacer(flex: 2),
        Center(
          child: Container(
            width: 220,
            height: 220,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(48),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.25),
                  blurRadius: 32,
                  offset: const Offset(0, 14),
                ),
              ],
            ),
            padding: const EdgeInsets.all(20),
            child: Image.asset(
              'assets/logo_full.png',
              fit: BoxFit.contain,
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'A quiet space to check in with yourself.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white70,
            fontSize: 16,
            height: 1.4,
          ),
        ),
        const Spacer(flex: 3),
        _pillButton(
          label: 'SIGN IN',
          onPressed: () => _setMode(_AuthMode.form, isSignUp: false),
        ),
        const SizedBox(height: 16),
        _pillButton(
          label: 'SIGN UP',
          onPressed: () => _setMode(_AuthMode.form, isSignUp: true),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      key: const ValueKey('form'),
      physics: const BouncingScrollPhysics(),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: IconButton(
              style: IconButton.styleFrom(
                backgroundColor: Colors.white.withValues(alpha: 0.1),
                shape: const CircleBorder(),
              ),
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => _setMode(_AuthMode.welcome),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _isSignUp ? 'Create an account' : 'Welcome back',
            style: const TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _isSignUp
                ? 'Sign up to start checking in with yourself.'
                : 'Sign in to continue your check-ins.',
            style: const TextStyle(color: Colors.white70, height: 1.4),
          ),
          const SizedBox(height: 28),
          if (_error != null) ...[
            _AuthMessage(message: _error!, isError: true),
            const SizedBox(height: 16),
          ],
          if (_info != null) ...[
            _AuthMessage(message: _info!, isError: false),
            const SizedBox(height: 16),
          ],
          _authField(
            controller: _emailController,
            icon: Icons.email_outlined,
            label: 'Email',
            hint: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          _authField(
            controller: _passwordController,
            icon: Icons.lock_outline,
            label: 'Password',
            hint: '••••••••',
            obscure: true,
          ),
          if (_isSignUp) ...[
            const SizedBox(height: 16),
            _authField(
              controller: _confirmPasswordController,
              icon: Icons.lock_outline,
              label: 'Confirm password',
              hint: '••••••••',
              obscure: true,
            ),
          ],
          const SizedBox(height: 24),
          _filledPillButton(
            label: _isSignUp ? 'SIGN UP' : 'SIGN IN',
            onPressed: _loading ? null : _submit,
            loading: _loading,
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _isSignUp ? 'Already have an account?' : "Don't have an account?",
                style: const TextStyle(color: Colors.white70),
              ),
              TextButton(
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  overlayColor: Colors.white.withValues(alpha: 0.1),
                ),
                onPressed: _loading
                    ? null
                    : () => _setMode(_AuthMode.form, isSignUp: !_isSignUp),
                child: Text(
                  _isSignUp ? 'Sign in' : 'Sign up',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Row(
            children: [
              Expanded(child: Divider(color: Colors.white38)),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text('or continue with', style: TextStyle(color: Colors.white70)),
              ),
              Expanded(child: Divider(color: Colors.white38)),
            ],
          ),
          const SizedBox(height: 16),
          _socialButton(
            icon: Icons.g_mobiledata,
            label: 'Continue with Google',
            onPressed: () => _showSocialComingSoon('Google'),
          ),
          const SizedBox(height: 10),
          _socialButton(
            icon: Icons.apple,
            label: 'Continue with Apple',
            onPressed: () => _showSocialComingSoon('Apple'),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _glassButton({
    required Widget child,
    required VoidCallback? onPressed,
    double height = 56,
    double backgroundAlpha = 0.03,
    double borderAlpha = 0.4,
    double highlightAlpha = 0.15,
  }) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        shape: const StadiumBorder(),
        minimumSize: Size(double.infinity, height),
        overlayColor: Colors.white.withValues(alpha: 0.08),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(height / 2),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            height: height,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.white.withValues(alpha: highlightAlpha),
                  Colors.white.withValues(alpha: backgroundAlpha),
                ],
              ),
              borderRadius: BorderRadius.circular(height / 2),
              border: Border.all(
                color: Colors.white.withValues(alpha: borderAlpha),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }

  Widget _pillButton({required String label, required VoidCallback? onPressed}) {
    return _glassButton(
      onPressed: onPressed,
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          letterSpacing: 1.5,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _filledPillButton({
    required String label,
    required VoidCallback? onPressed,
    required bool loading,
  }) {
    return _glassButton(
      onPressed: onPressed,
      height: 56,
      backgroundAlpha: 0.06,
      borderAlpha: 0.5,
      highlightAlpha: 0.25,
      child: loading
          ? const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                ),
                SizedBox(width: 10),
                Text(
                  'Please wait...',
                  style: TextStyle(color: Colors.white),
                ),
              ],
            )
          : Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                letterSpacing: 1.5,
                fontWeight: FontWeight.w700,
              ),
            ),
    );
  }

  Widget _authField({
    required TextEditingController controller,
    required IconData icon,
    required String label,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    bool obscure = false,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscure,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Colors.white, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        prefixIcon: Icon(icon, color: Colors.white70),
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white70),
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white38),
      ),
    );
  }

  Widget _socialButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return _glassButton(
      onPressed: onPressed,
      height: 52,
      backgroundAlpha: 0.02,
      borderAlpha: 0.35,
      highlightAlpha: 0.1,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white),
          const SizedBox(width: 10),
          Text(
            label,
            style: const TextStyle(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _AuthMessage extends StatelessWidget {
  final String message;
  final bool isError;

  const _AuthMessage({required this.message, required this.isError});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isError
            ? const Color(0xFFE55A5A).withValues(alpha: 0.2)
            : Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isError ? Icons.error_outline : Icons.info_outline,
            color: Colors.white,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Colors.white, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
