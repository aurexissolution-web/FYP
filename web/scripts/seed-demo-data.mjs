// Seeds demo accounts + realistic check-in history for the NICERS'26 demo.
//
// Run: node --env-file=.env.local scripts/seed-demo-data.mjs
//
// REQUIRES email confirmation to be OFF in the Supabase dashboard
// (Authentication -> Providers -> Email -> "Confirm email"). With it on,
// signUp returns no session and this script cannot authenticate at all —
// same requirement as scripts/smoke-auth-chat.mjs.
//
// Each user is seeded through their OWN authenticated client, so normal RLS
// policies (auth.uid() = user_id) apply exactly as they would for a real
// user — no service role key needed or used.

import { createClient } from "@supabase/supabase-js";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPA || !ANON) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Run with:\n" +
      "  node --env-file=.env.local scripts/seed-demo-data.mjs",
  );
  process.exit(1);
}

const DEMO_PASSWORD = "EmoBuddyDemo2026!";
const stamp = Date.now();

// day offsets (days ago) so history reads as "the last couple of weeks"
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

/**
 * 8 demo profiles reflecting Malaysia's major ethnic groups (Malay, Chinese,
 * Indian, and East Malaysian/Sarawakian), each with a short check-in history:
 * a happy session, a sad/stressed session, and — for half of them — a crisis
 * session that exercises the emergency-contact notification flow.
 */
const USERS = [
  {
    name: "Nur Aisyah binti Rahman",
    email: `nur.aisyah.${stamp}@mailinator.com`,
    contact: { name: "Rahman bin Salleh", relationship: "Father", phone: "+60123456701" },
    sessions: [
      {
        daysAgo: 9,
        language: "en",
        title: "Finally finished my thesis draft",
        fusion_result: "happy",
        confidence: 0.912,
        text_result: "Positive language, high energy, mentions of relief and pride.",
        crisis: false,
        userMsg:
          "I finally submitted my final year project draft today! I've been stressing over it for weeks.",
        aiMsg:
          "That's wonderful, Aisyah! All those late nights really paid off. How are you planning to celebrate?",
        plan: [
          { day: 1, activity: "Treat yourself to your favourite nasi lemak stall", language: "en" },
          { day: 2, activity: "Call a friend and share the good news", language: "en" },
          { day: 3, activity: "Write down 3 things you're proud of this week", language: "en" },
        ],
      },
      {
        daysAgo: 4,
        language: "ms",
        title: "Rasa tertekan dengan peperiksaan",
        fusion_result: "sad",
        confidence: 0.784,
        text_result: "Nada suara rendah, ungkapan keletihan dan kebimbangan tentang peperiksaan.",
        crisis: false,
        userMsg: "Saya rasa sangat tertekan dengan peperiksaan akhir minggu depan. Tak cukup masa untuk ulangkaji.",
        aiMsg: "Saya faham perasaan tertekan tu, Aisyah. Jom kita pecahkan topik ulangkaji kepada bahagian kecil supaya tak rasa terlalu banyak sekaligus.",
        plan: [
          { day: 1, activity: "Buat jadual ulangkaji 25 minit dengan rehat 5 minit", language: "ms" },
          { day: 2, activity: "Tidur sekurang-kurangnya 7 jam malam ini", language: "ms" },
          { day: 3, activity: "Berjalan kaki 10 minit untuk tenangkan fikiran", language: "ms" },
        ],
      },
    ],
  },
  {
    name: "Muhammad Haziq bin Ismail",
    email: `haziq.ismail.${stamp}@mailinator.com`,
    contact: { name: "Ismail bin Hashim", relationship: "Father", phone: "+60123456702" },
    sessions: [
      {
        daysAgo: 11,
        language: "en",
        title: "Got the internship offer!",
        fusion_result: "happy",
        confidence: 0.937,
        text_result: "Excited tone, exclamations, future-oriented positive language.",
        crisis: false,
        userMsg: "I got the internship offer from the logistics company I applied to! Can't believe it.",
        aiMsg: "Congratulations, Haziq! That's a big achievement. What part of the internship are you most looking forward to?",
        plan: [
          { day: 1, activity: "Share the news with your family over dinner", language: "en" },
          { day: 2, activity: "Set one small goal for your first week", language: "en" },
          { day: 3, activity: "Get a good night's rest before the paperwork begins", language: "en" },
        ],
      },
      {
        daysAgo: 6,
        language: "en",
        title: "Feeling overwhelmed by everything at once",
        fusion_result: "angry",
        confidence: 0.701,
        text_result: "Frustrated tone, short clipped sentences, mentions of pressure from multiple sources.",
        crisis: false,
        userMsg: "Between the internship prep, family expectations, and my part-time job I feel like I'm about to snap.",
        aiMsg: "That's a lot to carry at once, Haziq. Let's figure out which of these actually needs your attention today, and let the rest wait.",
        plan: [
          { day: 1, activity: "List your tasks and pick only the top 2 for today", language: "en" },
          { day: 2, activity: "Try 4-7-8 breathing when you feel the pressure spike", language: "en" },
          { day: 3, activity: "Have an honest conversation with your family about your plate", language: "en" },
        ],
      },
    ],
  },
  {
    name: "Siti Nurhaliza binti Ahmad",
    email: `siti.nurhaliza.${stamp}@mailinator.com`,
    contact: { name: "Ahmad bin Yaakob", relationship: "Husband", phone: "+60123456703" },
    sessions: [
      {
        daysAgo: 8,
        language: "ms",
        title: "Hari yang indah bersama keluarga",
        fusion_result: "happy",
        confidence: 0.889,
        text_result: "Nada gembira, sebutan positif tentang masa bersama keluarga.",
        crisis: false,
        userMsg: "Hari ini kami sekeluarga pergi berkelah di taman. Anak-anak sangat gembira.",
        aiMsg: "Seronoknya! Masa berkualiti bersama keluarga memang penting. Apa aktiviti yang paling anak-anak suka?",
        plan: [
          { day: 1, activity: "Kongsi gambar kenangan hari ini dalam album keluarga", language: "ms" },
          { day: 2, activity: "Rancang satu aktiviti keluarga lagi minggu depan", language: "ms" },
          { day: 3, activity: "Tulis satu memori manis dalam jurnal", language: "ms" },
        ],
      },
      {
        daysAgo: 3,
        language: "ms",
        title: "Terlalu banyak tanggungjawab rumah tangga",
        fusion_result: "sad",
        confidence: 0.756,
        text_result: "Nada keletihan, ungkapan kekurangan masa untuk diri sendiri.",
        crisis: false,
        userMsg: "Saya rasa letih menguruskan kerja, rumah dan anak-anak setiap hari tanpa rehat.",
        aiMsg: "Tanggungjawab tu memang berat kalau ditanggung sendirian. Bolehkah kita cari sedikit masa untuk awak hari ini?",
        plan: [
          { day: 1, activity: "Minta bantuan pasangan untuk satu tugasan rumah", language: "ms" },
          { day: 2, activity: "Luangkan 15 minit untuk diri sendiri tanpa gangguan", language: "ms" },
          { day: 3, activity: "Berkongsi perasaan dengan rakan yang dipercayai", language: "ms" },
        ],
      },
    ],
  },
  {
    name: "Ahmad Zulkarnain bin Osman",
    email: `ahmad.zulkarnain.${stamp}@mailinator.com`,
    contact: { name: "Fatimah binti Zainal", relationship: "Wife", phone: "+60123456704" },
    sessions: [
      {
        daysAgo: 10,
        language: "en",
        title: "Business is finally picking up",
        fusion_result: "happy",
        confidence: 0.86,
        text_result: "Positive, relieved tone about small business finances improving.",
        crisis: false,
        userMsg: "Sales at my kedai runcit have picked up this month after a slow year. Feeling hopeful again.",
        aiMsg: "That's great to hear, Zulkarnain! After a tough year, this must feel like a real turning point.",
        plan: [
          { day: 1, activity: "Note down what worked this month for next time", language: "en" },
          { day: 2, activity: "Set aside a small amount as savings this week", language: "en" },
          { day: 3, activity: "Celebrate with a simple meal with family", language: "en" },
        ],
      },
      {
        daysAgo: 2,
        language: "en",
        title: "I don't see the point anymore",
        fusion_result: "sad",
        confidence: 0.911,
        text_result: "Flat affect, hopeless language, explicit mention of not wanting to continue.",
        crisis: true,
        userMsg:
          "Honestly some days I feel like giving up completely, like there's no point in continuing any of this.",
        aiMsg:
          "I'm really glad you told me this, Zulkarnain. What you're feeling matters, and you don't have to go through it alone. I've let someone who cares about you know you might need support right now, and here are some people you can talk to immediately.",
      },
    ],
  },
  {
    name: "Tan Wei Jian",
    email: `tan.weijian.${stamp}@mailinator.com`,
    contact: { name: "Tan Ah Kow", relationship: "Father", phone: "+60123456705" },
    sessions: [
      {
        daysAgo: 12,
        language: "en",
        title: "Promoted to team lead today",
        fusion_result: "happy",
        confidence: 0.905,
        text_result: "Upbeat tone, pride and excitement about career progress.",
        crisis: false,
        userMsg: "My manager just told me I'm being promoted to team lead next month!",
        aiMsg: "Congratulations, Wei Jian! That recognition is well deserved. How does it feel to hear that?",
        plan: [
          { day: 1, activity: "Message your parents to share the news", language: "en" },
          { day: 2, activity: "Write down what you want to focus on as a new lead", language: "en" },
          { day: 3, activity: "Take a short walk to enjoy the moment before the busy season starts", language: "en" },
        ],
      },
      {
        daysAgo: 5,
        language: "en",
        title: "Can't switch off from work",
        fusion_result: "neutral",
        confidence: 0.612,
        text_result: "Even tone but repeated mentions of racing thoughts and difficulty relaxing.",
        crisis: false,
        userMsg: "Even at home I keep thinking about deadlines. I can't seem to switch off in the evenings.",
        aiMsg: "That racing-mind feeling is common when a role changes fast. Let's try building a small wind-down routine for your evenings.",
        plan: [
          { day: 1, activity: "No work notifications after 9pm tonight", language: "en" },
          { day: 2, activity: "Try a 10-minute guided breathing session before bed", language: "en" },
          { day: 3, activity: "Write tomorrow's top task down so your mind can let it go tonight", language: "en" },
        ],
      },
    ],
  },
  {
    name: "Lim Xin Yi",
    email: `lim.xinyi.${stamp}@mailinator.com`,
    contact: { name: "Lim Mei Ling", relationship: "Mother", phone: "+60123456706" },
    sessions: [
      {
        daysAgo: 7,
        language: "en",
        title: "Reunion dinner with old friends",
        fusion_result: "happy",
        confidence: 0.87,
        text_result: "Warm, nostalgic tone about reconnecting with friends.",
        crisis: false,
        userMsg: "Had a reunion dinner with my secondary school friends after 5 years. It felt so good to catch up.",
        aiMsg: "That sounds lovely, Xin Yi! Reconnecting with old friends can be really grounding. What did you talk about most?",
        plan: [
          { day: 1, activity: "Send a photo from the reunion to the group chat", language: "en" },
          { day: 2, activity: "Plan the next hangout so it doesn't take another 5 years", language: "en" },
          { day: 3, activity: "Write down one memory you want to hold onto", language: "en" },
        ],
      },
      {
        daysAgo: 1,
        language: "en",
        title: "Nothing feels worth doing anymore",
        fusion_result: "sad",
        confidence: 0.933,
        text_result: "Withdrawn tone, hopeless language, mentions of wanting to disappear.",
        crisis: true,
        userMsg:
          "Lately I just feel numb about everything. Sometimes I think everyone would be better off if I just disappeared.",
        aiMsg:
          "Thank you for trusting me with that, Xin Yi. That sounds incredibly heavy to carry, and I don't want you to carry it alone. I've reached out to someone who cares about you, and here are people who are ready to talk right now.",
      },
    ],
  },
  {
    name: "Priya a/p Kumaraswamy",
    email: `priya.kumaraswamy.${stamp}@mailinator.com`,
    contact: { name: "Kumaraswamy a/l Muthu", relationship: "Father", phone: "+60123456707" },
    sessions: [
      {
        daysAgo: 13,
        language: "en",
        title: "Deepavali prep with the family",
        fusion_result: "happy",
        confidence: 0.898,
        text_result: "Joyful tone, mentions of family tradition and festive preparation.",
        crisis: false,
        userMsg: "We spent the whole day making murukku and putting up kolam for Deepavali. It was so much fun.",
        aiMsg: "That sounds like a wonderful day, Priya! Festive traditions with family really do fill the tank. Happy Deepavali!",
        plan: [
          { day: 1, activity: "Take a family photo in front of the kolam", language: "en" },
          { day: 2, activity: "Share some murukku with a neighbour", language: "en" },
          { day: 3, activity: "Write down your favourite Deepavali memory this year", language: "en" },
        ],
      },
      {
        daysAgo: 4,
        language: "en",
        title: "Struggling to balance studies and family duties",
        fusion_result: "sad",
        confidence: 0.742,
        text_result: "Tired tone, mentions of guilt over divided attention between studies and home.",
        crisis: false,
        userMsg: "I feel guilty spending time studying when my mom needs help at home, but I also can't fall behind in class.",
        aiMsg: "That pull between responsibilities is really hard, Priya. Let's see if there's a way to protect a bit of time for both without guilt.",
        plan: [
          { day: 1, activity: "Block 2 fixed study hours and tell your family in advance", language: "en" },
          { day: 2, activity: "Ask a sibling or relative to share one household task this week", language: "en" },
          { day: 3, activity: "Remind yourself: resting is not the same as failing", language: "en" },
        ],
      },
    ],
  },
  {
    name: "Jonathan anak Belaun",
    email: `jonathan.belaun.${stamp}@mailinator.com`,
    contact: { name: "Belaun anak Nyabing", relationship: "Father", phone: "+60123456708" },
    sessions: [
      {
        daysAgo: 14,
        language: "en",
        title: "Gawai celebration back in the longhouse",
        fusion_result: "happy",
        confidence: 0.915,
        text_result: "Joyful, nostalgic tone about celebrating Gawai with the community.",
        crisis: false,
        userMsg: "Went back to the longhouse for Gawai this year, first time in 3 years. Felt amazing to see everyone.",
        aiMsg: "What a meaningful trip, Jonathan! Being back with your community for Gawai must have felt really grounding.",
        plan: [
          { day: 1, activity: "Call a longhouse relative you didn't get to talk to enough", language: "en" },
          { day: 2, activity: "Write down a story an elder shared with you", language: "en" },
          { day: 3, activity: "Plan your next visit home", language: "en" },
        ],
      },
      {
        daysAgo: 6,
        language: "en",
        title: "Homesick and isolated in the city",
        fusion_result: "sad",
        confidence: 0.769,
        text_result: "Low energy tone, mentions of loneliness and distance from family.",
        crisis: false,
        userMsg: "Being in KL for work is fine but I miss home a lot. Sometimes I feel really isolated here.",
        aiMsg: "That distance from home can weigh on you more than people expect, Jonathan. Let's find a small way to feel connected this week.",
        plan: [
          { day: 1, activity: "Video call your family this evening", language: "en" },
          { day: 2, activity: "Find one local community or hobby group to join", language: "en" },
          { day: 3, activity: "Cook a dish that reminds you of home", language: "en" },
        ],
      },
    ],
  },
];

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "OK" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
}

async function seedUser(profile) {
  const client = createClient(SUPA, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: profile.email,
    password: DEMO_PASSWORD,
  });
  if (signUpError) throw new Error(`signUp failed for ${profile.name}: ${signUpError.message}`);

  let session = signUpData.session;
  if (!session) {
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email: profile.email,
      password: DEMO_PASSWORD,
    });
    if (signInError || !signInData.session) {
      throw new Error(
        `No session after signUp for ${profile.name} — "Confirm email" is likely still ON in ` +
          `Supabase (Authentication -> Providers -> Email). Turn it off and re-run.`,
      );
    }
    session = signInData.session;
  }

  const userId = session.user.id;
  check(`${profile.name}: account created`, true, profile.email);

  // Emergency contact — used for the crisis session's notification row below.
  const { data: contactRow, error: contactError } = await client
    .from("emergency_contacts")
    .insert({
      user_id: userId,
      name: profile.contact.name,
      relationship: profile.contact.relationship,
      phone: profile.contact.phone,
    })
    .select()
    .single();
  check(`${profile.name}: emergency contact`, !contactError, contactError?.message);

  for (const s of profile.sessions) {
    const createdAt = daysAgo(s.daysAgo);

    const { data: log, error: logError } = await client
      .from("mood_logs")
      .insert({
        user_id: userId,
        source: "text",
        text_result: s.text_result,
        fusion_result: s.fusion_result,
        confidence: s.confidence,
        crisis_triggered: s.crisis,
        conversation_text: `${s.userMsg}\n${s.aiMsg}`,
        title: s.title,
        created_at: createdAt,
      })
      .select()
      .single();
    check(`${profile.name}: session "${s.title}"`, !logError, logError?.message);
    if (logError) continue;

    const { error: msgError } = await client.from("chat_messages").insert([
      {
        session_id: log.id,
        user_id: userId,
        role: "user",
        type: "text",
        content: s.userMsg,
        created_at: createdAt,
      },
      {
        session_id: log.id,
        user_id: userId,
        role: "ai",
        type: s.crisis ? "crisis" : "mood",
        content: s.aiMsg,
        created_at: createdAt,
      },
    ]);
    check(`${profile.name}: chat messages for "${s.title}"`, !msgError, msgError?.message);

    if (!s.crisis && s.plan?.length) {
      const { error: planError } = await client.from("self_care_plans").insert(
        s.plan.map((p) => ({
          user_id: userId,
          mood_log_id: log.id,
          day_index: p.day,
          activity: p.activity,
          language: p.language,
          created_at: createdAt,
        })),
      );
      check(`${profile.name}: self-care plan for "${s.title}"`, !planError, planError?.message);
    }

    if (s.crisis) {
      const { error: notifError } = await client.from("emergency_notifications").insert({
        user_id: userId,
        contact_id: contactRow?.id ?? null,
        mood_log_id: log.id,
        contact_name_snapshot: profile.contact.name,
        contact_phone_snapshot: profile.contact.phone,
        channel: "stub",
        status: "simulated",
        created_at: createdAt,
      });
      check(`${profile.name}: crisis notification logged`, !notifError, notifError?.message);
    }
  }

  await client.auth.signOut();
}

console.log(`Seeding ${USERS.length} demo accounts against ${SUPA} ...\n`);

for (const profile of USERS) {
  try {
    await seedUser(profile);
  } catch (err) {
    check(profile.name, false, err.message);
  }
  console.log("");
}

console.log("---");
console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
console.log(USERS.map((u) => `  ${u.name.padEnd(28)} ${u.email}`).join("\n"));
console.log("---");

if (failed > 0) {
  console.error(`\n${failed} step(s) failed — see FAIL lines above.`);
  process.exit(1);
}
console.log("\nAll demo data seeded successfully.");
