class ModalityResult {
  final String label;
  final double confidence;

  ModalityResult({required this.label, required this.confidence});

  factory ModalityResult.fromJson(Map<String, dynamic> json) {
    return ModalityResult(
      label: json['label'] as String,
      confidence: (json['confidence'] as num).toDouble(),
    );
  }
}

class SelfCareItem {
  final int day;
  final String activity;

  SelfCareItem({required this.day, required this.activity});

  factory SelfCareItem.fromJson(Map<String, dynamic> json) {
    return SelfCareItem(
      day: json['day'] as int,
      activity: json['activity'] as String,
    );
  }
}

class HotlineEntry {
  final String name;
  final String phone;
  final String description;

  HotlineEntry({
    required this.name,
    required this.phone,
    required this.description,
  });

  factory HotlineEntry.fromJson(Map<String, dynamic> json) {
    return HotlineEntry(
      name: json['name'] as String,
      phone: json['phone'] as String,
      description: json['description'] as String,
    );
  }
}

class AnalyzeResult {
  final ModalityResult? textResult;
  final ModalityResult? audioResult;
  final ModalityResult fusionResult;
  final bool crisis;
  final String responseMessage;
  final List<SelfCareItem> selfCarePlan;
  final List<HotlineEntry> hotlines;

  AnalyzeResult({
    required this.textResult,
    required this.audioResult,
    required this.fusionResult,
    required this.crisis,
    required this.responseMessage,
    required this.selfCarePlan,
    required this.hotlines,
  });

  factory AnalyzeResult.fromJson(Map<String, dynamic> json) {
    return AnalyzeResult(
      textResult: json['text_result'] == null
          ? null
          : ModalityResult.fromJson(json['text_result'] as Map<String, dynamic>),
      audioResult: json['audio_result'] == null
          ? null
          : ModalityResult.fromJson(json['audio_result'] as Map<String, dynamic>),
      fusionResult:
          ModalityResult.fromJson(json['fusion_result'] as Map<String, dynamic>),
      crisis: json['crisis'] as bool,
      responseMessage: json['response_message'] as String,
      selfCarePlan: (json['self_care_plan'] as List<dynamic>)
          .map((e) => SelfCareItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      hotlines: (json['hotlines'] as List<dynamic>? ?? [])
          .map((e) => HotlineEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
