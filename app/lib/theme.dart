import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppTheme {
  static const _softIndigo = Color(0xFF6B5B8A);
  static const _softSage = Color(0xFF7FB9B4);
  static const _warmCream = Color(0xFFF3F0F7);
  static const _softCoral = Color(0xFFE08C7E);
  static const _ink = Color(0xFF2E2A3A);
  static const _midnight = Color(0xFF14131C);
  static const _nightSurface = Color(0xFF1E1D2A);
  static const _softAmber = Color(0xFFE0A458);
  static const _softBlue = Color(0xFF6B92C9);

  /// A small rotating palette used to give mood chips / quick actions a
  /// livelier, less uniform look than a single flat chip color.
  static const List<Color> moodAccents = [
    _softBlue,
    _softSage,
    _softAmber,
    _softCoral,
    _softIndigo,
  ];

  static final TextTheme _textTheme = GoogleFonts.interTextTheme().copyWith(
    headlineMedium: GoogleFonts.inter(
      fontSize: 28,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.5,
      color: _ink,
    ),
    headlineSmall: GoogleFonts.inter(
      fontSize: 24,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.5,
      color: _ink,
    ),
    titleLarge: GoogleFonts.inter(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: _ink,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: _ink,
    ),
    bodyLarge: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      height: 1.55,
      color: const Color(0xFF4A4558),
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      height: 1.5,
      color: const Color(0xFF4A4558),
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      color: const Color(0xFF7A7489),
    ),
    labelLarge: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w600,
    ),
  );

  static final ColorScheme _lightColorScheme = ColorScheme.light(
    primary: _softIndigo,
    onPrimary: Colors.white,
    primaryContainer: const Color(0xFFE8E0F3),
    onPrimaryContainer: _softIndigo,
    secondary: _softSage,
    onSecondary: Colors.white,
    secondaryContainer: const Color(0xFFD6EBE8),
    onSecondaryContainer: const Color(0xFF2E5C57),
    surface: _warmCream,
    onSurface: _ink,
    surfaceContainerHighest: const Color(0xFFECE8F1),
    error: _softCoral,
    onError: Colors.white,
    errorContainer: const Color(0xFFFFE2DD),
    onErrorContainer: const Color(0xFF8A3B30),
    outline: const Color(0xFFD7D2E0),
    shadow: const Color(0x1A2E2A3A),
  );

  static final ColorScheme _darkColorScheme = ColorScheme.dark(
    primary: const Color(0xFFCEC2E8),
    onPrimary: _ink,
    primaryContainer: const Color(0xFF3D3655),
    onPrimaryContainer: const Color(0xFFE8E0F3),
    secondary: const Color(0xFF9AD8D2),
    onSecondary: _ink,
    secondaryContainer: const Color(0xFF2E5C57),
    onSecondaryContainer: const Color(0xFFD6EBE8),
    surface: _nightSurface,
    onSurface: const Color(0xFFF3F0F7),
    surfaceContainerHighest: const Color(0xFF2A2838),
    error: const Color(0xFFFF9E8F),
    onError: _ink,
    errorContainer: const Color(0xFF4A2A2A),
    onErrorContainer: const Color(0xFFFFD6D1),
    outline: const Color(0xFF3C3852),
    shadow: const Color(0x70000000),
  );

  static ThemeData get lightTheme {
    final scheme = _lightColorScheme;
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      brightness: Brightness.light,
      scaffoldBackgroundColor: scheme.surface,
      textTheme: _textTheme,
      fontFamily: GoogleFonts.inter().fontFamily,
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0.8,
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        centerTitle: false,
        titleTextStyle: _textTheme.titleLarge,
      ),
      cardTheme: CardThemeData(
        elevation: 0.6,
        surfaceTintColor: scheme.surface,
        color: scheme.surface,
        shadowColor: scheme.shadow,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide(
            color: scheme.outline.withOpacity(0.4),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide(color: scheme.secondary, width: 2),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        hintStyle: _textTheme.bodyLarge?.copyWith(
          color: scheme.onSurface.withOpacity(0.45),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          textStyle: _textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: scheme.outline.withOpacity(0.6),
            width: 1.5,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: scheme.primary,
          textStyle: _textTheme.labelLarge,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: scheme.surface,
        selectedItemColor: scheme.primary,
        unselectedItemColor: scheme.onSurface.withOpacity(0.45),
        type: BottomNavigationBarType.fixed,
        elevation: 1,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        indicatorColor: scheme.primaryContainer,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => _textTheme.labelSmall,
        ),
      ),
      pageTransitionsTheme: PageTransitionsTheme(
        builders: {
          TargetPlatform.android: ZoomPageTransitionsBuilder(),
          TargetPlatform.iOS: ZoomPageTransitionsBuilder(),
        },
      ),
    );
  }

  static ThemeData get darkTheme {
    final scheme = _darkColorScheme;
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: _midnight,
      textTheme: _textTheme.apply(
        bodyColor: scheme.onSurface,
        displayColor: scheme.onSurface,
      ),
      fontFamily: GoogleFonts.inter().fontFamily,
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0.8,
        backgroundColor: _midnight,
        foregroundColor: scheme.onSurface,
        centerTitle: true,
        titleTextStyle: _textTheme.titleLarge?.copyWith(
          color: scheme.onSurface,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        surfaceTintColor: scheme.surface,
        color: scheme.surface,
        shadowColor: scheme.shadow,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide(
            color: scheme.outline.withOpacity(0.5),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide(color: scheme.secondary, width: 2),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        hintStyle: _textTheme.bodyLarge?.copyWith(
          color: scheme.onSurface.withOpacity(0.4),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: scheme.outline.withOpacity(0.6),
            width: 1.5,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: scheme.primary),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        indicatorColor: scheme.primaryContainer,
      ),
      pageTransitionsTheme: PageTransitionsTheme(
        builders: {
          TargetPlatform.android: ZoomPageTransitionsBuilder(),
          TargetPlatform.iOS: ZoomPageTransitionsBuilder(),
        },
      ),
    );
  }
}

const _themeModeKey = 'app_theme_mode';

final ValueNotifier<ThemeMode> emoBuddyThemeMode = ValueNotifier<ThemeMode>(
  ThemeMode.light,
);

Future<void> loadEmoBuddyThemeMode() async {
  final prefs = await SharedPreferences.getInstance();
  final saved = prefs.getString(_themeModeKey);
  emoBuddyThemeMode.value = _parseThemeMode(saved);
}

Future<void> setEmoBuddyThemeMode(ThemeMode mode) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_themeModeKey, mode.name);
  emoBuddyThemeMode.value = mode;
}

ThemeMode _parseThemeMode(String? value) {
  switch (value) {
    case 'dark':
      return ThemeMode.dark;
    case 'system':
      return ThemeMode.system;
    case 'light':
    default:
      return ThemeMode.light;
  }
}
