const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');

async function createMaster13Presentation() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pres.title = 'MEDIVANCE — Web-Based Doctor Appointment System';
  pres.company = 'MEDIVANCE Healthcare Systems';

  const userUploaded = 'C:/Users/Esha/.gemini/antigravity/brain/dbe57032-cfdd-47d0-8f7b-09f28aeb13e4/.user_uploaded';

  // Clean, high-contrast healthcare palette
  const C = {
    bgDark: '040D1E',       // Deep Navy
    bgCard: '071933',       // Card background
    bgCardAlt: '0A2242',    // Accent card background
    border: '183861',       // Subtle border
    borderGlow: '00E5FF',   // Cyan glow border
    accentCyan: '00E5FF',   // High-tech Cyan
    accentTeal: '0D9488',   // Medical Teal
    accentBlue: '38BDF8',   // Sky Blue
    accentGreen: '10B981',  // Emerald Green
    accentAmber: 'F59E0B',  // Amber highlight
    accentCoral: 'F43F5E',  // Coral alert
    textWhite: 'FFFFFF',    // Crisp white
    textMuted: '94A3B8',    // Muted slate
    textDim: '64748B',      // Dim footer text
  };

  // Helper: Header for slides 2-13 with simple English title & subtitle
  function setupSlideHeader(slide, category, title, subtitle) {
    slide.background = { color: C.bgDark };

    // Category Pill
    const pillW = Math.max(1.3, category.length * 0.10 + 0.35);
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y: 0.28,
      w: pillW,
      h: 0.26,
      fill: { color: '082545' },
      line: { color: C.accentCyan, width: 1 },
      rectRadius: 0.13,
    });
    slide.addText(category.toUpperCase(), {
      x: 0.6,
      y: 0.28,
      w: pillW,
      h: 0.26,
      fontSize: 8.5,
      fontFace: 'Arial',
      color: C.accentCyan,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Slide Title (Clear & Simple)
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

    // Subtitle (One simple sentence)
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

    // Divider Line
    slide.addShape(pres.ShapeType.line, {
      x: 0.6,
      y: 1.25,
      w: 8.8,
      h: 0,
      line: { color: C.border, width: 1 },
    });

    // Slide Footer
    slide.addText('MEDIVANCE Healthcare System  |  Presenter: Esha Kewalramani', {
      x: 0.6,
      y: 5.3,
      w: 7.0,
      h: 0.22,
      fontSize: 8,
      fontFace: 'Arial',
      color: C.textDim,
    });
  }

  // Helper: Card background with border
  function addCard(slide, x, y, w, h, fill = C.bgCard, line = C.border, radius = 0.08) {
    slide.addShape(pres.ShapeType.rect, {
      x, y, w, h,
      fill: { color: fill },
      line: { color: line, width: 1 },
      rectRadius: radius,
    });
  }

  // =========================================================================
  // SLIDE 1 — MEDIVANCE: THE INTRODUCTION
  // =========================================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    // Right side backdrop frame
    slide.addShape(pres.ShapeType.rect, {
      x: 5.2, y: 0, w: 4.8, h: 5.625,
      fill: { color: '06162D' },
      line: { color: C.border, width: 1 }
    });

    // Logo & Emblem
    const logoFull = path.resolve('public/images/logo-full.png');
    if (fs.existsSync(logoFull)) {
      slide.addImage({
        path: logoFull,
        x: 0.6, y: 0.55, w: 2.6, h: 0.58
      });
    } else {
      slide.addText('MEDIVANCE', {
        x: 0.6, y: 0.55, w: 3.5, h: 0.5,
        fontSize: 24, fontFace: 'Arial', color: C.accentCyan, bold: true
      });
    }

    // Project Tag Pill
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6, y: 1.3, w: 2.9, h: 0.28,
      fill: { color: '092B4F' },
      line: { color: C.accentCyan, width: 1 },
      rectRadius: 0.14
    });
    slide.addText('DOCTOR APPOINTMENT SYSTEM', {
      x: 0.6, y: 1.3, w: 2.9, h: 0.28,
      fontSize: 8.5, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
    });

    // Title & Simple Subtitle
    slide.addText('MEDIVANCE', {
      x: 0.6, y: 1.7, w: 4.4, h: 0.55,
      fontSize: 28, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    slide.addText('Web-Based Doctor Appointment System', {
      x: 0.6, y: 2.25, w: 4.4, h: 0.35,
      fontSize: 13.5, fontFace: 'Arial', color: C.accentBlue, bold: true
    });

    // Simple Point-to-Point Summary
    const introPoints = [
      '• Book appointments online in seconds without waiting in lines.',
      '• Track live queue tokens directly from your phone.',
      '• Contactless QR gate pass for fast hospital entry.',
      '• Connects patients, doctors, and hospital admin in one system.'
    ];
    slide.addText(introPoints.join('\n\n'), {
      x: 0.6, y: 2.7, w: 4.3, h: 1.25,
      fontSize: 9, fontFace: 'Arial', color: C.textMuted
    });

    // Presenter Info Card
    addCard(slide, 0.6, 4.1, 4.3, 0.9, '071A35', C.accentTeal, 0.1);
    slide.addText('PRESENTED BY', {
      x: 0.8, y: 4.2, w: 3.9, h: 0.18,
      fontSize: 8, fontFace: 'Arial', color: C.accentCyan, bold: true
    });
    slide.addText('Esha Kewalramani', {
      x: 0.8, y: 4.4, w: 3.9, h: 0.3,
      fontSize: 14, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    slide.addText('Project Lead & Full-Stack Developer', {
      x: 0.8, y: 4.7, w: 3.9, h: 0.2,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: Real Homepage Hero Visual
    const heroImage = path.resolve('public/images/hero-night.jpg');
    if (fs.existsSync(heroImage)) {
      addCard(slide, 5.4, 0.65, 4.0, 4.3, '061328', C.accentCyan, 0.12);
      slide.addImage({
        path: heroImage,
        x: 5.5, y: 0.75, w: 3.8, h: 3.3,
        rounding: true
      });
      // Simple label below hero
      slide.addText('ACTUAL WEBSITE HOMEPAGE', {
        x: 5.5, y: 4.15, w: 3.8, h: 0.22,
        fontSize: 9, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center'
      });
      slide.addText('Live production view of the public portal', {
        x: 5.5, y: 4.4, w: 3.8, h: 0.22,
        fontSize: 8, fontFace: 'Arial', color: C.textMuted, align: 'center'
      });
    }
  }

  // =========================================================================
  // SLIDE 2 — THE TWO SPLASH SCREENS
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Welcome Screens', 'The Two Splash Screens', 'A smooth two-step introduction to MEDIVANCE');

    // Central Statement Banner
    addCard(slide, 0.6, 1.35, 8.8, 0.38, '081E3D', C.accentCyan, 0.08);
    slide.addText('"MEDIVANCE should not simply open; it should leave an impression."', {
      x: 0.6, y: 1.35, w: 8.8, h: 0.38,
      fontSize: 11, fontFace: 'Arial', color: C.accentCyan, bold: true, italic: true, align: 'center', valign: 'middle'
    });

    // Splash 1 Card (Left)
    const splash1Path = path.join(userUploaded, 'media_1795030648270_891afb17.jpg');
    addCard(slide, 0.6, 1.85, 4.25, 3.3, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.98, w: 2.1, h: 0.24,
      fill: { color: '0A294A' }, line: { color: C.accentCyan, width: 1 }, rectRadius: 0.12
    });
    slide.addText('STAGE 1: BRAND IDENTITY', {
      x: 0.8, y: 1.98, w: 2.1, h: 0.24,
      fontSize: 8, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(splash1Path)) {
      slide.addImage({
        path: splash1Path,
        x: 0.8, y: 2.3, w: 3.85, h: 1.95,
        rounding: true
      });
    }
    const s1Points = [
      '• Shows the MEDIVANCE name and official logo.',
      '• Gives patients a clean and trustworthy first look.'
    ];
    slide.addText(s1Points.join('\n'), {
      x: 0.8, y: 4.35, w: 3.85, h: 0.65,
      fontSize: 8.5, fontFace: 'Arial', color: C.textWhite
    });

    // Splash 2 Card (Right)
    const splash2Path = path.join(userUploaded, 'media_1795030648301_e5859515.jpg');
    addCard(slide, 5.15, 1.85, 4.25, 3.3, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 5.35, y: 1.98, w: 2.3, h: 0.24,
      fill: { color: '0A294A' }, line: { color: C.accentTeal, width: 1 }, rectRadius: 0.12
    });
    slide.addText('STAGE 2: HEALTHCARE VISION', {
      x: 5.35, y: 1.98, w: 2.3, h: 0.24,
      fontSize: 8, fontFace: 'Arial', color: C.accentTeal, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(splash2Path)) {
      slide.addImage({
        path: splash2Path,
        x: 5.35, y: 2.3, w: 3.85, h: 1.95,
        rounding: true
      });
    }
    const s2Points = [
      '• Welcomes users into the modern hospital experience.',
      '• Introduces our goal: zero waiting rooms and faster care.'
    ];
    slide.addText(s2Points.join('\n'), {
      x: 5.35, y: 4.35, w: 3.85, h: 0.65,
      fontSize: 8.5, fontFace: 'Arial', color: C.textWhite
    });
  }

  // =========================================================================
  // SLIDE 3 — THE WEBSITE EXPERIENCE: FIRST THREE PAGES
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Public Website', 'The Website Experience: First Three Pages', 'Clean public pages to help patients learn, find doctors, and get help fast');

    // Page 1: Home (Hero Left Gallery)
    const homeScreenshot = path.join(userUploaded, 'media_1795251666647_6d41677b.jpg');
    addCard(slide, 0.6, 1.4, 4.2, 3.75, C.bgCard, C.accentCyan, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.55, w: 1.6, h: 0.24,
      fill: { color: '082545' }, line: { color: C.accentCyan, width: 1 }, rectRadius: 0.12
    });
    slide.addText('PAGE 1: HOMEPAGE', {
      x: 0.8, y: 1.55, w: 1.6, h: 0.24,
      fontSize: 8, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(homeScreenshot)) {
      slide.addImage({
        path: homeScreenshot,
        x: 0.8, y: 1.88, w: 3.8, h: 2.1,
        rounding: true
      });
    }
    slide.addText('Main Hospital Starting Point', {
      x: 0.8, y: 4.08, w: 3.8, h: 0.22,
      fontSize: 10, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p1Points = [
      '• Easy buttons for 24/7 emergency calls and fast booking.',
      '• Purpose: Welcomes users and guides them straight to care.'
    ];
    slide.addText(p1Points.join('\n'), {
      x: 0.8, y: 4.32, w: 3.8, h: 0.7,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Page 2: About / Services (Top Right)
    const aboutScreenshot = path.resolve('public/images/promo-care.jpg');
    addCard(slide, 5.0, 1.4, 4.4, 1.8, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 5.15, y: 1.52, w: 1.8, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentTeal, width: 1 }, rectRadius: 0.11
    });
    slide.addText('PAGE 2: ABOUT & SERVICES', {
      x: 5.15, y: 1.52, w: 1.8, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentTeal, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(aboutScreenshot)) {
      slide.addImage({
        path: aboutScreenshot,
        x: 5.15, y: 1.82, w: 2.1, h: 1.25,
        rounding: true
      });
    }
    slide.addText('Our Care & Departments', {
      x: 7.35, y: 1.7, w: 1.95, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p2Points = [
      '• Explains medical wings and patient facilities.',
      '• Purpose: Builds trust with patients and families.'
    ];
    slide.addText(p2Points.join('\n\n'), {
      x: 7.35, y: 1.98, w: 1.95, h: 1.05,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Page 3: Doctors Directory (Bottom Right)
    const doctorScreenshot = path.resolve('public/images/doctor-join-hero.jpg');
    addCard(slide, 5.0, 3.35, 4.4, 1.8, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 5.15, y: 3.47, w: 1.8, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentBlue, width: 1 }, rectRadius: 0.11
    });
    slide.addText('PAGE 3: DOCTORS DIRECTORY', {
      x: 5.15, y: 3.47, w: 1.8, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentBlue, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(doctorScreenshot)) {
      slide.addImage({
        path: doctorScreenshot,
        x: 5.15, y: 3.77, w: 2.1, h: 1.25,
        rounding: true
      });
    }
    slide.addText('Find Specialist Doctors', {
      x: 7.35, y: 3.65, w: 1.95, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p3Points = [
      '• Search by medical specialty, fee, and open hours.',
      '• Purpose: Helps patients choose the right doctor easily.'
    ];
    slide.addText(p3Points.join('\n\n'), {
      x: 7.35, y: 3.92, w: 1.95, h: 1.1,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });
  }

  // =========================================================================
  // SLIDE 4 — THE WEBSITE EXPERIENCE: NEXT THREE PAGES
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Public Website', 'The Website Experience: Next Three Pages', 'Simple tools to find the hospital, book a visit, and open user portals');

    // Page 4: Live Location (Left Card)
    const locScreenshot = path.resolve('public/images/live-location-hero.jpg');
    addCard(slide, 0.6, 1.45, 2.75, 3.7, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 0.75, y: 1.6, w: 1.7, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentTeal, width: 1 }, rectRadius: 0.11
    });
    slide.addText('PAGE 4: LIVE LOCATION', {
      x: 0.75, y: 1.6, w: 1.7, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentTeal, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(locScreenshot)) {
      slide.addImage({
        path: locScreenshot,
        x: 0.75, y: 1.9, w: 2.45, h: 1.6,
        rounding: true
      });
    }
    slide.addText('Hospital Floor & GPS Map', {
      x: 0.75, y: 3.6, w: 2.45, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p4Points = [
      '• Clear floor plans and clinic room numbers.',
      '• Purpose: Patients find their doctor room without getting lost.'
    ];
    slide.addText(p4Points.join('\n\n'), {
      x: 0.75, y: 3.88, w: 2.45, h: 1.1,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Page 5: Direct Appointment Booking (Center Card)
    const bookScreenshot = path.join(userUploaded, 'media_1795113304445_c24373ce.jpg');
    addCard(slide, 3.6, 1.45, 2.75, 3.7, C.bgCard, C.accentCyan, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 3.75, y: 1.6, w: 1.7, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentCyan, width: 1 }, rectRadius: 0.11
    });
    slide.addText('PAGE 5: DIRECT BOOKING', {
      x: 3.75, y: 1.6, w: 1.7, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(bookScreenshot)) {
      slide.addImage({
        path: bookScreenshot,
        x: 3.75, y: 1.9, w: 2.45, h: 1.6,
        rounding: true
      });
    }
    slide.addText('Fast Booking in Seconds', {
      x: 3.75, y: 3.6, w: 2.45, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p5Points = [
      '• Book a slot immediately without making an account first.',
      '• Purpose: Instant confirmation with automated slot locking.'
    ];
    slide.addText(p5Points.join('\n\n'), {
      x: 3.75, y: 3.88, w: 2.45, h: 1.1,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Page 6: Workspace (Right Card)
    const wsScreenshot = path.join(userUploaded, 'media_1795198384113_9d8425b5.jpg');
    addCard(slide, 6.6, 1.45, 2.8, 3.7, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 6.75, y: 1.6, w: 1.7, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentBlue, width: 1 }, rectRadius: 0.11
    });
    slide.addText('PAGE 6: WORKSPACE HUB', {
      x: 6.75, y: 1.6, w: 1.7, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentBlue, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(wsScreenshot)) {
      slide.addImage({
        path: wsScreenshot,
        x: 6.75, y: 1.9, w: 2.5, h: 1.6,
        rounding: true
      });
    }
    slide.addText('Portal Selection Door', {
      x: 6.75, y: 3.6, w: 2.5, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p6Points = [
      '• One simple screen to enter Patient, Doctor, or Admin portals.',
      '• Purpose: Bridges public website into secure workspaces.'
    ];
    slide.addText(p6Points.join('\n\n'), {
      x: 6.75, y: 3.88, w: 2.5, h: 1.1,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });
  }

  // =========================================================================
  // SLIDE 5 — THE WORKSPACE: ONE SYSTEM, THREE PORTALS
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Core Workspace', 'The Workspace: One System, Three Portals', 'One smart website that gives every user their own custom screen');

    // Real Workspace Screenshot (Left Large Frame)
    const wsScreenshot = path.join(userUploaded, 'media_1795198384113_9d8425b5.jpg');
    addCard(slide, 0.6, 1.45, 4.6, 3.7, C.bgCard, C.accentCyan, 0.1);
    if (fs.existsSync(wsScreenshot)) {
      slide.addImage({
        path: wsScreenshot,
        x: 0.75, y: 1.6, w: 4.3, h: 2.45,
        rounding: true
      });
    }
    // Statement Banner below screenshot
    addCard(slide, 0.75, 4.15, 4.3, 0.8, '071F3F', C.border, 0.08);
    slide.addText('"One Platform. Three Perspectives."', {
      x: 0.85, y: 4.25, w: 4.1, h: 0.25,
      fontSize: 12, fontFace: 'Arial', color: C.accentCyan, bold: true
    });
    slide.addText('Patients, doctors, and hospital managers all work smoothly in one shared, secure system.', {
      x: 0.85, y: 4.52, w: 4.1, h: 0.35,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 3 Role Cards with Simple Points
    // Role 1: Patient
    addCard(slide, 5.4, 1.45, 4.0, 1.15, C.bgCard, C.accentCyan, 0.1);
    slide.addText('1. PATIENT PORTAL', {
      x: 5.55, y: 1.55, w: 3.7, h: 0.22,
      fontSize: 10, fontFace: 'Arial', color: C.accentCyan, bold: true
    });
    const r1Points = [
      '• Track live queue token numbers and arrival times.',
      '• View digital QR gate pass and download doctor prescriptions.'
    ];
    slide.addText(r1Points.join('\n'), {
      x: 5.55, y: 1.8, w: 3.7, h: 0.7,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Role 2: Doctor
    addCard(slide, 5.4, 2.72, 4.0, 1.15, C.bgCard, C.accentTeal, 0.1);
    slide.addText('2. DOCTOR PORTAL', {
      x: 5.55, y: 2.82, w: 3.7, h: 0.22,
      fontSize: 10, fontFace: 'Arial', color: C.accentTeal, bold: true
    });
    const r2Points = [
      '• Automatic 30-minute queue timer and lobby speaker announcements.',
      '• Read quick AI patient summaries and create digital prescriptions.'
    ];
    slide.addText(r2Points.join('\n'), {
      x: 5.55, y: 3.07, w: 3.7, h: 0.7,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Role 3: Administrator
    addCard(slide, 5.4, 4.0, 4.0, 1.15, C.bgCard, C.accentBlue, 0.1);
    slide.addText('3. ADMINISTRATOR PORTAL', {
      x: 5.55, y: 4.1, w: 3.7, h: 0.22,
      fontSize: 10, fontFace: 'Arial', color: C.accentBlue, bold: true
    });
    const r3Points = [
      '• Verify and approve new doctor license applications.',
      '• Monitor all hospital appointments and clinic rooms in real time.'
    ];
    slide.addText(r3Points.join('\n'), {
      x: 5.55, y: 4.35, w: 3.7, h: 0.7,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });
  }

  // =========================================================================
  // SLIDE 6 — PATIENT REGISTRATION
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Patient Onboarding', 'Patient Registration: Fast & Simple Sign-Up', 'Takes essential patient details online to remove hospital paper forms');

    // Real Patient Registration Screenshot
    const patientRegPath = path.join(userUploaded, 'media_1795250252626_7eb8f4e0.jpg');
    addCard(slide, 0.6, 1.45, 5.2, 3.7, C.bgCard, C.accentCyan, 0.1);
    if (fs.existsSync(patientRegPath)) {
      slide.addImage({
        path: patientRegPath,
        x: 0.75, y: 1.6, w: 4.9, h: 2.3,
        rounding: true
      });
    }
    // Simple text below screenshot
    slide.addText('ACTUAL PATIENT SIGN-UP FORM: Patients fill this once from home. No paper forms or waiting in reception lines.', {
      x: 0.75, y: 4.0, w: 4.9, h: 0.95,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 4 Visual Form Callouts with Simple English
    const callouts = [
      { title: 'Personal Information', desc: 'Collects legal name, age, gender, and blood group.' },
      { title: 'Contact Numbers', desc: 'Saves mobile phone and email for automated SMS alerts.' },
      { title: 'Secure Password', desc: 'Creates a private account protected by encrypted login.' },
      { title: 'Instant Portal Access', desc: 'Takes patient straight to their live personal dashboard.' },
    ];

    callouts.forEach((c, idx) => {
      const cy = 1.45 + idx * 0.93;
      addCard(slide, 6.0, cy, 3.4, 0.85, C.bgCard, C.border, 0.08);
      slide.addText(`${idx + 1}. ${c.title.toUpperCase()}`, {
        x: 6.15, y: cy + 0.1, w: 3.1, h: 0.2,
        fontSize: 9, fontFace: 'Arial', color: C.accentCyan, bold: true
      });
      slide.addText(c.desc, {
        x: 6.15, y: cy + 0.32, w: 3.1, h: 0.48,
        fontSize: 8, fontFace: 'Arial', color: C.textMuted
      });
    });
  }

  // =========================================================================
  // SLIDE 7 — DOCTOR REGISTRATION
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Doctor Onboarding', 'Doctor Registration: Verified Medical Sign-Up', 'Careful onboarding to ensure only certified doctors practice on MEDIVANCE');

    // Real Doctor Registration Screenshot
    const docRegPath = path.join(userUploaded, 'media_1795183281715_e918bdf6.jpg');
    addCard(slide, 0.6, 1.45, 5.2, 3.7, C.bgCard, C.accentTeal, 0.1);
    if (fs.existsSync(docRegPath)) {
      slide.addImage({
        path: docRegPath,
        x: 0.75, y: 1.6, w: 4.9, h: 2.3,
        rounding: true
      });
    }
    // Simple text below screenshot
    slide.addText('ACTUAL DOCTOR ONBOARDING FORM: Collects official medical credentials before the doctor can see hospital patients.', {
      x: 0.75, y: 4.0, w: 4.9, h: 0.95,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 4 Clinical Verification Callouts with Simple English
    const docCallouts = [
      { title: 'Medical License Number', desc: 'Records government medical council license for official verification.' },
      { title: 'Specialty & Department', desc: 'Assigns doctor to Cardiology, Neurology, Child care, etc.' },
      { title: 'Clinic Room & Fees', desc: 'Sets room number, daily consultation hours, and fee amount.' },
      { title: 'Admin Approval Step', desc: 'Account stays locked until hospital admin checks credentials.' },
    ];

    docCallouts.forEach((c, idx) => {
      const cy = 1.45 + idx * 0.93;
      addCard(slide, 6.0, cy, 3.4, 0.85, C.bgCard, C.border, 0.08);
      slide.addText(`${idx + 1}. ${c.title.toUpperCase()}`, {
        x: 6.15, y: cy + 0.1, w: 3.1, h: 0.2,
        fontSize: 9, fontFace: 'Arial', color: C.accentTeal, bold: true
      });
      slide.addText(c.desc, {
        x: 6.15, y: cy + 0.32, w: 3.1, h: 0.48,
        fontSize: 8, fontFace: 'Arial', color: C.textMuted
      });
    });
  }

  // =========================================================================
  // SLIDE 8 — PATIENT PORTAL
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Patient Portal', 'Patient Portal: Live Queue & Digital Gate Pass', 'Patients can track their visit, see live wait time, and enter with a phone QR pass');

    // Left: Real Patient Dashboard Screenshot
    const pDashPath = path.join(userUploaded, 'media_1795288114663_f25209d1.jpg');
    addCard(slide, 0.6, 1.45, 4.4, 3.7, C.bgCard, C.accentCyan, 0.1);
    if (fs.existsSync(pDashPath)) {
      slide.addImage({
        path: pDashPath,
        x: 0.75, y: 1.6, w: 4.1, h: 2.1,
        rounding: true
      });
    }
    const pDashPoints = [
      '• Shows your current token number and doctor status.',
      '• Updates live without needing to refresh the page.'
    ];
    slide.addText(pDashPoints.join('\n\n'), {
      x: 0.75, y: 3.8, w: 4.1, h: 1.2,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right: Authentic Digital Gate Pass Screenshot featuring Esha Kewalramani
    const gatePassPath = path.join(userUploaded, 'media_1795345642805_8e5f038d.png');
    addCard(slide, 5.2, 1.45, 4.2, 3.7, C.bgCard, C.accentTeal, 0.1);
    if (fs.existsSync(gatePassPath)) {
      slide.addImage({
        path: gatePassPath,
        x: 5.35, y: 1.55, w: 1.85, h: 2.45,
        rounding: true
      });
    }
    // Details next to Gate Pass
    slide.addText('REAL DIGITAL GATE PASS', {
      x: 7.3, y: 1.6, w: 2.0, h: 0.3,
      fontSize: 9.5, fontFace: 'Arial', color: C.accentCyan, bold: true
    });
    slide.addText('• Token Number: #15\n• Patient: Esha Kewalramani\n• Doctor: Dr. Sara Ahmed\n• Room: 102 (Heart Wing)\n• Status: SEATED IN LOBBY\n• Tap QR to simulate entry scan', {
      x: 7.3, y: 1.95, w: 2.0, h: 1.5,
      fontSize: 8, fontFace: 'Arial', color: C.textWhite
    });
    const gateSummary = [
      'Key Benefits for Patients:',
      '• No waiting in front-desk queues.',
      '• Scan QR at the door to check in instantly.',
      '• Get SMS notifications 1 hour before appointment.'
    ];
    slide.addText(gateSummary.join('\n'), {
      x: 5.35, y: 4.1, w: 3.9, h: 0.95,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });
  }

  // =========================================================================
  // SLIDE 9 — DOCTOR PORTAL
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Doctor Portal', 'Doctor Portal: Queue Auto-Pilot & E-Prescriptions', 'Tools for doctors to manage appointments smoothly and write clear prescriptions');

    // Doctor Queue Controller Screenshot (Top Left)
    const docQueuePath = path.join(userUploaded, 'media_1795288044371_6db2b6c2.jpg');
    addCard(slide, 0.6, 1.45, 5.0, 1.8, C.bgCard, C.accentTeal, 0.1);
    slide.addText('LIVE QUEUE CONTROLLER SCREEN', {
      x: 0.75, y: 1.55, w: 3.5, h: 0.2,
      fontSize: 8.5, fontFace: 'Arial', color: C.accentTeal, bold: true
    });
    if (fs.existsSync(docQueuePath)) {
      slide.addImage({
        path: docQueuePath,
        x: 0.75, y: 1.8, w: 4.7, h: 1.35,
        rounding: true
      });
    }

    // Smart Digital Prescription Screenshot (Bottom Left)
    const rxPath = path.join(userUploaded, 'media_1795289129972_3aad7f5a.png');
    addCard(slide, 0.6, 3.35, 5.0, 1.8, C.bgCard, C.accentCyan, 0.1);
    slide.addText('OFFICIAL DIGITAL PRESCRIPTION SLIP', {
      x: 0.75, y: 3.45, w: 3.8, h: 0.2,
      fontSize: 8.5, fontFace: 'Arial', color: C.accentCyan, bold: true
    });
    if (fs.existsSync(rxPath)) {
      slide.addImage({
        path: rxPath,
        x: 0.75, y: 3.7, w: 2.1, h: 1.35,
        rounding: true
      });
    }
    const rxText = [
      '• Generates clear medicine names and dosages.',
      '• Includes doctor signature and secure QR code.',
      '• Pharmacies can scan QR to confirm original prescription.'
    ];
    slide.addText(rxText.join('\n\n'), {
      x: 2.95, y: 3.75, w: 2.5, h: 1.25,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 4 Clinical Features in Simple English
    const docFeatures = [
      { title: 'Auto-Pilot Queue Timer', desc: 'Paces 30-minute consultations and automatically skips missed or expired slots.' },
      { title: 'Lobby Voice Speaker', desc: 'Speaks patient token number and room number over hospital speakers.' },
      { title: 'AI Patient Summary', desc: 'Shows a quick 1-click summary of patient symptoms before they walk in.' },
      { title: 'Safety Protection', desc: 'Asks doctor before closing visits to prevent accidental patient removal.' },
    ];

    docFeatures.forEach((f, idx) => {
      const fy = 1.45 + idx * 0.93;
      addCard(slide, 5.8, fy, 3.6, 0.85, C.bgCard, C.border, 0.08);
      slide.addText(f.title.toUpperCase(), {
        x: 5.95, y: fy + 0.1, w: 3.3, h: 0.2,
        fontSize: 8.5, fontFace: 'Arial', color: C.accentCyan, bold: true
      });
      slide.addText(f.desc, {
        x: 5.95, y: fy + 0.32, w: 3.3, h: 0.48,
        fontSize: 8, fontFace: 'Arial', color: C.textMuted
      });
    });
  }

  // =========================================================================
  // SLIDE 10 — ADMIN PORTAL
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Admin Portal', 'Admin Portal: Hospital Management & Approvals', 'Hospital administrators control doctor approvals, appointments, and daily reports');

    // Admin Dashboard Screenshot (Left Frame)
    const adminDashPath = path.join(userUploaded, 'media_1795266161296_d019b5b9.png');
    addCard(slide, 0.6, 1.45, 5.2, 3.7, C.bgCard, C.accentBlue, 0.1);
    slide.addText('HOSPITAL MANAGEMENT DASHBOARD', {
      x: 0.75, y: 1.55, w: 4.5, h: 0.2,
      fontSize: 8.5, fontFace: 'Arial', color: C.accentBlue, bold: true
    });
    if (fs.existsSync(adminDashPath)) {
      slide.addImage({
        path: adminDashPath,
        x: 0.75, y: 1.8, w: 4.9, h: 1.6,
        rounding: true
      });
    }
    // Supporting Admin Snapshot
    const adminSubPath = path.join(userUploaded, 'media_1794999397981_a2cab0f1.png');
    if (fs.existsSync(adminSubPath)) {
      slide.addImage({
        path: adminSubPath,
        x: 0.75, y: 3.5, w: 2.2, h: 1.45,
        rounding: true
      });
    }
    const adminSubText = [
      '• Gives hospital managers total visibility.',
      '• Ensures all doctors are verified before seeing patients.'
    ];
    slide.addText(adminSubText.join('\n\n'), {
      x: 3.1, y: 3.65, w: 2.5, h: 1.2,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 4 Governance Responsibilities in Simple English
    const adminRoles = [
      { title: 'Doctor Approvals', desc: 'Reviews doctor applications and activates verified doctors with 1 click.' },
      { title: 'Hospital Schedule Oversight', desc: 'Watches all active appointments across all departments in real time.' },
      { title: 'Daily Patient Reports', desc: 'Checks patient count, average wait times, and clinic room activity.' },
      { title: 'System Security', desc: 'Protects patient privacy and manages hospital account permissions.' },
    ];

    adminRoles.forEach((r, idx) => {
      const ry = 1.45 + idx * 0.93;
      addCard(slide, 6.0, ry, 3.4, 0.85, C.bgCard, C.border, 0.08);
      slide.addText(r.title.toUpperCase(), {
        x: 6.15, y: ry + 0.1, w: 3.1, h: 0.2,
        fontSize: 8.5, fontFace: 'Arial', color: C.accentBlue, bold: true
      });
      slide.addText(r.desc, {
        x: 6.15, y: ry + 0.32, w: 3.1, h: 0.48,
        fontSize: 8, fontFace: 'Arial', color: C.textMuted
      });
    });
  }

  // =========================================================================
  // SLIDE 11 — CORE MODULES OF MEDIVANCE
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Main Modules', 'Core Modules of MEDIVANCE', 'Nine working features that power the complete healthcare experience');

    const modules = [
      { title: 'User Login & Safety', cat: 'SECURITY', desc: 'Separate, safe portals for patients, doctors, and hospital administration.' },
      { title: 'Doctor Finder', cat: 'DISCOVERY', desc: 'Search specialist doctors easily by medical field, fee, and room number.' },
      { title: 'Fast Online Booking', cat: 'BOOKING', desc: 'Book open calendar slots with instant confirmation and no waiting.' },
      { title: 'Digital Gate Pass', cat: 'ARRIVAL', desc: 'Scan phone QR code at turnstile gates to skip reception desk lines.' },
      { title: 'Queue Auto-Pilot', cat: 'QUEUE', desc: '30-minute consultation timer that automatically advances waiting tokens.' },
      { title: 'Lobby Voice Speaker', cat: 'VOICE', desc: 'Speaks patient names and clinic room numbers over hospital speakers.' },
      { title: 'AI Patient Summary', cat: 'AI HELPER', desc: 'Summarizes patient symptoms to help doctors prepare before consultations.' },
      { title: 'Digital Prescription', cat: 'PHARMACY', desc: 'Clear medicine slips with scannable QR codes for easy pharmacy verification.' },
      { title: 'SMS & Email Alerts', cat: 'REMINDERS', desc: 'Sends automatic appointment reminder messages straight to patient phones.' },
    ];

    modules.forEach((m, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const mx = 0.6 + col * 3.0;
      const my = 1.45 + row * 1.25;

      addCard(slide, mx, my, 2.8, 1.15, C.bgCard, C.border, 0.08);

      // Category Pill
      slide.addShape(pres.ShapeType.rect, {
        x: mx + 0.12, y: my + 0.1, w: 0.95, h: 0.18,
        fill: { color: '0A294A' }, line: { color: C.accentCyan, width: 0.8 }, rectRadius: 0.09
      });
      slide.addText(m.cat, {
        x: mx + 0.12, y: my + 0.1, w: 0.95, h: 0.18,
        fontSize: 6.5, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
      });

      // Module Title
      slide.addText(m.title, {
        x: mx + 1.12, y: my + 0.08, w: 1.55, h: 0.22,
        fontSize: 8.5, fontFace: 'Arial', color: C.textWhite, bold: true
      });

      // Simple Description
      slide.addText(m.desc, {
        x: mx + 0.12, y: my + 0.35, w: 2.55, h: 0.72,
        fontSize: 7.8, fontFace: 'Arial', color: C.textMuted
      });
    });
  }

  // =========================================================================
  // SLIDE 12 — TECHNOLOGY STACK & KEY FEATURES
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Technology', 'Technology Stack & Engineering Highlights', 'Built with fast, modern web tools to guarantee zero crashes and quick performance');

    const stackCols = [
      {
        header: 'Frontend Website',
        color: C.accentCyan,
        techs: [
          '• Next.js 14 App Router: Fast and modern web framework.',
          '• React 18: Smooth, instant screen updates.',
          '• TypeScript: Safe code preventing software errors.',
          '• Tailwind CSS: Clean dark and light healthcare design.',
          '• Lucide Icons: Clear medical icons across all pages.'
        ]
      },
      {
        header: 'Cloud Database',
        color: C.accentTeal,
        techs: [
          '• Supabase PostgreSQL: Powerful cloud database.',
          '• Live WebSockets: Real-time updates without page refresh.',
          '• Row-Level Security: Keeps patient records private.',
          '• SQL Automation: Automatically approves paid bookings.',
          '• Secure Cloud Hosting: 24/7 reliability.'
        ]
      },
      {
        header: 'Smart Browser APIs',
        color: C.accentBlue,
        techs: [
          '• SpeechSynthesis API: Voice announcements in hospital lobby.',
          '• Web Audio API: Hospital chime sounds when calling patients.',
          '• Geolocation API: Verifies patient arrival near hospital.',
          '• QR Code Generator: Fast QR passes on mobile screens.',
          '• Fast & lightweight: Runs in any standard browser.'
        ]
      },
      {
        header: 'Zero-Crash Backup',
        color: C.accentGreen,
        techs: [
          '• Dual-Mode Architecture: Works online and offline.',
          '• LocalStorage Fallback: System stays working if Wi-Fi drops.',
          '• Presentation Ready: Guaranteed to run smoothly in live demos.',
          '• Simulated Payment: Clean demo of online checkout flow.',
          '• Safe, reliable, and tested.'
        ]
      }
    ];

    stackCols.forEach((col, idx) => {
      const cx = 0.6 + idx * 2.25;
      addCard(slide, cx, 1.45, 2.15, 3.6, C.bgCard, col.color, 0.1);

      // Card Header
      slide.addShape(pres.ShapeType.rect, {
        x: cx + 0.12, y: 1.6, w: 1.9, h: 0.28,
        fill: { color: '0A294A' }, line: { color: col.color, width: 1 }, rectRadius: 0.14
      });
      slide.addText(col.header.toUpperCase(), {
        x: cx + 0.12, y: 1.6, w: 1.9, h: 0.28,
        fontSize: 8, fontFace: 'Arial', color: col.color, bold: true, align: 'center', valign: 'middle'
      });

      // Bullets in Simple English
      slide.addText(col.techs.join('\n\n'), {
        x: cx + 0.12, y: 2.05, w: 1.9, h: 2.85,
        fontSize: 7.8, fontFace: 'Arial', color: C.textWhite
      });
    });
  }

  // =========================================================================
  // SLIDE 13 — ACTUAL SYSTEM ARCHITECTURE
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Architecture', 'System Architecture: How MEDIVANCE Works', 'Five simple layers connecting patients, doctors, and data in real time');

    const layers = [
      { num: 'TIER 1', name: 'USER LAYER', color: C.accentCyan, desc: 'Patients (on phones)  |  Doctors (on clinic screens)  |  Hospital Admin (on computers)' },
      { num: 'TIER 2', name: 'WEBSITE & LOGIN', color: C.accentTeal, desc: 'Next.js 14 web pages with automatic role verification checking patient vs doctor login' },
      { num: 'TIER 3', name: 'SMART SERVICES', color: C.accentBlue, desc: '30-minute queue timer, lobby voice announcements, AI patient notes, and digital prescriptions' },
      { num: 'TIER 4', name: 'LIVE DATABASE', color: C.accentGreen, desc: 'Supabase PostgreSQL updating waiting tokens and appointments in real time without refreshing' },
      { num: 'TIER 5', name: 'SAFETY & BACKUP', color: C.accentAmber, desc: 'Private data protection, encrypted passwords, and offline backup mode for zero-crash demos' },
    ];

    layers.forEach((l, idx) => {
      const ly = 1.45 + idx * 0.68;
      addCard(slide, 0.6, ly, 8.8, 0.58, C.bgCard, l.color, 0.08);

      // Tier Badge
      slide.addShape(pres.ShapeType.rect, {
        x: 0.75, y: ly + 0.12, w: 0.85, h: 0.32,
        fill: { color: '0A294A' }, line: { color: l.color, width: 1 }, rectRadius: 0.06
      });
      slide.addText(l.num, {
        x: 0.75, y: ly + 0.12, w: 0.85, h: 0.32,
        fontSize: 7.5, fontFace: 'Arial', color: l.color, bold: true, align: 'center', valign: 'middle'
      });

      // Tier Title
      slide.addText(l.name, {
        x: 1.75, y: ly + 0.14, w: 2.2, h: 0.3,
        fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
      });

      // Simple Description
      slide.addText(l.desc, {
        x: 4.1, y: ly + 0.14, w: 5.1, h: 0.3,
        fontSize: 8, fontFace: 'Arial', color: C.textMuted
      });
    });

    // Concluding Statement Banner
    addCard(slide, 0.6, 4.92, 8.8, 0.38, '071F3F', C.accentCyan, 0.08);
    slide.addText('MEDIVANCE — Simple, fast, and modern healthcare for everyone.', {
      x: 0.6, y: 4.92, w: 8.8, h: 0.38,
      fontSize: 11, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
    });
  }

  // Write base PPTX
  const rawBuffer = await pres.write({ outputType: 'nodebuffer' });

  // Post-Process with JSZip to inject native PowerPoint Transitions & Timings
  const zip = await JSZip.loadAsync(rawBuffer);

  const transitionTypes = [
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',      // S1: Fade intro
    '<p:transition spd="med" advClick="1"><p:push dir="r"/></p:transition>',// S2: Push right
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',// S3: Wipe right
    '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>',// S4: Push left
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',      // S5: Fade
    '<p:transition spd="med" advClick="1"><p:wipe dir="d"/></p:transition>',// S6: Wipe down
    '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>',// S7: Push left
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',      // S8: Fade
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',// S9: Wipe right
    '<p:transition spd="med" advClick="1"><p:push dir="r"/></p:transition>',// S10: Push right
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',      // S11: Fade
    '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>',// S12: Push left
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',      // S13: Fade out
  ];

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

    xml = xml.replace('</p:clrMapOvr>', `</p:clrMapOvr>${trans}${timingXml}`);
    zip.file(slideName, xml);

    slideIndex++;
  }

  const finalBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  // Output paths
  const outputPath = path.resolve('MEDIVANCE_Master_Presentation.pptx');
  fs.writeFileSync(outputPath, finalBuffer);

  const artifactPath = path.resolve('C:/Users/Esha/.gemini/antigravity/brain/dbe57032-cfdd-47d0-8f7b-09f28aeb13e4/MEDIVANCE_Master_Presentation.pptx');
  fs.writeFileSync(artifactPath, finalBuffer);

  console.log(`Master Presentation generated successfully with ${slideIndex} visual slides!`);
  console.log(`Saved to: ${outputPath}`);
  console.log(`Artifact saved to: ${artifactPath}`);
}

createMaster13Presentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
