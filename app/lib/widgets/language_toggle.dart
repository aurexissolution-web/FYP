import 'package:flutter/material.dart';

class LanguageToggle extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const LanguageToggle({
    super.key,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SegmentedButton<String>(
      segments: const [
        ButtonSegment(
          value: 'en',
          label: Padding(
            padding: EdgeInsets.symmetric(horizontal: 6),
            child: Text('EN', style: TextStyle(fontSize: 12)),
          ),
        ),
        ButtonSegment(
          value: 'ms',
          label: Padding(
            padding: EdgeInsets.symmetric(horizontal: 6),
            child: Text('MS', style: TextStyle(fontSize: 12)),
          ),
        ),
      ],
      selected: {value},
      showSelectedIcon: false,
      onSelectionChanged: (s) => onChanged(s.first),
      style: SegmentedButton.styleFrom(
        backgroundColor: colorScheme.surface,
        selectedBackgroundColor: colorScheme.primaryContainer,
        selectedForegroundColor: colorScheme.onPrimaryContainer,
        side: BorderSide(color: colorScheme.outline.withOpacity(0.45)),
        minimumSize: const Size(0, 34),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        textStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}
