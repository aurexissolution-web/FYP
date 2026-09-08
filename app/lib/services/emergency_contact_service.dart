import 'package:supabase_flutter/supabase_flutter.dart';

/// Client-side mirror of web/lib/chat/emergency.ts. Both clients write/read
/// the same emergency_contacts / emergency_notifications tables, so a
/// contact saved in the app is used by a crisis detected on the web and
/// vice versa. Changes here need a matching change there.
class EmergencyContactService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<Map<String, dynamic>?> getContact() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;

    final rows = await _client
        .from('emergency_contacts')
        .select('id, name, relationship, phone, created_at')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(1);

    final list = (rows as List<dynamic>).cast<Map<String, dynamic>>();
    return list.isEmpty ? null : list.first;
  }

  Future<Map<String, dynamic>> saveContact({
    String? id,
    required String name,
    String? relationship,
    required String phone,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    if (id != null) {
      return await _client
          .from('emergency_contacts')
          .update({'name': name, 'relationship': relationship, 'phone': phone})
          .eq('id', id)
          .eq('user_id', userId)
          .select('id, name, relationship, phone, created_at')
          .single();
    }

    return await _client
        .from('emergency_contacts')
        .insert({
          'user_id': userId,
          'name': name,
          'relationship': relationship,
          'phone': phone,
        })
        .select('id, name, relationship, phone, created_at')
        .single();
  }

  Future<void> deleteContact(String id) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');
    await _client
        .from('emergency_contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
  }

  /// Demo-ready stub: logs a real emergency_notifications row instead of
  /// dispatching a real SMS/WhatsApp/email. Returns the notified contact's
  /// name, or null if the user has no saved contact.
  Future<String?> notifyIfCrisis(String moodLogId) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;

    final contact = await getContact();
    if (contact == null) return null;

    await _client.from('emergency_notifications').insert({
      'user_id': userId,
      'contact_id': contact['id'],
      'mood_log_id': moodLogId,
      'contact_name_snapshot': contact['name'],
      'contact_phone_snapshot': contact['phone'],
    });

    return contact['name'] as String;
  }
}
