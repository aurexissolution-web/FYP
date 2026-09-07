import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../pages/confirm_email_page.dart';
import '../pages/forgot_password_page.dart';
import '../widgets/breathing_background.dart';

enum _AuthMode { welcome, form }

class SignInPage extends StatefulWidget {
  final bool initialSignUp;

  const SignInPage({super.key, this.initialSignUp = false});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  _AuthMode _mode = _AuthMode.welcome;
  late bool _isSignUp;
  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _error;
  String? _info;

  static final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  @override
  void initState() {
    super.initState();
    _isSignUp = widget.initialSignUp;
    if (widget.initialSignUp) _mode = _AuthMode.form;
  }

  Future<void> _submit() async {
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });

    try {
      final auth = Supabase.instance.client.auth;
      if (_isSignUp) {
        await auth.signUp(email: email, password: password);
        if (!mounted) return;
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ConfirmEmailPage(email: email)),
        );
      } else {
        await auth.signInWithPassword(email: email, password: password);
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _signInWithSocial(OAuthProvider provider) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        provider,
        redirectTo: kIsWeb ? null : 'com.emobuddy.emobuddy://callback/',
        authScreenLaunchMode: LaunchMode.externalApplication,
      );
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Social sign-in is not available right now.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _setMode(_AuthMode mode, {bool isSignUp = false}) {
    setState(() {
      _mode = mode;
      _isSignUp = isSignUp;
      _error = null;
      _info = null;
    });
  }

  String? _emailValidator(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required.';
    if (!_emailRegex.hasMatch(value.trim())) {
      return 'Please enter a valid email.';
    }
    return null;
  }

  String? _passwordValidator(String? value) {
    if (value == null || value.isEmpty) return 'Password is required.';
    if (_isSignUp && value.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (value.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  String? _confirmPasswordValidator(String? value) {
    if (!_isSignUp) return null;
    if (value != _passwordController.text) return 'Passwords do not match.';
    return null;
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
      backgroundColor: const Color(0xFF4A7DBA),
      resizeToAvoidBottomInset: true,
      body: BreathingBackground(
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
        const Spacer(flex: 3),
        const FadeInUp(child: Center(child: BreathingLogo(size: 150))),
        const SizedBox(height: 12),
        const FadeInUp(
          delay: Duration(milliseconds: 160),
          child: Text(
            'EmoBuddy',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 34,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
        ),
        const SizedBox(height: 10),
        const FadeInUp(
          delay: Duration(milliseconds: 280),
          child: Text(
            'A quiet space to check in with yourself.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70, fontSize: 16, height: 1.4),
          ),
        ),
        const SizedBox(height: 28),
        const FadeInUp(
          delay: Duration(milliseconds: 400),
          child: Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              _FeatureChip(icon: Icons.graphic_eq_rounded, label: 'Voice & text'),
              _FeatureChip(icon: Icons.translate_rounded, label: 'English & BM'),
              _FeatureChip(icon: Icons.lock_outline_rounded, label: 'Private'),
            ],
          ),
        ),
        const Spacer(flex: 4),
        FadeInUp(
          delay: const Duration(milliseconds: 520),
          child: _primaryButton(
            onPressed: () => _setMode(_AuthMode.form, isSignUp: true),
            label: 'CREATE ACCOUNT',
          ),
        ),
        const SizedBox(height: 14),
        FadeInUp(
          delay: const Duration(milliseconds: 620),
          child: _glassButton(
            onPressed: () => _setMode(_AuthMode.form, isSignUp: false),
            child: const Text(
              'SIGN IN',
              style: TextStyle(
                color: Colors.white,
                letterSpacing: 1.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _primaryButton({
    required VoidCallback onPressed,
    required String label,
  }) {
    return SizedBox(
      height: 56,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF3F6FA8),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
        ),
        child: Text(
          label,
          style: const TextStyle(
            letterSpacing: 1.5,
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      key: const ValueKey('form'),
      physics: const BouncingScrollPhysics(),
      child: Form(
        key: _formKey,
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
              validator: _emailValidator,
              autofillHints: const [AutofillHints.email],
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            _authField(
              controller: _passwordController,
              icon: Icons.lock_outline,
              label: 'Password',
              hint: '••••••••',
              obscure: _obscurePassword,
              suffix: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off : Icons.visibility,
                  color: Colors.white70,
                  size: 20,
                ),
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
              validator: _passwordValidator,
              autofillHints: const [AutofillHints.password],
              textInputAction: _isSignUp
                  ? TextInputAction.next
                  : TextInputAction.done,
              onFieldSubmitted: _isSignUp ? null : (_) => _submit(),
            ),
            if (_isSignUp) ...[
              const SizedBox(height: 8),
              _PasswordStrengthIndicator(password: _passwordController.text),
              const SizedBox(height: 16),
              _authField(
                controller: _confirmPasswordController,
                icon: Icons.lock_outline,
                label: 'Confirm password',
                hint: '••••••••',
                obscure: _obscureConfirm,
                suffix: IconButton(
                  icon: Icon(
                    _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                    color: Colors.white70,
                    size: 20,
                  ),
                  onPressed: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                validator: _confirmPasswordValidator,
                textInputAction: TextInputAction.done,
                onFieldSubmitted: (_) => _submit(),
              ),
            ],
            const SizedBox(height: 24),
            _filledPillButton(
              label: _isSignUp ? 'SIGN UP' : 'SIGN IN',
              onPressed: _loading ? null : _submit,
              loading: _loading,
            ),
            const SizedBox(height: 12),
            if (!_isSignUp)
              Align(
                alignment: Alignment.center,
                child: TextButton(
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                    overlayColor: Colors.white.withValues(alpha: 0.1),
                  ),
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const ForgotPasswordPage(),
                    ),
                  ),
                  child: const Text(
                    'Forgot password?',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _isSignUp
                      ? 'Already have an account?'
                      : "Don't have an account?",
                  style: const TextStyle(color: Colors.white70),
                ),
                TextButton(
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                    overlayColor: Colors.white.withValues(alpha: 0.1),
                  ),
                  onPressed: _loading
                      ? null
                      : () => setState(() => _isSignUp = !_isSignUp),
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
                  child: Text(
                    'or continue with',
                    style: TextStyle(color: Colors.white70),
                  ),
                ),
                Expanded(child: Divider(color: Colors.white38)),
              ],
            ),
            const SizedBox(height: 16),
            _socialButton(
              icon: Icons.g_mobiledata,
              label: 'Continue with Google',
              onPressed: () => _signInWithSocial(OAuthProvider.google),
            ),
            const SizedBox(height: 10),
            _socialButton(
              icon: Icons.apple,
              label: 'Continue with Apple',
              onPressed: () => _signInWithSocial(OAuthProvider.apple),
            ),
            const SizedBox(height: 20),
          ],
        ),
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
                Text('Please wait...', style: TextStyle(color: Colors.white)),
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
    Widget? suffix,
    String? Function(String?)? validator,
    Iterable<String>? autofillHints,
    TextInputAction? textInputAction,
    void Function(String)? onFieldSubmitted,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscure,
      validator: validator,
      autofillHints: autofillHints,
      textInputAction: textInputAction,
      onFieldSubmitted: onFieldSubmitted,
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
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: Colors.red.shade200, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: Colors.red.shade200, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 18,
        ),
        prefixIcon: Icon(icon, color: Colors.white70),
        suffixIcon: suffix,
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white70),
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white38),
        errorStyle: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _socialButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return _glassButton(
      onPressed: _loading ? null : onPressed,
      height: 52,
      backgroundAlpha: 0.02,
      borderAlpha: 0.35,
      highlightAlpha: 0.1,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(color: Colors.white)),
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

class _PasswordStrengthIndicator extends StatelessWidget {
  final String password;

  const _PasswordStrengthIndicator({required this.password});

  int _score(String password) {
    int score = 0;
    if (password.length >= 8) score++;
    if (password.contains(RegExp(r'[A-Z]'))) score++;
    if (password.contains(RegExp(r'[0-9]'))) score++;
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>_\-\[\]\\\/]'))) {
      score++;
    }
    return score;
  }

  (String, Color) _label(int score) {
    return switch (score) {
      0 => ('Too short', const Color(0xFFFF6B6B)),
      1 => ('Weak', const Color(0xFFFFA07A)),
      2 => ('Fair', const Color(0xFFFFD166)),
      3 => ('Strong', const Color(0xFF7FB9B4)),
      _ => ('Very strong', const Color(0xFF86B45B)),
    };
  }

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) return const SizedBox.shrink();
    final score = _score(password);
    final (label, color) = _label(score);
    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: score / 4,
              backgroundColor: Colors.white.withValues(alpha: 0.15),
              color: color,
              minHeight: 6,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _FeatureChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeatureChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.white.withValues(alpha: 0.9)),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.92),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
