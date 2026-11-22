const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');

async function createMaster13Presentation() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pres.title = 'MEDIVANCE — AI-Powered Doctor Appointment System';
  pres.company = 'MEDIVANCE Healthcare Systems';

  const userUploaded = 'C:/Users/Esha/.gemini/antigravity/brain/dbe57032-cfdd-47d0-8f7b-09f28aeb13e4/.user_uploaded';

  // Palette: Dark & Light theme harmony
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

  // Helper: Header for slides 2-13
  function setupSlideHeader(slide, category, title, subtitle) {
    slide.background = { color: C.bgDark };

    // Category Pill
    const pillW = Math.max(1.4, category.length * 0.10 + 0.35);
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

    // Subtitle (One simple line)
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
    slide.addText('MEDIVANCE  |  AI-Powered Doctor Appointment System  |  Presenter: Esha Kewalramani', {
      x: 0.6,
      y: 5.3,
      w: 8.8,
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
  // SLIDE 1 — INTRODUCTION TO MEDIVANCE
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

    // Badge
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6, y: 1.3, w: 3.1, h: 0.28,
      fill: { color: '092B4F' },
      line: { color: C.accentCyan, width: 1 },
      rectRadius: 0.14
    });
    slide.addText('AI-POWERED HEALTHCARE SYSTEM', {
      x: 0.6, y: 1.3, w: 3.1, h: 0.28,
      fontSize: 8, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
    });

    // Title & Simple Subtitle
    slide.addText('MEDIVANCE', {
      x: 0.6, y: 1.7, w: 4.4, h: 0.55,
      fontSize: 28, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    slide.addText('AI-Powered Doctor Appointment System', {
      x: 0.6, y: 2.25, w: 4.4, h: 0.35,
      fontSize: 13.5, fontFace: 'Arial', color: C.accentBlue, bold: true
    });

    // Purpose summary points
    const introPoints = [
      '• A modern web system that makes doctor appointments fast, simple, and paperless.',
      '• Connects patients, doctors, and hospital administration in one unified platform.',
      '• Features instant online booking, live queue tracking, and digital gate passes.',
      '• Built-in AURA AI assistant helps guide patients to the right medical department.'
    ];
    slide.addText(introPoints.join('\n\n'), {
      x: 0.6, y: 2.7, w: 4.3, h: 1.3,
      fontSize: 8.8, fontFace: 'Arial', color: C.textMuted
    });

    // Presenter Info Card
    addCard(slide, 0.6, 4.15, 4.3, 0.9, '071A35', C.accentTeal, 0.1);
    slide.addText('PRESENTER', {
      x: 0.8, y: 4.25, w: 3.9, h: 0.18,
      fontSize: 8, fontFace: 'Arial', color: C.accentCyan, bold: true
    });
    slide.addText('Esha Kewalramani', {
      x: 0.8, y: 4.45, w: 3.9, h: 0.3,
      fontSize: 14, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    slide.addText('Project Lead & Full-Stack Developer', {
      x: 0.8, y: 4.75, w: 3.9, h: 0.2,
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
      // Label below hero
      slide.addText('ACTUAL WEBSITE HOMEPAGE', {
        x: 5.5, y: 4.15, w: 3.8, h: 0.22,
        fontSize: 9, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center'
      });
      slide.addText('Live production view of the MEDIVANCE public portal', {
        x: 5.5, y: 4.4, w: 3.8, h: 0.22,
        fontSize: 8, fontFace: 'Arial', color: C.textMuted, align: 'center'
      });
    }
  }

  // =========================================================================
  // SLIDE 2 — SPLASH SCREEN EXPERIENCE
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Splash Screens', 'Splash Screen Experience', 'Two welcoming screens that introduce the MEDIVANCE brand and vision');

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
      '• Displays the official MEDIVANCE emblem and typography.',
      '• Builds instant brand recognition, warmth, and institutional trust.'
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
      '• Welcomes patients into an intelligent, paperless clinical journey.',
      '• Introduces our core promise: zero waiting rooms and dignified care.'
    ];
    slide.addText(s2Points.join('\n'), {
      x: 5.35, y: 4.35, w: 3.85, h: 0.65,
      fontSize: 8.5, fontFace: 'Arial', color: C.textWhite
    });
  }

  // =========================================================================
  // SLIDE 3 — EXPLORE MEDIVANCE: PUBLIC PAGES I
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Public Website', 'Explore MEDIVANCE: Public Pages I', 'Three essential public pages for orientation, hospital values, and doctor discovery');

    // Page 1: Home Page (Hero Left Gallery)
    const homeScreenshot = path.join(userUploaded, 'media_1795251666647_6d41677b.jpg');
    addCard(slide, 0.6, 1.4, 4.2, 3.75, C.bgCard, C.accentCyan, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.55, w: 1.7, h: 0.24,
      fill: { color: '082545' }, line: { color: C.accentCyan, width: 1 }, rectRadius: 0.12
    });
    slide.addText('1. HOME PAGE (/)', {
      x: 0.8, y: 1.55, w: 1.7, h: 0.24,
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
      '• Features 24/7 emergency dispatch, doctor search, and Book Now CTA.',
      '• Purpose: Welcomes users and immediately guides them to the right care.'
    ];
    slide.addText(p1Points.join('\n'), {
      x: 0.8, y: 4.32, w: 3.8, h: 0.7,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Page 2: About Page (/about) (Top Right)
    const aboutScreenshot = path.resolve('public/images/promo-care.jpg');
    addCard(slide, 5.0, 1.4, 4.4, 1.8, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 5.15, y: 1.52, w: 1.9, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentTeal, width: 1 }, rectRadius: 0.11
    });
    slide.addText('2. ABOUT PAGE (/about)', {
      x: 5.15, y: 1.52, w: 1.9, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentTeal, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(aboutScreenshot)) {
      slide.addImage({
        path: aboutScreenshot,
        x: 5.15, y: 1.82, w: 2.1, h: 1.25,
        rounding: true
      });
    }
    slide.addText('Hospital Mission & Clinical Care', {
      x: 7.35, y: 1.7, w: 1.95, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p2Points = [
      '• Explains medical ethics, specialized care wings, and hospital standards.',
      '• Purpose: Builds trust with patients and their families.'
    ];
    slide.addText(p2Points.join('\n\n'), {
      x: 7.35, y: 1.98, w: 1.95, h: 1.05,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Page 3: Doctors Page (/doctors) (Bottom Right)
    const doctorScreenshot = path.join(userUploaded, 'media_1795033998338_c2e1fc3a.jpg');
    addCard(slide, 5.0, 3.35, 4.4, 1.8, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 5.15, y: 3.47, w: 2.1, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentBlue, width: 1 }, rectRadius: 0.11
    });
    slide.addText('3. DOCTORS PAGE (/doctors)', {
      x: 5.15, y: 3.47, w: 2.1, h: 0.22,
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
      '• Search and filter doctors by medical department, fee, and available hours.',
      '• Purpose: Empowers patients to select the right specialist with one click.'
    ];
    slide.addText(p3Points.join('\n\n'), {
      x: 7.35, y: 3.92, w: 1.95, h: 1.1,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });
  }

  // =========================================================================
  // SLIDE 4 — EXPLORE MEDIVANCE: PUBLIC PAGES II
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Public Website', 'Explore MEDIVANCE: Public Pages II', 'Live Location, 15 Hospital Facilities Gallery, and Direct Appointment Booking');

    // Page 4: Live Location Page (/location) (Left Card)
    const locScreenshot = path.resolve('public/images/live-location-hero.jpg');
    addCard(slide, 0.6, 1.45, 2.75, 3.7, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 0.75, y: 1.6, w: 2.2, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentTeal, width: 1 }, rectRadius: 0.11
    });
    slide.addText('LIVE LOCATION (/location)', {
      x: 0.75, y: 1.6, w: 2.2, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentTeal, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(locScreenshot)) {
      slide.addImage({
        path: locScreenshot,
        x: 0.75, y: 1.9, w: 2.45, h: 1.6,
        rounding: true
      });
    }
    slide.addText('Explore Nearby Facilities', {
      x: 0.75, y: 3.6, w: 2.45, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p4Points = [
      '• Interactive campus maps, wing directions, and nearby pharmacy locations.',
      '• Helps arriving patients find their exact clinic room without getting lost.'
    ];
    slide.addText(p4Points.join('\n\n'), {
      x: 0.75, y: 3.88, w: 2.45, h: 1.1,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Page 5: Inside Page (/inside) (Center Card)
    const insideScreenshot = path.join(userUploaded, 'media_1795176783401_66e1616b.jpg');
    addCard(slide, 3.6, 1.45, 2.75, 3.7, C.bgCard, C.accentCyan, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 3.75, y: 1.6, w: 2.2, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentCyan, width: 1 }, rectRadius: 0.11
    });
    slide.addText('INSIDE HOSPITAL (/inside)', {
      x: 3.75, y: 1.6, w: 2.2, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(insideScreenshot)) {
      slide.addImage({
        path: insideScreenshot,
        x: 3.75, y: 1.9, w: 2.45, h: 1.6,
        rounding: true
      });
    }
    slide.addText('15 Hospital Facilities Gallery', {
      x: 3.75, y: 3.6, w: 2.45, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p5Points = [
      '• Showcases 15 spaces: Reception, ICU, Operating Theatre, Garden, and Labs.',
      '• Provides visual reassurance of world-class medical infrastructure.'
    ];
    slide.addText(p5Points.join('\n\n'), {
      x: 3.75, y: 3.88, w: 2.45, h: 1.1,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Page 6: Book Now (/book) (Right Card)
    const bookScreenshot = path.join(userUploaded, 'media_1795113304445_c24373ce.jpg');
    addCard(slide, 6.6, 1.45, 2.8, 3.7, C.bgCard, C.border, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 6.75, y: 1.6, w: 2.1, h: 0.22,
      fill: { color: '082545' }, line: { color: C.accentBlue, width: 1 }, rectRadius: 0.11
    });
    slide.addText('BOOK NOW (/book)', {
      x: 6.75, y: 1.6, w: 2.1, h: 0.22,
      fontSize: 7.5, fontFace: 'Arial', color: C.accentBlue, bold: true, align: 'center', valign: 'middle'
    });
    if (fs.existsSync(bookScreenshot)) {
      slide.addImage({
        path: bookScreenshot,
        x: 6.75, y: 1.9, w: 2.5, h: 1.6,
        rounding: true
      });
    }
    slide.addText('Direct Appointment Booking', {
      x: 6.75, y: 3.6, w: 2.5, h: 0.22,
      fontSize: 9.5, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    const p6Points = [
      '• Direct booking without mandatory upfront registration.',
      '• Home Page "Book Now" CTA locks calendar time slots instantly.'
    ];
    slide.addText(p6Points.join('\n\n'), {
      x: 6.75, y: 3.88, w: 2.5, h: 1.1,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });
  }

  // =========================================================================
  // SLIDE 5 — WORKSPACE AND THREE PORTALS
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Workspace & Roles', 'Workspace and Three Portals', 'Central role selector providing dedicated workspaces for Patients, Doctors, and Administrators');

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
    slide.addText('Secure role-partitioned portals tailored specifically for each participant in the healthcare journey.', {
      x: 0.85, y: 4.52, w: 4.1, h: 0.35,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 3 Role Cards with Simple Descriptions
    // Role 1: Patient Portal
    addCard(slide, 5.4, 1.45, 4.0, 1.15, C.bgCard, C.accentCyan, 0.1);
    slide.addText('PATIENT PORTAL', {
      x: 5.55, y: 1.55, w: 3.7, h: 0.22,
      fontSize: 10, fontFace: 'Arial', color: C.accentCyan, bold: true
    });
    slide.addText('Manage appointments and healthcare information.', {
      x: 5.55, y: 1.8, w: 3.7, h: 0.22,
      fontSize: 9, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    slide.addText('Live queue tracking, digital gate pass, appointment history, and downloadable prescriptions.', {
      x: 5.55, y: 2.05, w: 3.7, h: 0.45,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Role 2: Doctor Portal
    addCard(slide, 5.4, 2.72, 4.0, 1.15, C.bgCard, C.accentTeal, 0.1);
    slide.addText('DOCTOR PORTAL', {
      x: 5.55, y: 2.82, w: 3.7, h: 0.22,
      fontSize: 10, fontFace: 'Arial', color: C.accentTeal, bold: true
    });
    slide.addText('Manage appointments, availability and patient records.', {
      x: 5.55, y: 3.07, w: 3.7, h: 0.22,
      fontSize: 9, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    slide.addText('Hands-free 30-min auto-pilot, lobby voice announcements, AI SOAP notes, and smart e-Rx authoring.', {
      x: 5.55, y: 3.32, w: 3.7, h: 0.45,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Role 3: Admin Portal
    addCard(slide, 5.4, 4.0, 4.0, 1.15, C.bgCard, C.accentBlue, 0.1);
    slide.addText('ADMIN PORTAL', {
      x: 5.55, y: 4.1, w: 3.7, h: 0.22,
      fontSize: 10, fontFace: 'Arial', color: C.accentBlue, bold: true
    });
    slide.addText('Manage doctors, patients, appointments and system settings.', {
      x: 5.55, y: 4.35, w: 3.7, h: 0.22,
      fontSize: 9, fontFace: 'Arial', color: C.textWhite, bold: true
    });
    slide.addText('Doctor approval and vetting workflow, hospital-wide queue monitoring, analytics, and CSV exports.', {
      x: 5.55, y: 4.6, w: 3.7, h: 0.45,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });
  }

  // =========================================================================
  // SLIDE 6 — PATIENT REGISTRATION
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Patient Onboarding', 'Patient Registration', 'Online registration form capturing essential details for seamless access to the Patient Portal');

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
    slide.addText('ACTUAL PATIENT REGISTRATION INTERFACE: Filled once from home. Replaces physical clipboards and front-desk paperwork.', {
      x: 0.75, y: 4.0, w: 4.9, h: 0.95,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 4 Visual Form Callouts
    const callouts = [
      { title: 'Personal Information', desc: 'Captures legal full name, date of birth, gender, and blood group.' },
      { title: 'Contact Details', desc: 'Stores mobile phone and email to dispatch automated SMS visit reminders.' },
      { title: 'Account Security', desc: 'Creates a private account protected by encrypted login credentials.' },
      { title: 'Instant Portal Access', desc: 'Immediately activates account and redirects patient to personal dashboard.' },
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
    setupSlideHeader(slide, 'Doctor Onboarding', 'Doctor Registration', 'Verified clinical onboarding workflow with mandatory administrative approval gate');

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
    slide.addText('ACTUAL DOCTOR ONBOARDING INTERFACE: Doctors provide qualifications and license numbers. Accounts stay pending until admin review.', {
      x: 0.75, y: 4.0, w: 4.9, h: 0.95,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 4 Clinical Verification Callouts
    const docCallouts = [
      { title: 'Medical License Number', desc: 'Records state medical council registration number for credential verification.' },
      { title: 'Specialization & Department', desc: 'Assigns doctor to Cardiology, Neurology, Pediatrics, Orthopedics, etc.' },
      { title: 'Clinic Room & Consultation Fees', desc: 'Defines room number, consultation fees, and available daily clinic hours.' },
      { title: 'Administrator Approval Gate', desc: 'New accounts remain pending until hospital admin verifies qualifications.' },
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
  // SLIDE 8 — PATIENT DASHBOARD
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Patient Portal', 'Patient Dashboard', 'Comprehensive personal health dashboard with live queue tracking and Digital Gate Pass');

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
    const pDashFeatures = [
      '• Health Summary: Current queue token & live appointment status.',
      '• Doctor Search: Browse verified specialists and book appointments.',
      '• My Appointments: View upcoming, completed, and rescheduled visits.',
      '• Video Consultation: Real browser camera preview interface.'
    ];
    slide.addText(pDashFeatures.join('\n'), {
      x: 0.75, y: 3.8, w: 4.1, h: 1.2,
      fontSize: 8, fontFace: 'Arial', color: C.textWhite
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
    slide.addText('DIGITAL GATE PASS & QR', {
      x: 7.3, y: 1.6, w: 2.0, h: 0.3,
      fontSize: 9.5, fontFace: 'Arial', color: C.accentCyan, bold: true
    });
    slide.addText('• Token Number: #15\n• Patient: Esha Kewalramani\n• Doctor: Dr. Sara Ahmed\n• Clinic: Room 102 - Heart Wing\n• Status: SEATED IN LOBBY\n• Tap QR to simulate gate scan', {
      x: 7.3, y: 1.95, w: 2.0, h: 1.5,
      fontSize: 8, fontFace: 'Arial', color: C.textWhite
    });
    const gateSummary = [
      'Additional Patient Features:',
      '• Payment receipt view for completed bookings.',
      '• Automated SMS/Email alerts dispatched 1h before visit.',
      '• In-dashboard AURA AI keyword assistant.'
    ];
    slide.addText(gateSummary.join('\n'), {
      x: 5.35, y: 4.1, w: 3.9, h: 0.95,
      fontSize: 8.5, fontFace: 'Arial', color: C.textMuted
    });
  }

  // =========================================================================
  // SLIDE 9 — DOCTOR DASHBOARD
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Doctor Portal', 'Doctor Dashboard', 'Clinical console for appointment control, queue auto-pilot, and digital prescriptions');

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
      '• Includes doctor signature and secure QR verification code.',
      '• External pharmacies can scan QR to confirm original record.'
    ];
    slide.addText(rxText.join('\n\n'), {
      x: 2.95, y: 3.75, w: 2.5, h: 1.25,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Right Side: 5 Core Doctor Capabilities
    const docFeatures = [
      { title: 'Appointment Management', desc: 'Accept, reject, or complete patient appointment requests with one click.' },
      { title: '30-Min Queue Auto-Pilot', desc: 'Real-clock consultation timer that paces patient visits and skips past slots.' },
      { title: 'Availability Management', desc: 'Set working hours, consultation days, and active clinic room availability.' },
      { title: 'Patient Records & AI SOAP', desc: 'Inspect quick clinical summaries (Subjective, Objective, Assessment, Plan).' },
      { title: 'Profile Management', desc: 'Update medical qualification details, fees, and clinical department tags.' },
    ];

    docFeatures.forEach((f, idx) => {
      const fy = 1.45 + idx * 0.74;
      addCard(slide, 5.8, fy, 3.6, 0.68, C.bgCard, C.border, 0.08);
      slide.addText(f.title.toUpperCase(), {
        x: 5.95, y: fy + 0.08, w: 3.3, h: 0.18,
        fontSize: 8.5, fontFace: 'Arial', color: C.accentCyan, bold: true
      });
      slide.addText(f.desc, {
        x: 5.95, y: fy + 0.28, w: 3.3, h: 0.38,
        fontSize: 7.8, fontFace: 'Arial', color: C.textMuted
      });
    });
  }

  // =========================================================================
  // SLIDE 10 — ADMIN DASHBOARD
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Admin Portal', 'Admin Dashboard', 'Central administration console for doctor vetting, appointment oversight, and system analytics');

    // Left Frame: Dashboard Statistics & Controls
    addCard(slide, 0.6, 1.45, 5.2, 3.7, C.bgCard, C.accentBlue, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 0.75, y: 1.55, w: 2.8, h: 0.24,
      fill: { color: '082545' }, line: { color: C.accentBlue, width: 1 }, rectRadius: 0.12
    });
    slide.addText('HOSPITAL MANAGEMENT CONSOLE', {
      x: 0.75, y: 1.55, w: 2.8, h: 0.24,
      fontSize: 8, fontFace: 'Arial', color: C.accentBlue, bold: true, align: 'center', valign: 'middle'
    });

    // 4 Key Admin Function Cards on the Left
    const adminPillars = [
      { title: 'Dashboard Statistics', desc: 'Real-time counters for Total Patients, Verified Doctors, Total Appointments, Pending, and Completed.' },
      { title: 'Doctor Approvals & Vetting', desc: 'Reviews pending doctor applications, medical degrees, and room assignments before granting clinic access.' },
      { title: 'Hospital Queue & Floor Monitor', desc: 'Hospital-wide OPD monitor tracking waiting patients, active consultation rooms, and lobby status.' },
      { title: 'Reports, Analytics & CSV Export', desc: 'Visual Recharts analytics for appointment trends, specialty distribution, and 1-click CSV data export.' },
    ];

    adminPillars.forEach((p, idx) => {
      const py = 1.9 + idx * 0.78;
      addCard(slide, 0.75, py, 4.9, 0.72, '071A35', C.border, 0.08);
      slide.addText(`${idx + 1}. ${p.title.toUpperCase()}`, {
        x: 0.9, y: py + 0.1, w: 4.6, h: 0.2,
        fontSize: 8.5, fontFace: 'Arial', color: C.accentBlue, bold: true
      });
      slide.addText(p.desc, {
        x: 0.9, y: py + 0.32, w: 4.6, h: 0.35,
        fontSize: 7.8, fontFace: 'Arial', color: C.textMuted
      });
    });

    // Right Side: 4 Governance Responsibilities
    const adminRoles = [
      { title: 'Doctor & Patient Management', desc: 'Inspect full registries of registered patients and clinical specialists with search and filters.' },
      { title: 'Specializations Management', desc: 'Add, edit, or configure hospital medical departments (Cardiology, Neurology, Pediatrics, etc.).' },
      { title: 'Appointment Oversight', desc: 'Supervise scheduled, waiting, completed, and cancelled visits hospital-wide in real time.' },
      { title: 'System Settings & Security', desc: 'Configure hospital operating parameters, audit logs, and enforce strict Row-Level Security.' },
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
  // SLIDE 11 — CORE MODULES
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'Main Modules', 'Core Modules of MEDIVANCE', 'Ten verified functional modules powering the complete outpatient experience');

    const modules = [
      { title: 'Appointment Management', cat: 'BOOKING', desc: 'Direct online booking, automated slot confirmation, and live queue token tracking.' },
      { title: 'Doctor Management', cat: 'DOCTORS', desc: 'Specialist discovery, department filtering, credentials vetting, and profile setup.' },
      { title: 'Patient Management', cat: 'PATIENTS', desc: 'Digital registration, medical history, appointment logs, and e-prescription archives.' },
      { title: 'Doctor Availability', cat: 'SCHEDULE', desc: 'OPD shifts, consultation days, daily token capacities, and room allocations.' },
      { title: 'Payment & Receipts', cat: 'BILLING', desc: 'Simulated checkout flow with instant booking verification and payment receipts.' },
      { title: 'Notifications Engine', cat: 'ALERTS', desc: 'Automated SMS, email reminders, and in-app alerts sent 24h & 1h prior to visits.' },
      { title: 'Live Location & Maps', cat: 'WAYFINDING', desc: 'Interactive campus floor directory, clinic wing navigation, and transit guides.' },
      { title: 'Emergency Assistance', cat: 'EMERGENCY', desc: 'One-touch 24/7 hotline, emergency ambulance dispatch, and nearby facilities.' },
      { title: 'Reports & Analytics', cat: 'ANALYTICS', desc: 'Recharts visual trends, hospital rush-hour metrics, and 1-click CSV data export.' },
      { title: 'In-Dashboard AURA AI', cat: 'AI ASSISTANT', desc: 'Rule-based keyword symptom guidance helping patients find the right department.' },
    ];

    // 10 modules: 5 columns x 2 rows
    modules.forEach((m, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      const mx = 0.6 + col * 1.8;
      const my = 1.45 + row * 1.85;

      addCard(slide, mx, my, 1.7, 1.75, C.bgCard, C.border, 0.08);

      // Category Pill
      slide.addShape(pres.ShapeType.rect, {
        x: mx + 0.1, y: my + 0.1, w: 1.0, h: 0.18,
        fill: { color: '0A294A' }, line: { color: C.accentCyan, width: 0.8 }, rectRadius: 0.09
      });
      slide.addText(m.cat, {
        x: mx + 0.1, y: my + 0.1, w: 1.0, h: 0.18,
        fontSize: 6.5, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
      });

      // Module Title
      slide.addText(m.title, {
        x: mx + 0.1, y: my + 0.35, w: 1.5, h: 0.38,
        fontSize: 8.5, fontFace: 'Arial', color: C.textWhite, bold: true
      });

      // Simple Description
      slide.addText(m.desc, {
        x: mx + 0.1, y: my + 0.75, w: 1.5, h: 0.9,
        fontSize: 7.2, fontFace: 'Arial', color: C.textMuted
      });
    });
  }

  // =========================================================================
  // SLIDE 12 — FEATURES AND TECHNOLOGIES
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'System Overview', 'Features and Technologies', 'Comprehensive breakdown of system capabilities and production technology stack');

    // Left Column: Key Features
    addCard(slide, 0.6, 1.45, 4.25, 3.7, C.bgCard, C.accentCyan, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.6, w: 1.8, h: 0.26,
      fill: { color: '0A294A' }, line: { color: C.accentCyan, width: 1 }, rectRadius: 0.13
    });
    slide.addText('KEY FEATURES', {
      x: 0.8, y: 1.6, w: 1.8, h: 0.26,
      fontSize: 8.5, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
    });

    const keyFeatures = [
      '• Three separate user portals (Patient, Doctor, Admin).',
      '• Dark and Light themes with instant personalization.',
      '• Fully responsive interface across mobile, tablet, and PC.',
      '• Doctor search and medical specialization filters.',
      '• Direct appointment scheduling without prior registration.',
      '• Doctor credential verification and approval workflow.',
      '• 24/7 Emergency assistance hotline and campus locator.',
      '• Hospital facilities gallery presenting 15 clinical spaces.',
      '• Calendar integration and simulated payment receipts.',
      '• Administrative reports and CSV data export.'
    ];
    slide.addText(keyFeatures.join('\n'), {
      x: 0.8, y: 1.95, w: 3.85, h: 3.1,
      fontSize: 8, fontFace: 'Arial', color: C.textWhite
    });

    // Right Column: Technologies Used Table
    addCard(slide, 5.15, 1.45, 4.25, 3.7, C.bgCard, C.accentTeal, 0.1);
    slide.addShape(pres.ShapeType.rect, {
      x: 5.35, y: 1.6, w: 2.1, h: 0.26,
      fill: { color: '0A294A' }, line: { color: C.accentTeal, width: 1 }, rectRadius: 0.13
    });
    slide.addText('TECHNOLOGIES USED', {
      x: 5.35, y: 1.6, w: 2.1, h: 0.26,
      fontSize: 8.5, fontFace: 'Arial', color: C.accentTeal, bold: true, align: 'center', valign: 'middle'
    });

    const techRows = [
      { area: 'Framework', tech: 'Next.js 14 (App Router)' },
      { area: 'UI Library', tech: 'React 18' },
      { area: 'Language', tech: 'TypeScript' },
      { area: 'Styling', tech: 'Tailwind CSS 3' },
      { area: 'Backend', tech: 'Supabase (BaaS)' },
      { area: 'Database', tech: 'PostgreSQL' },
      { area: 'Authentication', tech: 'Supabase Auth' },
      { area: 'Charts', tech: 'Recharts' },
      { area: 'Icons', tech: 'Lucide React' },
      { area: 'Notifications', tech: 'SweetAlert2 & Browser Web Speech' },
      { area: 'Hosting', tech: 'Vercel Edge Network' },
    ];

    techRows.forEach((r, idx) => {
      const ry = 1.95 + idx * 0.28;
      addCard(slide, 5.35, ry, 3.85, 0.25, idx % 2 === 0 ? '081F3D' : '071A35', C.border, 0.04);
      slide.addText(r.area, {
        x: 5.45, y: ry, w: 1.4, h: 0.25,
        fontSize: 7.8, fontFace: 'Arial', color: C.accentCyan, bold: true, valign: 'middle'
      });
      slide.addText(r.tech, {
        x: 6.85, y: ry, w: 2.25, h: 0.25,
        fontSize: 7.8, fontFace: 'Arial', color: C.textWhite, valign: 'middle'
      });
    });
  }

  // =========================================================================
  // SLIDE 13 — SYSTEM ARCHITECTURE
  // =========================================================================
  {
    const slide = pres.addSlide();
    setupSlideHeader(slide, 'System Blueprint', 'System Architecture', 'End-to-end architecture supporting Demo Mode and Supabase Mode with Vercel deployment');

    // 1. Users Layer
    addCard(slide, 0.6, 1.45, 8.8, 0.52, C.bgCard, C.accentCyan, 0.08);
    slide.addText('USERS', {
      x: 0.75, y: 1.47, w: 1.5, h: 0.48,
      fontSize: 9, fontFace: 'Arial', color: C.accentCyan, bold: true, valign: 'middle'
    });
    slide.addText('Patient (Mobile & Desktop)      |      Doctor (Clinical Tablet)      |      Administrator (Management Workstation)', {
      x: 2.2, y: 1.47, w: 7.0, h: 0.48,
      fontSize: 8.5, fontFace: 'Arial', color: C.textWhite, valign: 'middle'
    });

    // Arrow down
    slide.addText('▼', {
      x: 4.8, y: 1.95, w: 0.4, h: 0.2,
      fontSize: 10, fontFace: 'Arial', color: C.accentCyan, align: 'center'
    });

    // 2. Frontend Layer
    addCard(slide, 0.6, 2.15, 8.8, 0.52, C.bgCard, C.accentTeal, 0.08);
    slide.addText('FRONTEND', {
      x: 0.75, y: 2.17, w: 1.5, h: 0.48,
      fontSize: 9, fontFace: 'Arial', color: C.accentTeal, bold: true, valign: 'middle'
    });
    slide.addText('Next.js 14 App Router      |      React 18      |      TypeScript      |      Tailwind CSS 3 (Dark & Light Themes)', {
      x: 2.2, y: 2.17, w: 7.0, h: 0.48,
      fontSize: 8.5, fontFace: 'Arial', color: C.textWhite, valign: 'middle'
    });

    // Arrow down
    slide.addText('▼', {
      x: 4.8, y: 2.65, w: 0.4, h: 0.2,
      fontSize: 10, fontFace: 'Arial', color: C.accentTeal, align: 'center'
    });

    // 3. Application Logic Layer
    addCard(slide, 0.6, 2.85, 8.8, 0.52, C.bgCard, C.accentBlue, 0.08);
    slide.addText('APPLICATION LOGIC', {
      x: 0.75, y: 2.87, w: 1.8, h: 0.48,
      fontSize: 8, fontFace: 'Arial', color: C.accentBlue, bold: true, valign: 'middle'
    });
    slide.addText('Role-Based Protected Routing  |  Queue Auto-Pilot (30-min Timer)  |  AURA AI Keyword Engine  |  Simulated Payment', {
      x: 2.6, y: 2.87, w: 6.6, h: 0.48,
      fontSize: 8, fontFace: 'Arial', color: C.textWhite, valign: 'middle'
    });

    // Arrow down
    slide.addText('▼', {
      x: 4.8, y: 3.35, w: 0.4, h: 0.2,
      fontSize: 10, fontFace: 'Arial', color: C.accentBlue, align: 'center'
    });

    // 4. Two Supported Data Modes (Side by side)
    // Left: Demo Mode
    addCard(slide, 0.6, 3.55, 4.25, 1.25, C.bgCard, C.accentGreen, 0.08);
    slide.addText('DEMO MODE (OFFLINE)', {
      x: 0.75, y: 3.65, w: 3.9, h: 0.25,
      fontSize: 9, fontFace: 'Arial', color: C.accentGreen, bold: true
    });
    slide.addText('• Browser LocalStorage persistence\n• Realistic sample clinical data\n• No cloud backend required (100% demo uptime)', {
      x: 0.75, y: 3.95, w: 3.9, h: 0.75,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Right: Supabase Mode
    addCard(slide, 5.15, 3.55, 4.25, 1.25, C.bgCard, C.accentAmber, 0.08);
    slide.addText('SUPABASE MODE (CLOUD)', {
      x: 5.3, y: 3.65, w: 3.9, h: 0.25,
      fontSize: 9, fontFace: 'Arial', color: C.accentAmber, bold: true
    });
    slide.addText('• Supabase Auth & PostgreSQL Database\n• Realtime WebSocket Channels & Row-Level Security (RLS)\n• Edge Functions & Database Stored Procedures', {
      x: 5.3, y: 3.95, w: 3.9, h: 0.75,
      fontSize: 8, fontFace: 'Arial', color: C.textMuted
    });

    // Deployment Footer Banner
    addCard(slide, 0.6, 4.92, 8.8, 0.38, '071F3F', C.accentCyan, 0.08);
    slide.addText('DEPLOYMENT: Hosted on Vercel Global Edge Network with CI/CD Automation', {
      x: 0.6, y: 4.92, w: 8.8, h: 0.38,
      fontSize: 9.5, fontFace: 'Arial', color: C.accentCyan, bold: true, align: 'center', valign: 'middle'
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
