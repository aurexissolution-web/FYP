import type { Dictionary } from "./types";

const ms: Dictionary = {
  nav: {
    home: "Utama",
    features: "Ciri-Ciri",
    howItWorks: "Cara Ia Berfungsi",
    research: "Penyelidikan",
    about: "Tentang Kami",
    help: "Dapatkan Bantuan",
    signIn: "Log Masuk",
    signUp: "Daftar",
    openMenu: "Buka navigasi",
  },
  auth: {
    signInTitle: "Selamat kembali",
    signInSubtitle: "Log masuk untuk meneruskan semakan anda.",
    signUpTitle: "Cipta akaun anda",
    signUpSubtitle: "Mulakan semakan bersama EmoBuddy — percuma.",
    emailLabel: "E-mel",
    passwordLabel: "Kata laluan",
    newPasswordLabel: "Kata laluan baharu",
    submitSignIn: "Log Masuk",
    submitSignUp: "Cipta Akaun",
    submitReset: "Hantar Pautan Tetapan Semula",
    submitNewPassword: "Kemas Kini Kata Laluan",
    forgotPassword: "Lupa kata laluan anda?",
    forgotTitle: "Tetapkan semula kata laluan",
    forgotSubtitle: "Kami akan e-mel pautan untuk menetapkan yang baharu.",
    resetTitle: "Tetapkan kata laluan baharu",
    resetSubtitle: "Pilih kata laluan yang belum pernah anda guna.",
    noAccount: "Belum ada akaun?",
    hasAccount: "Sudah ada akaun?",
    checkInbox: "Semak peti masuk anda untuk pautan tersebut.",
    confirmEmail: "Hampir siap — sahkan e-mel anda untuk melengkapkan pendaftaran.",
    working: "Sila tunggu…",
    errors: {
      missingFields: "Sila isi semua ruangan.",
      passwordTooShort: "Kata laluan mesti sekurang-kurangnya 6 aksara.",
      generic: "Ada sesuatu yang tidak kena. Sila cuba lagi.",
    },
  },
  footer: {
    tagline: "Ruang yang lebih tenang untuk emosi anda.",
    product: "Produk",
    company: "Syarikat",
    privacy: "Privasi & Keselamatan",
    getHelp: "Dapatkan Bantuan",
    contact: "Hubungi Kami",
    disclaimer:
      "EmoBuddy adalah projek penyelidikan pelajar dan bukan perkhidmatan krisis, peranti perubatan, atau pengganti rawatan profesional.",
    rights: "Projek Tahun Akhir · Politeknik Tuanku Sultanah Bahiyah",
  },
  home: {
    badge: "Ruang yang lebih tenang untuk emosi anda",
    title: "Fahami perasaan anda, satu perbualan pada satu masa.",
    subtitle:
      "EmoBuddy membantu anda meluahkan perasaan melalui teks atau suara, merenung emosi anda, dan mengambil langkah kecil yang penuh perhatian — dalam Bahasa Inggeris atau Bahasa Melayu.",
    ctaPrimary: "Mula Percuma",
    ctaSecondary: "Lihat Cara Ia Berfungsi",
    trustLine: "Privasi diutamakan · Bahasa Inggeris dan Bahasa Melayu · Tersedia bila-bila masa",
    pills: ["Semakan Suara + Teks", "Dwibahasa EN/BM", "Selamat Krisis"],
    flow: ["Bercakap atau taip", "AI memahami", "Jagaan diperibadikan"],
    phone: {
      userMsg: "Saya rasa sangat cemas tentang peperiksaan saya.",
      aiMsg:
        "Bunyinya seperti bebanan yang berat. Mari kita hadapinya langkah demi langkah.",
      planTitle: "Pelan Jagaan Diri 3 Hari Anda",
      planDays: [
        "Hari 1 — Senaman pernafasan 5 minit",
        "Hari 2 — Tulis satu perkara yang anda banggakan",
        "Hari 3 — Hubungi seseorang yang anda percayai",
      ],
      inputPlaceholder: "Taip atau tekan untuk bercakap…",
    },
    statsEyebrow: "Dibina atas model terlatih, bukan sekadar arahan",
    statsHeading: "Dua model, dinilai secara jujur",
    stats: [
      {
        value: "67%",
        label: "Ketepatan emosi teks",
        detail: "Bi-GRU atas GoEmotions · macro F1 0.61",
      },
      {
        value: "61.5%",
        label: "Ketepatan emosi suara",
        detail: "CNN atas RAVDESS · CV 6-lipatan mengikut pelakon",
      },
      {
        value: "4,567",
        label: "Sampel ujian ditahan",
        detail: "Tidak pernah dilihat model semasa latihan",
      },
    ],
    proofStrip: ["Macro F1, model teks", "Pengesahan silang mengikut pelakon, audio", "Kelas emosi"],
    statsLink: "Lihat penilaian penuh",
    stepsLink: "Lihat setiap langkah dengan terperinci",
    stepsOverrideChip: "Ketetapan mutlak",
    demo: {
      eyebrow: "Lihat ia beraksi",
      heading: "Satu sesi semakan, dari mula hingga akhir",
      body: "Inilah yang berlaku dalam beberapa saat selepas anda menekan hantar — dimainkan semula secara automatik, dalam kedua-dua bahasa.",
      callouts: [
        { title: "Mesej diterima", detail: "Dalam Bahasa Inggeris atau Bahasa Melayu — ditaip di sini, atau dituturkan." },
        { title: "Semakan krisis lulus", detail: "Senarai kata kunci dalam kedua-dua bahasa berjalan sebelum mana-mana model. Tiada padanan, jadi sesi diteruskan." },
        { title: "Bi-GRU membaca perkataan", detail: "Dilatih atas GoEmotions · ketepatan 67% pada 4,567 sampel ujian." },
        { title: "Emosi ditentukan", detail: "Dengan nota suara, teks dan nada digabungkan melalui wajaran F1 setiap emosi — di sini, teks sahaja yang menentukan." },
        { title: "Balasan yang spesifik, serta pelan 3 hari", detail: "Disesuaikan dengan emosi yang dikesan dan bahasa yang anda gunakan." },
      ],
      replayNote: "Demo automatik · berselang Bahasa Inggeris dan Bahasa Melayu · tiada apa-apa dihantar ke mana-mana",
    },
    hood: {
      eyebrow: "Di sebalik tabir",
      heading: "Dua model, satu keputusan yang jujur",
      body: "Teks dan suara dinilai oleh model berasingan, kemudian digabungkan — bukan dipuratakan. Undi setiap model diberi wajaran mengikut kebolehpercayaannya yang terbukti untuk emosi tersebut.",
      nodes: {
        text: "Teks",
        voice: "Suara",
        crisis: "Semakan krisis",
        crisisSub: "senarai kata kunci EN + BM",
        hotlines: "padan → talian bantuan",
        textModel: "Bi-GRU",
        audioModel: "CNN",
        fusion: "Gabungan berwajaran F1",
        fusionSub: "wajaran setiap emosi",
        emotion: "Emosi",
        output: "Balasan + pelan",
      },
      weightsHeading: "Siapa yang menentukan, mengikut emosi",
      textLabel: "teks",
      audioLabel: "suara",
      classes: ["Gembira", "Sedih", "Marah", "Neutral"],
      link: "Baca penyelidikan penuh",
    },
    problemEyebrow: "Sebab EmoBuddy wujud",
    problemHeading: "Meluahkan perasaan itu sukar. Ia tidak sepatutnya begitu.",
    problemBody:
      "Stigma, halangan bahasa, dan kos menghalang ramai orang daripada menyemak kesihatan mental mereka sendiri sehingga keadaan sudah sukar. EmoBuddy ialah langkah pertama yang santai — tersedia dalam bahasa yang anda benar-benar fikir dengannya, tanpa perlu menjelaskan diri kepada sesiapa dahulu.",
    problemBig: {
      label: "rakyat Malaysia berumur 16 tahun ke atas hidup dengan kemurungan — 4.6% daripada semua orang dewasa.",
      source: "Sumber: Tinjauan Kebangsaan Kesihatan dan Morbiditi 2023 dan 2022 (Tinjauan Kesihatan Remaja), Kementerian Kesihatan Malaysia",
    },
    problemStats: [
      {
        value: "2×",
        label: "kadar yang direkodkan hanya empat tahun sebelumnya",
        detail: "NHMS 2019 → 2023",
      },
      {
        value: "1 dari 4",
        label: "remaja berumur 13–17 tahun melaporkan simptom kemurungan",
        detail: "NHMS 2022",
      },
    ],
    problemBarriersHeading: "Keperluannya jelas. Langkah pertama masih belum.",
    problemBarriers: [
      {
        title: "Stigma mencipta kesunyian",
        body: "Meminta bantuan boleh terasa seperti mengakui ada sesuatu yang tidak kena — terutamanya apabila seseorang belum bersedia untuk bercakap dengan orang lain.",
      },
      {
        title: "Bahasa mencipta jarak",
        body: "Emosi sukar diterjemahkan. Sokongan terasa kurang peribadi apabila ia bukan dalam bahasa yang digunakan seseorang untuk berfikir dan merasa.",
      },
      {
        title: "Kos mencipta kelewatan",
        body: "Penjagaan profesional penting, tetapi akses mungkin mengambil masa atau terasa di luar kemampuan. Ramai memerlukan langkah pertama yang selamat.",
      },
    ],
    problemBridge: {
      eyebrow: "Jurang yang ditangani EmoBuddy",
      heading: "Bukan pengganti penjagaan. Jambatan ke arahnya.",
      body: "Semakan peribadi dan dwibahasa memberi ruang untuk mengenal pasti perasaan, memahaminya, dan mengambil satu langkah seterusnya yang mampu dilakukan.",
    },
    featuresEyebrow: "Apa yang ia lakukan",
    featuresHeading: "Sokongan yang bermula",
    featuresHeadingAccent: "dengan mendengar.",
    featuresBody:
      "Lima perkara yang EmoBuddy lakukan hari ini — bukan rancangan masa depan.",
    featuresLink: "Lihat semua ciri",
    features: [
      {
        title: "Perbualan dwibahasa",
        body: "Bahasa Inggeris dan Bahasa Melayu kedua-duanya diutamakan — bukan antara muka terjemahan.",
      },
      {
        title: "Sesi semakan suara atau teks",
        body: "Satu model membaca perkataan anda, satu lagi membaca nada suara anda.",
      },
      {
        title: "Pelan jagaan diri 3 hari",
        body: "Tiga langkah kecil yang boleh dilakukan selepas setiap sesi, disesuaikan dengan perasaan anda.",
      },
      {
        title: "Sejarah anda, milik anda sahaja",
        body: "Lihat corak dari semasa ke semasa. Keselamatan peringkat baris bermakna hanya anda boleh membacanya.",
      },
      {
        title: "Selamat krisis secara lalai",
        body: "Tanda-tanda krisis terus dipaparkan talian bantuan Malaysia yang disahkan — sebelum apa-apa lagi.",
      },
    ],
    bento: {
      sampleEn: "I feel overwhelmed today.",
      sampleMs: "Saya rasa tertekan hari ini.",
      onlyYou: "Hanya anda boleh membacanya",
      historyRows: ["Hari ini · Neutral", "Semalam · Sedih · pelan 2 daripada 3 selesai", "Minggu lepas · Gembira"],
    },
    safetyEyebrow: "Keselamatan diutamakan",
    safetyHeading: "Jika mendesak, EmoBuddy memberi laluan",
    safetyBody:
      "EmoBuddy bukan perkhidmatan krisis. Jika bahasa yang menunjukkan krisis dikesan, ia terus memaparkan talian bantuan Malaysia yang disahkan — sebelum apa-apa lagi.",
    safetyDoesHeading: "Apabila dicetuskan, EmoBuddy",
    safetyDoesNotHeading: "Apa yang ia tidak lakukan",
    hotlineCall: "Hubungi",
    safetyLink: "Lihat cara pengesanan krisis berfungsi",
    aboutEyebrow: "Dibina di Politeknik Tuanku Sultanah Bahiyah",
    aboutHeading: "Projek Tahun Akhir, dibina dari hujung ke hujung",
    aboutLink: "Tentang projek ini",
    aboutBuildEyebrow: "Penyertaan inovasi kebangsaan",
    aboutBuildBadge: "Dibina hujung ke hujung",
    aboutBuild: ["Aplikasi mudah alih", "Dua model AI", "Backend selamat", "Laman web pertandingan"],
    sdgLabel: "SDG",
    faq: {
      eyebrow: "Soalan",
      heading: "Perkara yang orang tanya di gerai",
      body: "Jawapan terus tentang keselamatan, privasi, sokongan bahasa, dan fungsi sebenar model — untuk soalan yang paling penting.",
      facts: [
        { value: "6", label: "soalan lazim di gerai" },
        { value: "EN + BM", label: "bahasa utama" },
        { value: "4", label: "kelas emosi" },
      ],
      items: [
        {
          q: "Adakah EmoBuddy pengganti terapi atau talian krisis?",
          a: "Tidak. Ia langkah pertama yang santai untuk menyemak diri sendiri. Ia tidak menghubungi perkhidmatan kecemasan, tidak dipantau oleh manusia secara masa nyata, dan tidak boleh menggantikan perbualan dengan pihak di talian bantuan. Jika krisis dikesan, ia terus memaparkan talian bantuan tersebut.",
        },
        {
          q: "Adakah rakaman suara saya disimpan?",
          a: "Tidak. Suara anda diproses untuk mengesan emosi dan kemudian dibuang — hanya tempohnya dan emosi yang dikesan daripadanya disimpan.",
        },
        {
          q: "Bahasa apa yang disokong?",
          a: "Bahasa Inggeris dan Bahasa Melayu, kedua-duanya diutamakan sepenuhnya — senarai kata kunci krisis berasingan, templat balasan berasingan, dan peningkatan leksikon Melayu untuk model teks. Bukan antara muka terjemahan mesin yang ditampal pada produk Bahasa Inggeris.",
        },
        {
          q: "Emosi apa yang boleh dikesan?",
          a: "Setiap sesi semakan dikelaskan kepada satu daripada empat emosi — gembira, sedih, marah, atau neutral. Empat kelas kasar dipilih kerana pemilihan respons jagaan diri tidak memerlukan resolusi lebih daripada itu, dan setiap kelas tambahan mengurangkan data latihan yang tersedia bagi setiap kelas.",
        },
        {
          q: "Apa yang berlaku jika saya menyebut tentang mencederakan diri?",
          a: "Sebelum mana-mana model emosi berjalan, perkataan anda disemak terhadap senarai kata kunci krisis dalam kedua-dua bahasa. Jika sepadan, EmoBuddy memaparkan talian bantuan Malaysia yang disahkan dan bukannya pelan jagaan diri. Ini ketetapan mutlak, bukan cadangan yang boleh diubah oleh model.",
        },
        {
          q: "Siapa yang boleh melihat sesi semakan saya?",
          a: "Hanya anda. Keselamatan peringkat baris dalam pangkalan data bermakna hanya akaun anda yang boleh membaca data anda sendiri — malah tiada panel pentadbir yang boleh melihatnya dibina.",
        },
      ],
    },
    finalCtaHeading: "Bersedia untuk menyemak perasaan anda?",
    finalCtaBody:
      "Ia mengambil masa kurang seminit, dan tiada apa yang perlu disediakan. Cuma luahkan keadaan anda.",
    finalCtaButton: "Cipta Akaun Anda",
  },
  features: {
    eyebrow: "Ciri-Ciri",
    heading: "Bukan sekadar chatbot kesejahteraan biasa",
    subheading:
      "Setiap ciri di bawah adalah sesuatu yang EmoBuddy benar-benar lakukan hari ini, bukan rancangan masa depan.",
    items: [
      {
        title: "Perbualan dwibahasa",
        body: "Bahasa Inggeris dan Bahasa Melayu kedua-duanya diutamakan sepenuhnya — senarai kata kunci krisis berasingan, templat balasan berasingan, dan peningkatan leksikon Melayu untuk model teks. Bukan antara muka terjemahan mesin yang ditampal pada produk Bahasa Inggeris.",
      },
      {
        title: "Sesi semakan suara dan teks",
        body: "Bercakap secara semula jadi atau taip — model Bi-GRU membaca perkataan yang anda gunakan, model CNN membaca nada, pic, dan rentak suara anda. Kedua-duanya boleh berfungsi berasingan; bersama, ia lebih boleh dipercayai.",
      },
      {
        title: "Gabungan berwajaran, bukan tekaan",
        body: "Apabila suara dan teks tidak sepakat, EmoBuddy tidak mengambil purata atau memilih secara sembarangan. Undi setiap model diberi wajaran mengikut emosi berdasarkan kebolehpercayaan model itu sendiri untuk emosi tersebut — lihat halaman Penyelidikan untuk perincian.",
      },
      {
        title: "Pelan jagaan diri 3 hari",
        body: "Setiap sesi semakan (bukan krisis) berakhir dengan tiga langkah konkrit yang boleh dicapai untuk tiga hari akan datang — bukan nasihat umum, disesuaikan dengan emosi yang dikesan dan bahasa yang anda gunakan.",
      },
      {
        title: "Selamat krisis secara lalai",
        body: "Pengesanan kata kunci berjalan dalam kedua-dua Bahasa Inggeris dan Bahasa Melayu sebelum apa-apa lagi. Jika ia dicetuskan, EmoBuddy segera memaparkan talian bantuan yang disahkan dan melangkau keseluruhan aliran jagaan diri — tiada kelewatan, tiada kekaburan.",
      },
      {
        title: "Sejarah anda, milik anda sahaja",
        body: "Setiap sesi semakan disimpan supaya anda boleh melihat corak dari semasa ke semasa. Keselamatan peringkat baris bermakna hanya anda yang boleh membaca data anda sendiri — malah tiada panel pentadbir yang boleh melihatnya dibina.",
      },
      {
        title: "Tiada rakaman, hanya pemahaman",
        body: "Suara anda diproses untuk mengesan emosi dan kemudian dibuang — EmoBuddy menyimpan hasil pendengaran, bukan rakaman itu sendiri.",
      },
    ],
  },
  howItWorks: {
    eyebrow: "Cara ia berfungsi",
    heading: "Daripada satu mesej kepada balasan sebenar",
    subheading:
      "Lima langkah, dan satu cabang keselamatan yang boleh mengganggu segala-galanya pada bila-bila masa.",
    steps: [
      {
        title: "Log masuk",
        body: "Satu akaun berfungsi merentasi laman web dan aplikasi iOS, disokong oleh pangkalan data selamat yang sama.",
      },
      {
        title: "Luahkan atau taip perasaan anda",
        body: "Dalam Bahasa Inggeris atau Bahasa Melayu — mana-mana yang anda lebih selesa gunakan sekarang.",
      },
      {
        title: "Semakan krisis, dahulu",
        body: "Sebelum mana-mana model emosi berjalan, kata-kata anda disemak terhadap senarai kata kunci krisis dalam kedua-dua bahasa. Jika sepadan, segala-galanya di bawah dilangkau.",
      },
      {
        title: "Dua model berjalan serentak",
        body: "Teks melalui Bi-GRU yang dilatih atas GoEmotions. Suara melalui CNN yang dilatih atas RAVDESS, membaca ciri MFCC dan delta. Kedua-duanya menghasilkan tahap keyakinan bagi setiap emosi.",
      },
      {
        title: "Gabungan, balasan, dan pelan",
        body: "Kedua-dua keputusan digabungkan mengikut wajaran F1 setiap kelas, dan EmoBuddy membalas dengan sesuatu yang khusus kepada apa yang dikesan — berserta pelan jagaan diri 3 hari.",
      },
    ],
    crisisNote:
      "Jika langkah 3 dicetuskan, EmoBuddy memaparkan talian bantuan Malaysia yang disahkan menggantikan pelan jagaan diri. Ini adalah pengatasan tegar, bukan cadangan yang boleh diubah oleh model.",
    techNote:
      "Ingin tahu tentang seni bina dan angka sebenar di sebalik langkah 4 dan 5? Itulah keseluruhan halaman Penyelidikan.",
  },
  research: {
    eyebrow: "Penyelidikan & Metodologi",
    heading: "Angka di sebalik setiap balasan",
    subheading:
      "Keputusan penilaian sebenar daripada data yang ditahan, dilaporkan secara jujur — termasuk di mana model paling lemah.",
    taskHeading: "Tugasan",
    taskBody:
      "EmoBuddy mengklasifikasikan setiap sesi semakan kepada salah satu daripada empat emosi — gembira, sedih, marah, atau neutral. Empat kelas kasar dipilih berbanding taksonomi yang lebih terperinci kerana kegunaan hiliran (memilih respons jagaan diri) tidak memerlukan resolusi lebih daripada itu, dan setiap kelas tambahan mengurangkan data latihan yang tersedia bagi setiap kelas.",
    textHeading: "Model teks — Bi-GRU atas GoEmotions",
    textBody:
      "Dilatih atas GoEmotions, dipetakan kepada empat kelas sasaran. Dinilai atas set ujian yang ditahan sebanyak 4,567 sampel yang tidak pernah dilihat semasa latihan.",
    audioHeading: "Model audio — CNN atas RAVDESS",
    audioBody:
      "Dilatih atas rakaman pertuturan lakonan RAVDESS, menggunakan pekali MFCC berserta ciri delta dan delta-delta sebagai saluran input.",
    audioValidationNote:
      "Disahkan dengan pengesahan silang 6-lipatan mengikut pelakon — tiada penutur muncul dalam kedua-dua lipatan latihan dan pengesahan pada mana-mana larian. Ini penting: tanpa pembahagian mengikut pelakon berasingan, model boleh kelihatan tepat semata-mata kerana mengenali suara tertentu, bukan emosi di dalamnya.",
    fusionHeading: "Gabungan — berwajaran mengikut kebolehpercayaan terukur, bukan tekaan",
    fusionBody:
      "Apabila teks dan audio tidak sepakat, EmoBuddy tidak mengambil purata keyakinan atau bergantung pada satu modaliti sahaja. Undi setiap model bagi sesuatu emosi diberi wajaran mengikut skor F1 model itu sendiri untuk emosi khusus tersebut, diukur atas data yang ditahan.",
    fusionFormula:
      "wajaran(teks, emosi) = F1_teks(emosi) / (F1_teks(emosi) + F1_audio(emosi))",
    fusionInsightHeading: "Apa yang wajaran itu sebenarnya tunjukkan",
    fusionInsightBody:
      "Teks mendominasi gabungan untuk gembira dan sedih — perkataan yang dipilih seseorang jelas membawa emosi tersebut. Audio mendominasi untuk marah dan neutral — nada dan rentak membawanya lebih baik daripada pilihan perkataan sahaja. Ini bukan andaian; ia terhasil terus daripada pengukuran setiap model secara berasingan.",
    limitationsHeading: "Batasan, dinyatakan dengan jelas",
    limitations: [
      "Kedua-dua model dilatih atas data Bahasa Inggeris (GoEmotions, RAVDESS), sedangkan produk ini dwibahasa — ungkapan emosi Melayu dikendalikan melalui peningkatan leksikon berasaskan peraturan dan kata kunci krisis, bukan model yang dilatih dalam Bahasa Melayu.",
      "RAVDESS ialah pertuturan lakonan Amerika Utara, bukan pertuturan semula jadi atau Malaysia — ketepatan sebenar atas suara Malaysia belum diuji.",
      "Empat kelas emosi adalah penyederhanaan kasar bagi pengalaman emosi sebenar.",
      "Model semasa (checkpoint) audio yang digunakan dipilih berdasarkan ketepatan pengesahan (56.3%), yang optimistik; angka pengesahan silang 61.5% adalah anggaran generalisasi yang jujur dan patut dirujuk.",
      "Pengesanan krisis berasaskan kata kunci, bukan pengelas terlatih — sengaja diselaraskan ke arah ketepatan tinggi untuk frasa serius berbanding liputan yang luas, dan didedahkan sebagai langkah keselamatan, bukan alat klinikal.",
    ],
    reproHeading: "Kebolehulangan",
    reproBody:
      "Notebook latihan dan praproses, fail JSON metrik mentah, dan matriks kekeliruan bagi kedua-dua model terdapat dalam repositori GitHub projek ini.",
    tableClass: "Kelas",
    tablePrecision: "Ketepatan",
    tableRecall: "Ingatan Semula",
    tableF1: "F1",
    tableSupport: "Sokongan",
  },
  about: {
    eyebrow: "Tentang Kami",
    heading: "Projek Tahun Akhir, dibina untuk benar-benar berfungsi",
    story:
      "EmoBuddy bermula dengan satu persoalan: apa yang diperlukan untuk membina alat semakan kesihatan mental yang menganggap Bahasa Melayu sebagai bahasa utama, bukan tambahan — dan yang jujur tentang apa yang model-modelnya boleh dan tidak boleh lakukan? Ini ialah Projek Tahun Akhir Diploma Kejuruteraan Elektrik, dibina sepenuhnya — aplikasi, kedua-dua model terlatih, backend, dan laman web ini — sebagai penyertaan dalam NICERS'26, sebuah pertandingan inovasi peringkat kebangsaan.",
    institutionHeading: "Institusi",
    institutionBody:
      "Politeknik Tuanku Sultanah Bahiyah, Jabatan Kejuruteraan Elektrik, Sesi 2, 2025/2026.",
    sdgHeading: "Selaras dengan Matlamat Pembangunan Mampan PBB",
    sdgBody:
      "Pilihan reka bentuk EmoBuddy sengaja dikaitkan dengan dua SDG, bukan sebagai slogan tetapi sebagai batasan yang membentuk apa yang dibina.",
    sdg3: "Kesihatan Baik & Kesejahteraan — sesi semakan kesihatan mental yang mudah diakses dan bebas prasangka, dengan pengatasan keselamatan krisis yang tegar.",
    sdg10: "Mengurangkan Ketaksamaan — sokongan Bahasa Melayu yang tulen, bukan produk Bahasa Inggeris yang diterjemahkan, supaya bahasa bukan penghalang untuk menggunakannya.",
  },
  privacy: {
    eyebrow: "Privasi & Keselamatan",
    heading: "Apa yang EmoBuddy simpan, dan apa yang tidak",
    subheading:
      "Ditulis dalam bahasa mudah, bukan kerana peguam memerlukannya, tetapi kerana anda berhak tahu sebelum menaip apa-apa.",
    storedHeading: "Apa yang disimpan",
    stored: [
      "Alamat e-mel anda, untuk log masuk.",
      "Teks sesi semakan dan mesej perbualan anda.",
      "Emosi yang dikesan dan skor keyakinan bagi setiap sesi semakan.",
      "Pelan jagaan diri 3 hari anda dan sama ada anda telah menandakannya selesai.",
    ],
    notStoredHeading: "Apa yang tidak disimpan",
    notStored: [
      "Rakaman suara anda sendiri — hanya tempohnya dan emosi yang dikesan daripadanya disimpan.",
      "Sebarang data daripada pengguna lain, tidak akan kelihatan kepada anda — atau data anda kepada sesiapa lain.",
    ],
    accessHeading: "Siapa yang boleh membacanya",
    accessBody:
      "Hanya anda. Setiap jadual dilindungi oleh keselamatan peringkat baris Postgres yang terikat kepada akaun anda — tiada papan pemuka pentadbir yang boleh melihat merentasi pengguna, kerana tiada satu pun dibina.",
    thirdPartyHeading: "Pihak ketiga",
    thirdPartyBody:
      "Balasan perbualan dijana oleh API Groq — teks mesej anda dihantar ke sana untuk menjana balasan. Kedua-dua model pengelasan emosi berjalan di server kami sendiri; sesi semakan anda tidak pernah dihantar kepada pihak ketiga untuk diklasifikasikan.",
    deletionHeading: "Memadam data anda",
    deletionBody:
      "Memadam satu perbualan membuang perbualan itu berserta setiap mesej dan pelan yang berkaitan dengannya, dengan segera dan kekal.",
    disclaimerHeading: "Apa yang EmoBuddy bukan",
    disclaimerBody:
      "Bukan peranti perubatan. Bukan diagnosis. Bukan perkhidmatan krisis. Bukan pengganti profesional bertauliah. Lihat halaman Penyelidikan untuk batasan jujur model-model di sebaliknya.",
  },
  help: {
    eyebrow: "Dapatkan Bantuan",
    heading: "Jika anda perlu bercakap dengan seseorang sekarang",
    subheading:
      "Talian ini percuma, sulit, dan beroperasi 24 jam. Anda tidak perlu membuka EmoBuddy untuk menggunakannya.",
    emergencyBanner: "Jika anda dalam bahaya serta-merta, hubungi 999.",
    hotlinesHeading: "Talian bantuan Malaysia yang disahkan",
    expectHeading: "Apa yang dijangka apabila anda menghubungi",
    expectBody:
      "Pendengar terlatih dan sulit — bukan bot, bukan giliran yang tidak ke mana-mana. Anda tidak perlu bersedia dengan kata-kata yang tepat.",
    emoBuddyDoesHeading: "Apa yang EmoBuddy lakukan apabila mengesan bahasa krisis",
    emoBuddyDoes: [
      "Segera memaparkan talian bantuan di atas, dalam bahasa yang anda gunakan.",
      "Melangkau sepenuhnya pelan jagaan diri untuk sesi semakan itu — ini bukan masa untuk senarai semak.",
    ],
    emoBuddyDoesNotHeading: "Apa yang EmoBuddy tidak lakukan",
    emoBuddyDoesNot: [
      "Ia tidak menghubungi perkhidmatan kecemasan bagi pihak anda.",
      "Ia tidak dipantau oleh manusia secara masa nyata.",
      "Ia tidak boleh menggantikan perbualan dengan pihak-pihak di atas.",
    ],
  },
  contact: {
    eyebrow: "Hubungi Kami",
    heading: "Soalan, maklum balas, atau media",
    body: "Ini adalah Projek Tahun Akhir pelajar — hubungi terus dan orang sebenar (yang membinanya) akan membalas.",
    emailLabel: "E-mel",
    githubLabel: "Kod sumber",
    institutionLabel: "Politeknik Tuanku Sultanah Bahiyah, Jabatan Kejuruteraan Elektrik",
  },
};

export default ms;
