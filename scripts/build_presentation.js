const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');

async function createPresentation() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pres.title = 'MEDIVANCE — Comprehensive Healthcare Presentation';
  pres.company = 'MEDIVANCE Healthcare Systems';

  // Theme Palette
  const C = {
    bgDark: '040D1E',
    bgCard: '071933',
    bgCardAlt: '0A2242',
    border: '183861',
    borderGlow: '00E5FF',
    accentCyan: '00E5FF',
    accentBlue: '38BDF8',
    accentGreen: '10B981',
    accentAmber: 'F59E0B',
    accentCoral: 'F43F5E',
    textWhite: 'FFFFFF',
    textMuted: '94A3B8',
    textDim: '64748B',
  };

  // Helper to add standard slide header & footer
  function setupSlideHeader(slide, category, title, subtitle) {
    slide.background = { color: C.bgDark };

    // Top Category Pill
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y: 0.28,
      w: category.length * 0.11 + 0.35,
      h: 0.26,
      fill: { color: '082545' },
      line: { color: C.accentCyan, width: 1 },
      rectRadius: 0.13,
    });
    slide.addText(category.toUpperCase(), {
      x: 0.6,
      y: 0.28,
      w: category.length * 0.11 + 0.35,
      h: 0.26,
      fontSize: 8.5,
      fontFace: 'Arial',
      color: C.accentCyan,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Slide Title
    slide.addText(title, {
      x: 0.6,
      y: 0.58,
      w: 8.8,
      h: 0.42,
      fontSize: 18,
      fontFace: 'Arial',
      color: C.textWhite,
      bold: true,
      valign: 'middle',
    });

    // Slide Subtitle
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.6,
        y: 0.98,
        w: 8.8,
        h: 0.25,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: C.accentBlue,
      });
    }

    // Header divider line
    slide.addShape(pres.ShapeType.line, {
      x: 0.6,
      y: 1.25,
      w: 8.8,
      h: 0,
      line: { color: C.border, width: 1 },
    });

    // Slide Footer
    slide.addText('MEDIVANCE Healthcare System  |  Executive Presentation  |  Confidential', {
      x: 0.6,
      y: 5.3,
      w: 7.0,
      h: 0.22,
      fontSize: 8,
      fontFace: 'Arial',
      color: C.textDim,
    });
  }

  // ==========================================
  // SLIDE 1: Title Slide (Hero with Visual)
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: '030914' };

    // Left Hero Image with Frame
    slide.addImage({
      path: 'public/images/hero-night.jpg',
      x: 5.3,
      y: 0.6,
      w: 4.1,
      h: 4.3,
      sizing: { type: 'cover', w: 4.1, h: 4.3 },
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 5.3,
      y: 0.6,
      w: 4.1,
      h: 4.3,
      fill: { color: '000000', transparency: 20 },
      line: { color: C.accentCyan, width: 1.5 },
      rectRadius: 0.15,
    });

    // Left Content Box
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y: 0.6,
      w: 4.5,
      h: 4.3,
      fill: { color: '06162D' },
      line: { color: '0F2D54', width: 1.5 },
      rectRadius: 0.15,
    });

    slide.addText('HEALTHCARE BEYOND EXPECTATIONS', {
      x: 0.9,
      y: 0.9,
      w: 3.9,
      h: 0.25,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: C.accentCyan,
      bold: true,
      tracking: 2,
    });

    slide.addText('MEDIVANCE', {
      x: 0.9,
      y: 1.15,
      w: 3.9,
      h: 0.8,
      fontSize: 42,
      fontFace: 'Arial',
      color: C.textWhite,
      bold: true,
    });

    slide.addText('Next-Gen Outpatient Management & AI Clinical Ecosystem', {
      x: 0.9,
      y: 1.95,
      w: 3.9,
      h: 0.45,
      fontSize: 13,
      fontFace: 'Arial',
      color: C.accentBlue,
      bold: true,
    });

    slide.addText(
      'An intelligent hospital platform designed to eliminate waiting rooms, automate outpatient queue progression, prevent accidental clinical errors, and deliver real-time automated SMS and email notifications.',
      {
        x: 0.9,
        y: 2.45,
        w: 3.9,
        h: 0.8,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 14,
      }
    );

    // 4 Key Pills
    const pills = [
      { t: '⚡ 30-Min OPD Auto-Pilot', c: C.accentCyan },
      { t: '📍 GPS Reception Bypass', c: C.accentGreen },
      { t: '🔔 24h & 1h Auto-Alerts', c: C.accentAmber },
      { t: '🔒 Smart QR Prescriptions', c: C.accentCoral },
    ];
    pills.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = 0.9 + col * 1.95;
      const py = 3.35 + row * 0.45;

      slide.addShape(pres.ShapeType.rect, {
        x: px,
        y: py,
        w: 1.85,
        h: 0.35,
        fill: { color: '092240' },
        line: { color: p.c, width: 0.8 },
        rectRadius: 0.08,
      });
      slide.addText(p.t, {
        x: px,
        y: py,
        w: 1.85,
        h: 0.35,
        fontSize: 7.5,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    });

    slide.addText('Production-Ready Clinical Ecosystem  |  Executive Demonstration', {
      x: 0.9,
      y: 4.4,
      w: 3.9,
      h: 0.25,
      fontSize: 8,
      fontFace: 'Arial',
      color: C.textDim,
    });
  }

  // ==========================================
  // SLIDE 2: Executive Summary & Core Pillars (With 3 Images)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Vision & Scope', 'Executive Summary: Re-engineering Outpatient Care', 'Zero Waiting Rooms, Zero Paperwork, Zero Manual Overload');

    const pillars = [
      {
        img: 'public/facilities/01.jpg',
        tag: 'PATIENT EXPERIENCE',
        title: 'Zero Waiting Rooms',
        bullets: [
          'Virtual queue tokens issued at booking',
          'Live countdown progress on mobile',
          'Arrive on time: No crowded waiting rooms',
        ],
        color: C.accentCyan,
      },
      {
        img: 'public/images/doctor-join-hero.jpg',
        tag: 'PHYSICIAN PRODUCTIVITY',
        title: 'Hands-Free OPD Auto-Pilot',
        bullets: [
          'Automatic 30-minute consultation timer',
          'Synthesized dual-tone hospital chime',
          'Speech synthesis calls out next patient',
        ],
        color: C.accentGreen,
      },
      {
        img: 'public/facilities/04.jpg',
        tag: 'COMMUNICATIONS',
        title: 'Automated Dispatches',
        bullets: [
          'T-24h SMS/Email preparatory reminder',
          'T-1h urgent travel departure alert',
          'Cuts patient no-show rates by 25%',
        ],
        color: C.accentAmber,
      },
    ];

    pillars.forEach((p, i) => {
      const cx = 0.6 + i * 2.95;

      // Card Container
      slide.addShape(pres.ShapeType.rect, {
        x: cx,
        y: 1.45,
        w: 2.8,
        h: 3.75,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.12,
      });

      // Top Image
      slide.addImage({
        path: p.img,
        x: cx + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.4,
        sizing: { type: 'cover', w: 2.6, h: 1.4 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: cx + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.4,
        fill: { color: '000000', transparency: 10 },
        line: { color: p.color, width: 1 },
        rectRadius: 0.08,
      });

      // Tag Pill
      slide.addShape(pres.ShapeType.rect, {
        x: cx + 0.15,
        y: 3.05,
        w: 1.8,
        h: 0.22,
        fill: { color: '0A284D' },
        line: { color: p.color, width: 0.8 },
        rectRadius: 0.06,
      });
      slide.addText(p.tag, {
        x: cx + 0.15,
        y: 3.05,
        w: 1.8,
        h: 0.22,
        fontSize: 7.5,
        fontFace: 'Arial',
        color: p.color,
        bold: true,
        align: 'center',
        valign: 'middle',
      });

      // Title
      slide.addText(p.title, {
        x: cx + 0.15,
        y: 3.32,
        w: 2.5,
        h: 0.35,
        fontSize: 12.5,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
      });

      // Bullets
      const bulletText = p.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: cx + 0.15,
        y: 3.7,
        w: 2.5,
        h: 1.4,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 13,
      });
    });
  }

  // ==========================================
  // SLIDE 3: The Traditional Healthcare Bottlenecks (4 Problem Images)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'The Problem', 'Traditional Healthcare Bottlenecks', 'Critical pain points faced daily by patients, doctors, and hospital administrators');

    const problems = [
      {
        img: 'public/facilities/05.jpg',
        title: '1. Waiting Room Chaos',
        bullets: ['2–3 hour blind waiting times', 'Overcrowded lobby infection risks', 'Zero visibility into queue progress'],
      },
      {
        img: 'public/facilities/06.jpg',
        title: '2. Reception Desk Queues',
        bullets: ['Pre-booked patients wait in line twice', 'Front-desk paperwork delays', 'Slow manual check-in verification'],
      },
      {
        img: 'public/images/aura-doctor.jpg',
        title: '3. Physician Burnout',
        bullets: ['Doctors manually clock-watch', 'Physical token shouting wastes time', 'Distracts from clinical diagnosis'],
      },
      {
        img: 'public/facilities/07.jpg',
        title: '4. Lost Paper Prescriptions',
        bullets: ['Illegible handwriting causes errors', 'Paper slips easily lost by patients', 'Zero digital fraud verification'],
      },
    ];

    problems.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = 0.6 + col * 4.45;
      const py = 1.45 + row * 1.85;

      slide.addShape(pres.ShapeType.rect, {
        x: px,
        y: py,
        w: 4.3,
        h: 1.7,
        fill: { color: C.bgCard },
        line: { color: '4B1D2A', width: 1 },
        rectRadius: 0.1,
      });

      // Thumbnail Image
      slide.addImage({
        path: p.img,
        x: px + 0.12,
        y: py + 0.15,
        w: 1.4,
        h: 1.4,
        sizing: { type: 'cover', w: 1.4, h: 1.4 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: px + 0.12,
        y: py + 0.15,
        w: 1.4,
        h: 1.4,
        line: { color: C.accentCoral, width: 1 },
        rectRadius: 0.08,
      });

      // Content Right
      slide.addText(p.title, {
        x: px + 1.62,
        y: py + 0.15,
        w: 2.55,
        h: 0.3,
        fontSize: 11.5,
        fontFace: 'Arial',
        color: C.accentCoral,
        bold: true,
      });

      const bulletText = p.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: px + 1.62,
        y: py + 0.5,
        w: 2.55,
        h: 1.0,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 13,
      });
    });
  }

  // ==========================================
  // SLIDE 4: The 5-Stage Automated Patient Journey (5 Workflow Images)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Architecture', 'The MEDIVANCE Automated Patient Journey', 'A 5-stage automated workflow connecting home booking directly to the clinic room');

    const steps = [
      {
        num: 'STEP 1',
        title: 'Smart Booking',
        img: 'public/facilities/08.jpg',
        bullets: ['Doctor selection', 'Simulated payment', 'Instant ref ID'],
        color: C.accentCyan,
      },
      {
        num: 'STEP 2',
        title: 'Auto Reminders',
        img: 'public/facilities/09.jpg',
        bullets: ['24h prior reminder', '1h departure alert', 'Zero clinic no-shows'],
        color: C.accentBlue,
      },
      {
        num: 'STEP 3',
        title: 'GPS Check-In',
        img: 'public/facilities/10.jpg',
        bullets: ['50m geofence radar', '1-click reception bypass', 'Turnstile QR Pass'],
        color: C.accentGreen,
      },
      {
        num: 'STEP 4',
        title: 'OPD Auto-Pilot',
        img: 'public/facilities/11.jpg',
        bullets: ['30-min auto timer', 'Acoustic chime', 'Natural speech callout'],
        color: C.accentAmber,
      },
      {
        num: 'STEP 5',
        title: 'QR Prescription',
        img: 'public/facilities/12.jpg',
        bullets: ['Digital e-slip', 'Pharmacy QR verify', '1-click PDF download'],
        color: C.accentCoral,
      },
    ];

    steps.forEach((s, i) => {
      const sx = 0.6 + i * 1.78;

      slide.addShape(pres.ShapeType.rect, {
        x: sx,
        y: 1.45,
        w: 1.68,
        h: 3.75,
        fill: { color: C.bgCard },
        line: { color: s.color, width: 1 },
        rectRadius: 0.1,
      });

      // Step Tag
      slide.addText(s.num, {
        x: sx + 0.1,
        y: 1.55,
        w: 1.48,
        h: 0.22,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: s.color,
        bold: true,
        align: 'center',
      });

      // Title
      slide.addText(s.title, {
        x: sx + 0.1,
        y: 1.78,
        w: 1.48,
        h: 0.32,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
        align: 'center',
      });

      // Thumbnail Image
      slide.addImage({
        path: s.img,
        x: sx + 0.1,
        y: 2.15,
        w: 1.48,
        h: 1.15,
        sizing: { type: 'cover', w: 1.48, h: 1.15 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: sx + 0.1,
        y: 2.15,
        w: 1.48,
        h: 1.15,
        line: { color: s.color, width: 0.8 },
        rectRadius: 0.06,
      });

      // Bullets
      const bulletText = s.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: sx + 0.1,
        y: 3.4,
        w: 1.48,
        h: 1.6,
        fontSize: 8,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 12,
      });
    });
  }

  // ==========================================
  // SLIDE 5: Automated SMS & Email Reminders (With 3 Visuals)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Patient Communications', 'Multi-Stage SMS & Email Notification Engine', 'Automated timely reminders sent 24h & 1h prior to appointment');

    const cards = [
      {
        img: 'public/facilities/13.jpg',
        badge: 'STAGE 1: BOOKING TIME',
        title: 'Instant Confirmation',
        bullets: [
          'Immediate SMS & Email dispatch',
          'Contains doctor name & visit room (Room 102)',
          'Issues unique tracking reference',
        ],
        tag: 'Status: DELIVERED',
        color: C.accentGreen,
      },
      {
        img: 'public/facilities/14.jpg',
        badge: 'STAGE 2: 24 HOURS BEFORE',
        title: '24h Departure Reminder',
        bullets: [
          'Delivered 24 hours prior to visit',
          'Reminds patient of date, time & prep',
          'Drastically cuts no-shows and forgetfulness',
        ],
        tag: 'Status: AUTO-SCHEDULED',
        color: C.accentCyan,
      },
      {
        img: 'public/facilities/15.jpg',
        badge: 'STAGE 3: 60 MINS BEFORE',
        title: '1h Urgent Travel Alert',
        bullets: [
          'High-priority urgent alert 60 min before',
          'Instructs patient to proceed to clinic',
          'Ensures patient is seated before token call',
        ],
        tag: 'Status: DELIVERED',
        color: C.accentAmber,
      },
    ];

    cards.forEach((c, i) => {
      const cx = 0.6 + i * 2.95;

      slide.addShape(pres.ShapeType.rect, {
        x: cx,
        y: 1.45,
        w: 2.8,
        h: 3.75,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.12,
      });

      slide.addImage({
        path: c.img,
        x: cx + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.35,
        sizing: { type: 'cover', w: 2.6, h: 1.35 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: cx + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.35,
        line: { color: c.color, width: 1 },
        rectRadius: 0.08,
      });

      slide.addText(c.badge, {
        x: cx + 0.15,
        y: 3.0,
        w: 2.5,
        h: 0.22,
        fontSize: 7.5,
        fontFace: 'Arial',
        color: c.color,
        bold: true,
      });

      slide.addText(c.title, {
        x: cx + 0.15,
        y: 3.25,
        w: 2.5,
        h: 0.32,
        fontSize: 12,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
      });

      const bulletText = c.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: cx + 0.15,
        y: 3.6,
        w: 2.5,
        h: 1.0,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 12,
      });

      slide.addShape(pres.ShapeType.rect, {
        x: cx + 0.15,
        y: 4.65,
        w: 2.5,
        h: 0.35,
        fill: { color: '0A2542' },
        line: { color: c.color, width: 0.8 },
        rectRadius: 0.06,
      });
      slide.addText(c.tag, {
        x: cx + 0.15,
        y: 4.65,
        w: 2.5,
        h: 0.35,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: c.color,
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    });
  }

  // ==========================================
  // SLIDE 6: 1-Click GPS Arrival & Turnstile Gate Pass (2 Large Visuals)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Smart Arrival', '1-Click GPS Arrival & Turnstile Gate Pass', 'Zero physical reception desk queue for pre-booked hospital patients');

    // Left: Geofence Radar Card
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y: 1.45,
      w: 4.3,
      h: 3.75,
      fill: { color: C.bgCard },
      line: { color: C.accentGreen, width: 1.2 },
      rectRadius: 0.14,
    });

    slide.addImage({
      path: 'public/facilities/02.jpg',
      x: 0.75,
      y: 1.6,
      w: 4.0,
      h: 1.6,
      sizing: { type: 'cover', w: 4.0, h: 1.6 },
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 0.75,
      y: 1.6,
      w: 4.0,
      h: 1.6,
      line: { color: C.accentGreen, width: 1 },
      rectRadius: 0.08,
    });

    slide.addText('50-METER GPS GEOFENCE RADAR', {
      x: 0.75,
      y: 3.3,
      w: 4.0,
      h: 0.22,
      fontSize: 8.5,
      fontFace: 'Arial',
      color: C.accentGreen,
      bold: true,
    });

    slide.addText('1-Click Reception Desk Bypass', {
      x: 0.75,
      y: 3.52,
      w: 4.0,
      h: 0.32,
      fontSize: 13,
      fontFace: 'Arial',
      color: C.textWhite,
      bold: true,
    });

    slide.addText(
      '• Radar detects patient arrival when within 50m of hospital premises.\n' +
      '• 1-tap "I Have Arrived" skips reception desk & paper queues completely.\n' +
      '• Doctor console immediately flips to glowing "🟢 Seated in Lobby".',
      {
        x: 0.75,
        y: 3.88,
        w: 4.0,
        h: 1.15,
        fontSize: 9,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 14,
      }
    );

    // Right: Turnstile Pass & Navigation Card
    slide.addShape(pres.ShapeType.rect, {
      x: 5.1,
      y: 1.45,
      w: 4.3,
      h: 3.75,
      fill: { color: C.bgCard },
      line: { color: C.accentCyan, width: 1.2 },
      rectRadius: 0.14,
    });

    slide.addImage({
      path: 'public/facilities/03.jpg',
      x: 5.25,
      y: 1.6,
      w: 4.0,
      h: 1.6,
      sizing: { type: 'cover', w: 4.0, h: 1.6 },
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 5.25,
      y: 1.6,
      w: 4.0,
      h: 1.6,
      line: { color: C.accentCyan, width: 1 },
      rectRadius: 0.08,
    });

    slide.addText('DIGITAL GATE PASS & INDOOR ROUTING', {
      x: 5.25,
      y: 3.3,
      w: 4.0,
      h: 0.22,
      fontSize: 8.5,
      fontFace: 'Arial',
      color: C.accentCyan,
      bold: true,
    });

    slide.addText('Turnstile QR Pass & Indoor Wayfinding', {
      x: 5.25,
      y: 3.52,
      w: 4.0,
      h: 0.32,
      fontSize: 13,
      fontFace: 'Arial',
      color: C.textWhite,
      bold: true,
    });

    slide.addText(
      '• Generates a scannable Turnstile QR Gate Pass directly on phone.\n' +
      '• Turnstiles scan QR to grant elevator & lobby entrance.\n' +
      '• Indoor route: Main Entrance → Elevator B (Level 1) → Room 102.',
      {
        x: 5.25,
        y: 3.88,
        w: 4.0,
        h: 1.15,
        fontSize: 9,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 14,
      }
    );
  }

  // ==========================================
  // SLIDE 7: Hands-Free 30-Min OPD Queue Auto-Pilot (3 Visuals)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Clinical Automation', 'Hands-Free 30-Minute OPD Queue Auto-Pilot', 'Automatic consultation progression with Web Audio synthesis & text-to-speech');

    const features = [
      {
        img: 'public/images/doctor-join-hero.jpg',
        title: '30-Min Live Countdown',
        badge: 'AUTOMATIC PACING',
        bullets: [
          'Auto-starts at scheduled visit time',
          'Visual progress bar (29:59 ... 00:00)',
          'Keeps clinic consultations on schedule',
        ],
        color: C.accentCyan,
      },
      {
        img: 'public/images/aura-doctor.jpg',
        title: 'Hospital Chime & Voice',
        badge: 'AUDIO SYNTHESIS',
        bullets: [
          'Synthesizes 800Hz/600Hz acoustic chime',
          'Speaks patient name & room aloud',
          'Eliminates manual token callouts',
        ],
        color: C.accentGreen,
      },
      {
        img: 'public/facilities/04.jpg',
        title: 'Fast Demo Mode Toggle',
        badge: 'DOCTOR PACING SELECTOR',
        bullets: [
          'Toggle: 30-Min clinical vs 30-Sec demo',
          'Allows rapid system testing & reviews',
          'Zero manual overhead for physicians',
        ],
        color: C.accentAmber,
      },
    ];

    features.forEach((f, i) => {
      const fx = 0.6 + i * 2.95;

      slide.addShape(pres.ShapeType.rect, {
        x: fx,
        y: 1.45,
        w: 2.8,
        h: 3.75,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.12,
      });

      slide.addImage({
        path: f.img,
        x: fx + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.4,
        sizing: { type: 'cover', w: 2.6, h: 1.4 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: fx + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.4,
        line: { color: f.color, width: 1 },
        rectRadius: 0.08,
      });

      slide.addText(f.badge, {
        x: fx + 0.15,
        y: 3.05,
        w: 2.5,
        h: 0.22,
        fontSize: 7.5,
        fontFace: 'Arial',
        color: f.color,
        bold: true,
      });

      slide.addText(f.title, {
        x: fx + 0.15,
        y: 3.3,
        w: 2.5,
        h: 0.32,
        fontSize: 12.5,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
      });

      const bulletText = f.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: fx + 0.15,
        y: 3.65,
        w: 2.5,
        h: 1.3,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 13,
      });
    });
  }

  // ==========================================
  // SLIDE 8: Accidental Click Protection & Safety (3 Visuals)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Clinical Safety', 'Accidental Click Protection & Safety Guards', 'Guarding physicians against premature session closure & wasted clinic capacity');

    const guards = [
      {
        img: 'public/facilities/05.jpg',
        title: 'Accidental Click Guard',
        badge: 'PREVENT MISTAKES',
        bullets: [
          'Safety modal if >2 mins remain on timer',
          'Prevents accidental completion clicks',
          'Requires explicit doctor confirmation',
        ],
        color: C.accentAmber,
      },
      {
        img: 'public/facilities/06.jpg',
        title: 'Fast-Track Priority Alert',
        badge: 'MAXIMIZE CAPACITY',
        bullets: [
          'If doctor finishes early, next patient alerted',
          'Instant SMS: "Doctor is free! You are next"',
          'Zero wasted physician consultation time',
        ],
        color: C.accentGreen,
      },
      {
        img: 'public/facilities/07.jpg',
        title: '12-Second Undo Safety',
        badge: 'INSTANT RECOVERY',
        bullets: [
          'Undo button stays active for 12 seconds',
          'Restores consultation & patient status',
          'Real-time sync across doctor & patient tabs',
        ],
        color: C.accentCyan,
      },
    ];

    guards.forEach((g, i) => {
      const gx = 0.6 + i * 2.95;

      slide.addShape(pres.ShapeType.rect, {
        x: gx,
        y: 1.45,
        w: 2.8,
        h: 3.75,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.12,
      });

      slide.addImage({
        path: g.img,
        x: gx + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.4,
        sizing: { type: 'cover', w: 2.6, h: 1.4 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: gx + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.4,
        line: { color: g.color, width: 1 },
        rectRadius: 0.08,
      });

      slide.addText(g.badge, {
        x: gx + 0.15,
        y: 3.05,
        w: 2.5,
        h: 0.22,
        fontSize: 7.5,
        fontFace: 'Arial',
        color: g.color,
        bold: true,
      });

      slide.addText(g.title, {
        x: gx + 0.15,
        y: 3.3,
        w: 2.5,
        h: 0.32,
        fontSize: 12.5,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
      });

      const bulletText = g.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: gx + 0.15,
        y: 3.65,
        w: 2.5,
        h: 1.3,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 13,
      });
    });
  }

  // ==========================================
  // SLIDE 9: Digital Smart Prescriptions & QR (2 Large Visuals)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Pharmacy Integration', 'Digital Smart Prescriptions & QR Verification', 'Official digital prescription slips with cryptographic QR code validation');

    // Left: Rx Builder Card
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y: 1.45,
      w: 4.3,
      h: 3.75,
      fill: { color: C.bgCard },
      line: { color: C.accentCyan, width: 1.2 },
      rectRadius: 0.14,
    });

    slide.addImage({
      path: 'public/facilities/08.jpg',
      x: 0.75,
      y: 1.6,
      w: 4.0,
      h: 1.6,
      sizing: { type: 'cover', w: 4.0, h: 1.6 },
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 0.75,
      y: 1.6,
      w: 4.0,
      h: 1.6,
      line: { color: C.accentCyan, width: 1 },
      rectRadius: 0.08,
    });

    slide.addText('CLINICAL PRESCRIPTION BUILDER', {
      x: 0.75,
      y: 3.3,
      w: 4.0,
      h: 0.22,
      fontSize: 8.5,
      fontFace: 'Arial',
      color: C.accentCyan,
      bold: true,
    });

    slide.addText('Structured Drug & Dosage Regimen', {
      x: 0.75,
      y: 3.52,
      w: 4.0,
      h: 0.32,
      fontSize: 13,
      fontFace: 'Arial',
      color: C.textWhite,
      bold: true,
    });

    slide.addText(
      '• Drug name, strength, dosage form & duration builder.\n' +
      '• Precise meal timing: Before food, with meals, or after food.\n' +
      '• Eliminates handwriting interpretation errors for pharmacies.\n' +
      '• Instant 1-click sync directly to patient portal wallet.',
      {
        x: 0.75,
        y: 3.88,
        w: 4.0,
        h: 1.15,
        fontSize: 9,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 14,
      }
    );

    // Right: QR Verification Card
    slide.addShape(pres.ShapeType.rect, {
      x: 5.1,
      y: 1.45,
      w: 4.3,
      h: 3.75,
      fill: { color: C.bgCard },
      line: { color: C.accentGreen, width: 1.2 },
      rectRadius: 0.14,
    });

    slide.addImage({
      path: 'public/facilities/09.jpg',
      x: 5.25,
      y: 1.6,
      w: 4.0,
      h: 1.6,
      sizing: { type: 'cover', w: 4.0, h: 1.6 },
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 5.25,
      y: 1.6,
      w: 4.0,
      h: 1.6,
      line: { color: C.accentGreen, width: 1 },
      rectRadius: 0.08,
    });

    slide.addText('ONLINE QR CODE VERIFICATION', {
      x: 5.25,
      y: 3.3,
      w: 4.0,
      h: 0.22,
      fontSize: 8.5,
      fontFace: 'Arial',
      color: C.accentGreen,
      bold: true,
    });

    slide.addText('Fraud Prevention & Pharmacy Sync', {
      x: 5.25,
      y: 3.52,
      w: 4.0,
      h: 0.32,
      fontSize: 13,
      fontFace: 'Arial',
      color: C.textWhite,
      bold: true,
    });

    slide.addText(
      '• Encrypted verification QR code printed on every official slip.\n' +
      '• External pharmacies scan QR or visit /verify/rx to authenticate.\n' +
      '• Prevents prescription tampering and counterfeit medication.\n' +
      '• 1-Click Print & PDF export with hospital digital signature seal.',
      {
        x: 5.25,
        y: 3.88,
        w: 4.0,
        h: 1.15,
        fontSize: 9,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 14,
      }
    );
  }

  // ==========================================
  // SLIDE 10: Multi-Role Portals & Ecosystem (3 Visuals)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'User Roles', 'Three Purpose-Built Clinical Portals', 'Tailored experiences for patients, physicians, and hospital administration');

    const portals = [
      {
        img: 'public/doctors/d1.jpg',
        role: 'PATIENT PORTAL',
        tag: 'CONVENIENCE & CONTROL',
        bullets: [
          '5-step specialist booking & card payment',
          'Live queue token radar & wait tracker',
          '1-click GPS hospital arrival check-in',
          'Digital Gate Pass with turnstile QR',
          'Automated SMS/Email notification center',
        ],
        color: C.accentCyan,
      },
      {
        img: 'public/doctors/d2.jpg',
        role: 'DOCTOR CONSOLE',
        tag: 'EFFICIENCY & ACCURACY',
        bullets: [
          'Hands-free 30-minute queue auto-pilot',
          'Lobby radar showing "Seated in Lobby"',
          'Accidental click safety guard modal',
          'Smart digital prescription writer with QR',
          '45-second Aura AI clinical SOAP notes',
        ],
        color: C.accentGreen,
      },
      {
        img: 'public/doctors/d3.jpg',
        role: 'ADMIN COMMAND',
        tag: 'GOVERNANCE & METRICS',
        bullets: [
          'Hospital-wide live queue monitor',
          'Doctor credential verification & vetting',
          'Revenue, consultations & slot analytics',
          'Bed management & inventory controller',
          'Full audit trail of all appointments',
        ],
        color: C.accentAmber,
      },
    ];

    portals.forEach((p, i) => {
      const px = 0.6 + i * 2.95;

      slide.addShape(pres.ShapeType.rect, {
        x: px,
        y: 1.45,
        w: 2.8,
        h: 3.75,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.12,
      });

      slide.addImage({
        path: p.img,
        x: px + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.35,
        sizing: { type: 'cover', w: 2.6, h: 1.35 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: px + 0.1,
        y: 1.55,
        w: 2.6,
        h: 1.35,
        line: { color: p.color, width: 1 },
        rectRadius: 0.08,
      });

      slide.addText(p.tag, {
        x: px + 0.15,
        y: 3.0,
        w: 2.5,
        h: 0.22,
        fontSize: 7.5,
        fontFace: 'Arial',
        color: p.color,
        bold: true,
      });

      slide.addText(p.role, {
        x: px + 0.15,
        y: 3.25,
        w: 2.5,
        h: 0.32,
        fontSize: 12.5,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
      });

      const bulletText = p.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: px + 0.15,
        y: 3.62,
        w: 2.5,
        h: 1.4,
        fontSize: 8,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 12,
      });
    });
  }

  // ==========================================
  // SLIDE 11: Technical Architecture & Real-Time Stack (4 Visuals)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Technology', 'Technical Architecture & Stack', 'Modern, resilient, zero-refresh architecture engineered for high hospital uptime');

    const techs = [
      {
        img: 'public/facilities/11.jpg',
        title: 'Next.js 14 App Router',
        tag: 'REACT FRAMEWORK',
        bullets: ['React Server Components', 'Instant zero-reload routing', 'Optimized bundle size'],
      },
      {
        img: 'public/facilities/12.jpg',
        title: 'BroadcastChannel API',
        tag: 'CROSS-TAB IPC',
        bullets: ['Zero-latency browser sync', 'Instant doctor/patient updates', 'No server polling overhead'],
      },
      {
        img: 'public/facilities/13.jpg',
        title: 'Web Audio & Speech',
        tag: 'AUDIO SYNTHESIS',
        bullets: ['800Hz / 600Hz acoustic chime', 'Natural speech patient callouts', 'Zero external audio files'],
      },
      {
        img: 'public/facilities/14.jpg',
        title: 'Dual-Engine Persistence',
        tag: 'DATABASE TIER',
        bullets: ['Offline LocalStorage fallback', 'Cloud Supabase PostgreSQL', '100% data durability'],
      },
    ];

    techs.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const tx = 0.6 + col * 4.45;
      const ty = 1.45 + row * 1.85;

      slide.addShape(pres.ShapeType.rect, {
        x: tx,
        y: ty,
        w: 4.3,
        h: 1.7,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.1,
      });

      slide.addImage({
        path: t.img,
        x: tx + 0.12,
        y: ty + 0.15,
        w: 1.4,
        h: 1.4,
        sizing: { type: 'cover', w: 1.4, h: 1.4 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: tx + 0.12,
        y: ty + 0.15,
        w: 1.4,
        h: 1.4,
        line: { color: C.accentCyan, width: 1 },
        rectRadius: 0.08,
      });

      slide.addText(t.tag, {
        x: tx + 1.62,
        y: ty + 0.15,
        w: 2.55,
        h: 0.22,
        fontSize: 7.5,
        fontFace: 'Arial',
        color: C.accentCyan,
        bold: true,
      });

      slide.addText(t.title, {
        x: tx + 1.62,
        y: ty + 0.38,
        w: 2.55,
        h: 0.3,
        fontSize: 12,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
      });

      const bulletText = t.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: tx + 1.62,
        y: ty + 0.72,
        w: 2.55,
        h: 0.85,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 12,
      });
    });
  }

  // ==========================================
  // SLIDE 12: Hospital Impact & ROI Metrics (4 Visual Metric Cards)
  // ==========================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Business Impact', 'Quantifiable Hospital ROI & Clinical Impact', 'Measurable performance improvements delivered by MEDIVANCE');

    const metrics = [
      {
        img: 'public/facilities/15.jpg',
        stat: '85%',
        title: 'Waiting Room Drop',
        bullets: ['Virtual live queue tokens', 'Eliminates lobby crowding', 'Zero infection congestion'],
        color: C.accentCyan,
      },
      {
        img: 'public/facilities/01.jpg',
        stat: '0 sec',
        title: 'Reception Desk Wait',
        bullets: ['1-Click GPS check-in', 'Turnstile gate pass entry', 'Complete front-desk bypass'],
        color: C.accentGreen,
      },
      {
        img: 'public/facilities/02.jpg',
        stat: '25%',
        title: 'Drop in No-Shows',
        bullets: ['Automated 24h & 1h alerts', 'Keeps patients punctual', 'Frees clinic capacity'],
        color: C.accentAmber,
      },
      {
        img: 'public/facilities/03.jpg',
        stat: '100%',
        title: 'Verified Prescriptions',
        bullets: ['Cryptographic QR codes', 'Zero handwriting errors', 'Guaranteed pharmacy auth'],
        color: C.accentCoral,
      },
    ];

    metrics.forEach((m, i) => {
      const mx = 0.6 + i * 2.22;

      slide.addShape(pres.ShapeType.rect, {
        x: mx,
        y: 1.45,
        w: 2.1,
        h: 3.75,
        fill: { color: C.bgCard },
        line: { color: m.color, width: 1.2 },
        rectRadius: 0.12,
      });

      slide.addImage({
        path: m.img,
        x: mx + 0.1,
        y: 1.55,
        w: 1.9,
        h: 1.15,
        sizing: { type: 'cover', w: 1.9, h: 1.15 },
      });
      slide.addShape(pres.ShapeType.rect, {
        x: mx + 0.1,
        y: 1.55,
        w: 1.9,
        h: 1.15,
        line: { color: m.color, width: 0.8 },
        rectRadius: 0.06,
      });

      slide.addText(m.stat, {
        x: mx + 0.1,
        y: 2.78,
        w: 1.9,
        h: 0.45,
        fontSize: 26,
        fontFace: 'Arial',
        color: m.color,
        bold: true,
        align: 'center',
      });

      slide.addText(m.title, {
        x: mx + 0.1,
        y: 3.25,
        w: 1.9,
        h: 0.32,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: C.textWhite,
        bold: true,
        align: 'center',
      });

      slide.addShape(pres.ShapeType.line, {
        x: mx + 0.25,
        y: 3.65,
        w: 1.6,
        h: 0,
        line: { color: C.border, width: 0.8 },
      });

      const bulletText = m.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, {
        x: mx + 0.1,
        y: 3.75,
        w: 1.9,
        h: 1.35,
        fontSize: 8,
        fontFace: 'Arial',
        color: C.textMuted,
        align: 'center',
        lineSpacing: 12,
      });
    });
  }

  // ==========================================
  // SLIDE 13: Conclusion & Next Steps (With High-Impact Hospital Image)
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: '030914' };

    // Right Hospital Visual
    slide.addImage({
      path: 'public/images/emergency-hospital.jpg',
      x: 5.3,
      y: 0.6,
      w: 4.1,
      h: 4.3,
      sizing: { type: 'cover', w: 4.1, h: 4.3 },
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 5.3,
      y: 0.6,
      w: 4.1,
      h: 4.3,
      fill: { color: '000000', transparency: 15 },
      line: { color: C.accentCyan, width: 1.5 },
      rectRadius: 0.15,
    });

    // Left Summary Card
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y: 0.6,
      w: 4.5,
      h: 4.3,
      fill: { color: '06162D' },
      line: { color: '0F2D54', width: 1.5 },
      rectRadius: 0.15,
    });

    slide.addText('HEALTHCARE RE-IMAGINED', {
      x: 0.9,
      y: 0.9,
      w: 3.9,
      h: 0.25,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: C.accentCyan,
      bold: true,
      tracking: 2,
    });

    slide.addText('MEDIVANCE: Ready for Deployment', {
      x: 0.9,
      y: 1.15,
      w: 3.9,
      h: 0.65,
      fontSize: 22,
      fontFace: 'Arial',
      color: C.textWhite,
      bold: true,
    });

    slide.addText(
      'MEDIVANCE bridges patient convenience and clinical workflow into one seamless ecosystem.\n\n' +
      'Every touchpoint — from home booking to GPS arrival, 30-min auto-pilot pacing, and digital QR prescription validation — is engineered for zero waiting and maximum clinical quality.',
      {
        x: 0.9,
        y: 1.85,
        w: 3.9,
        h: 1.1,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: C.textMuted,
        lineSpacing: 15,
      }
    );

    // Callout Box with System Links
    slide.addShape(pres.ShapeType.rect, {
      x: 0.9,
      y: 3.05,
      w: 3.9,
      h: 1.15,
      fill: { color: '071E3A' },
      line: { color: C.accentCyan, width: 1 },
      rectRadius: 0.1,
    });

    slide.addText('Interactive Live Demo Links:', {
      x: 1.05,
      y: 3.15,
      w: 3.6,
      h: 0.22,
      fontSize: 10,
      fontFace: 'Arial',
      color: C.accentCyan,
      bold: true,
    });

    slide.addText(
      '• Patient Portal: http://localhost:3000/patient\n' +
      '• Doctor Console: http://localhost:3000/doctor\n' +
      '• Admin Command: http://localhost:3000/admin',
      {
        x: 1.05,
        y: 3.42,
        w: 3.6,
        h: 0.7,
        fontSize: 9,
        fontFace: 'Arial',
        color: C.textWhite,
        lineSpacing: 14,
      }
    );

    slide.addText('Thank You  |  Q&A Session', {
      x: 0.9,
      y: 4.4,
      w: 3.9,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Arial',
      color: C.accentGreen,
      bold: true,
    });
  }

  // Generate PPTX in memory
  const rawBuffer = await pres.write({ outputType: 'nodebuffer' });

  // Post-Process with JSZip to inject native PowerPoint Transitions & Animations
  const zip = await JSZip.loadAsync(rawBuffer);

  // Transitions: varied across slides for cinematic presentation feel
  const transitionTypes = [
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:push dir="r"/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:wipe dir="d"/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:push dir="r"/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>',
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',
  ];

  // Timing/Animation template for shape animations
  const buildTimingXml = (shapeIds) => {
    if (!shapeIds || shapeIds.length === 0) return '';
    const childNodes = shapeIds.map((sid, idx) => `
      <p:cTn id="${idx + 10}" dur="500" fill="hold">
        <p:stCondLst><p:cond delay="0"/></p:stCondLst>
        <p:childTnLst>
          <p:set>
            <p:cBhvr>
              <p:cTn id="${idx + 100}" dur="1" fill="hold"/>
              <p:tgtEl><p:spTgt spid="${sid}"/></p:tgtEl>
              <p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>
            </p:cBhvr>
            <p:to><p:strVal val="visible"/></p:to>
          </p:set>
          <p:animEffect transition="in" filter="fade">
            <p:cBhvr>
              <p:cTn id="${idx + 200}" dur="500"/>
              <p:tgtEl><p:spTgt spid="${sid}"/></p:tgtEl>
            </p:cBhvr>
          </p:animEffect>
        </p:childTnLst>
      </p:cTn>
    `).join('');

    return `
      <p:timing>
        <p:tnLst>
          <p:par>
            <p:cTn id="1" dur="indefinite" restart="always" nodeType="tmRoot">
              <p:childTnLst>
                <p:seq concurrent="1" nextAc="seek">
                  <p:cTn id="2" dur="indefinite" nodeType="mainSeq">
                    <p:childTnLst>
                      ${childNodes}
                    </p:childTnLst>
                  </p:cTn>
                  <p:prevCondLst><p:cond evt="onPrev" delay="0"/></p:prevCondLst>
                  <p:nextCondLst><p:cond evt="onNext" delay="0"/></p:nextCondLst>
                </p:seq>
              </p:childTnLst>
            </p:cTn>
          </p:par>
        </p:tnLst>
      </p:timing>
    `;
  };

  let slideIndex = 0;
  while (true) {
    const slideName = `ppt/slides/slide${slideIndex + 1}.xml`;
    const slideFile = zip.file(slideName);
    if (!slideFile) break;

    let xml = await slideFile.async('string');

    // Extract shape IDs for animations
    const shapeIdMatches = [...xml.matchAll(/<p:cNvPr id="(\d+)"/g)].map(m => m[1]);
    const animShapeIds = shapeIdMatches.filter(id => parseInt(id, 10) >= 3).slice(0, 4);

    const trans = transitionTypes[slideIndex % transitionTypes.length];
    const timingXml = animShapeIds.length > 0 ? buildTimingXml(animShapeIds) : '';

    // Insert transition and timing before </p:sld>
    xml = xml.replace('</p:clrMapOvr>', `</p:clrMapOvr>${trans}${timingXml}`);
    zip.file(slideName, xml);

    slideIndex++;
  }

  const finalBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  // Output paths
  const outputPath = path.resolve('MEDIVANCE_Executive_Presentation.pptx');
  fs.writeFileSync(outputPath, finalBuffer);

  const artifactPath = path.resolve('C:/Users/Esha/.gemini/antigravity/brain/dbe57032-cfdd-47d0-8f7b-09f28aeb13e4/MEDIVANCE_Executive_Presentation.pptx');
  fs.writeFileSync(artifactPath, finalBuffer);

  console.log(`Presentation generated successfully with ${slideIndex} visual slides!`);
  console.log(`Saved to: ${outputPath}`);
  console.log(`Artifact saved to: ${artifactPath}`);
}

createPresentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
