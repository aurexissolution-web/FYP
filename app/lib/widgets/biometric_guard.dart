import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../widgets/logo_hero.dart';

const _biometricEnabledKey = 'biometric_enabled';

Future<bool> isBiometricEnabled() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(_biometricEnabledKey) ?? false;
}

Future<void> setBiometricEnabled(bool enabled) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(_biometricEnabledKey, enabled);
}

class BiometricGuard extends StatefulWidget {
  final Widget child;

  const BiometricGuard({super.key, required this.child});

  @override
  State<BiometricGuard> createState() => _BiometricGuardState();
}

class _BiometricGuardState extends State<BiometricGuard> {
  final _auth = LocalAuthentication();
  bool? _enabled;
  bool _unlocked = false;
  bool _failed = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final enabled = await isBiometricEnabled();
    if (!mounted) return;
    setState(() {
      _enabled = enabled;
      if (!enabled) _unlocked = true;
    });
    if (enabled) _authenticate();
  }

  Future<void> _authenticate() async {
    setState(() {
      _failed = false;
      _error = null;
    });
    try {
      final available = await _auth.canCheckBiometrics;
      if (!available) {
        setState(() {
          _unlocked = true;
          _error = 'Biometrics is not available on this device.';
        });
        return;
      }
      final did = await _auth.authenticate(
        localizedReason: 'Unlock EmoBuddy to continue your check-ins.',
        options: const AuthenticationOptions(
          biometricOnly: false,
          useErrorDialogs: true,
          stickyAuth: true,
        ),
      );
      if (!mounted) return;
      setState(() {
        _unlocked = did;
        _failed = !did;
      });
    } on PlatformException catch (e) {
      if (!mounted) return;
      setState(() {
        _failed = true;
        _error = e.message ?? 'Biometric authentication failed.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _failed = true;
        _error = 'Could not authenticate. Please sign in again.';
      });
    }
  }

  Future<void> _signOut() async {
    await Supabase.instance.client.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    if (_enabled == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF4A7DBA),
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    if (_unlocked) return widget.child;

    return Scaffold(
      backgroundColor: const Color(0xFF4A7DBA),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF5B8BD8),
              Color(0xFF7FB9B4),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Spacer(flex: 2),
                const Center(child: LogoHero(size: 140)),
                const SizedBox(height: 40),
                const Text(
                  'Welcome back',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Use Face ID or passcode to unlock EmoBuddy.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, height: 1.4),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE55A5A).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, height: 1.4),
                    ),
                  ),
                ],
                const Spacer(flex: 3),
                _glassButton(
                  onPressed: _authenticate,
                  child: const Text(
                    'UNLOCK WITH FACE ID',
                    style: TextStyle(
                      color: Colors.white,
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                if (_failed)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: TextButton(
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                      ),
                      onPressed: _signOut,
                      child: const Text(
                        'Not you? Sign in again',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _glassButton({
    required Widget child,
    required VoidCallback? onPressed,
    double height = 56,
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
                  Colors.white.withValues(alpha: 0.25),
                  Colors.white.withValues(alpha: 0.06),
                ],
              ),
              borderRadius: BorderRadius.circular(height / 2),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.4),
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
}
