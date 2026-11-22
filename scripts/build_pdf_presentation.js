const fs = require('fs');
const path = require('path');

// Pure Node.js 16:9 PDF Generator for MEDIVANCE Presentation
class SimplePdfDoc {
  constructor(w = 720, h = 405) {
    this.w = w;
    this.h = h;
    this.objects = [];
    this.pages = [];
  }

  addObject(content) {
    this.objects.push(content);
    return this.objects.length; // 1-based index
  }

  addJpeg(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    let width = 800, height = 600;
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] === 0xFF && (buffer[offset+1] === 0xC0 || buffer[offset+1] === 0xC2)) {
        height = buffer.readUInt16BE(offset + 5);
        width = buffer.readUInt16BE(offset + 7);
        break;
      }
      offset += 1;
    }

    const imgObjIndex = this.addObject({
      type: 'image',
      width,
      height,
      data: buffer
    });
    return { id: imgObjIndex, width, height };
  }

  addPage(commands, images = {}) {
    this.pages.push({ commands, images });
  }

  generate() {
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [];

    // Catalog & Outlines (objs 1 & 2)
    const catalogObj = 1;
    const outlinesObj = 2;
    const pagesObj = 3;

    // We will allocate objects:
    // 1: Catalog
    // 2: Outlines
    // 3: Pages
    // 4..: Font, Images, Page objs, Content streams
    let currentId = 4;
    const fontObj1 = currentId++; // Helvetica
    const fontObj2 = currentId++; // Helvetica-Bold

    // Image objects allocation
    const imageMap = new Map();
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      if (obj.type === 'image') {
        const id = currentId++;
        imageMap.set(i + 1, id);
      }
    }

    // Page & Content obj IDs
    const pageRecords = [];
    for (let i = 0; i < this.pages.length; i++) {
      const pageId = currentId++;
      const contentId = currentId++;
      pageRecords.push({ pageId, contentId, data: this.pages[i] });
    }

    // Now write objects
    function writeObj(num, content) {
      offsets[num] = Buffer.byteLength(out, 'latin1');
      out += `${num} 0 obj\n${content}\nendobj\n`;
    }

    // Obj 1: Catalog
    writeObj(catalogObj, `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

    // Obj 2: Outlines
    writeObj(outlinesObj, `<< /Type /Outlines /Count 0 >>`);

    // Obj 3: Pages
    const kids = pageRecords.map(p => `${p.pageId} 0 R`).join(' ');
    writeObj(pagesObj, `<< /Type /Pages /Kids [ ${kids} ] /Count ${pageRecords.length} /MediaBox [ 0 0 ${this.w} ${this.h} ] >>`);

    // Obj 4: Font F1
    writeObj(fontObj1, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);

    // Obj 5: Font F2
    writeObj(fontObj2, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

    // Write Images
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      if (obj.type === 'image') {
        const id = imageMap.get(i + 1);
        offsets[id] = Buffer.byteLength(out, 'latin1');
        const header = `${id} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${obj.width} /Height ${obj.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${obj.data.length} >>\nstream\n`;
        const footer = '\nendstream\nendobj\n';
        out += header;
        out += obj.data.toString('latin1');
        out += footer;
      }
    }

    // Write Pages & Contents
    for (let i = 0; i < pageRecords.length; i++) {
      const p = pageRecords[i];

      // Build XObject dict for page
      let xobjDict = '';
      if (p.data.images) {
        const entries = Object.keys(p.data.images).map(k => {
          const imgRef = p.data.images[k];
          const realId = imageMap.get(imgRef.id);
          return `/${k} ${realId} 0 R`;
        }).join(' ');
        if (entries) xobjDict = `/XObject << ${entries} >>`;
      }

      // Page obj
      writeObj(p.pageId, `<< /Type /Page /Parent ${pagesObj} 0 R /Resources << /Font << /F1 ${fontObj1} 0 R /F2 ${fontObj2} 0 R >> ${xobjDict} >> /Contents ${p.contentId} 0 R >>`);

      // Content stream
      const streamData = p.data.commands;
      const sLen = Buffer.byteLength(streamData, 'latin1');
      writeObj(p.contentId, `<< /Length ${sLen} >>\nstream\n${streamData}\nendstream`);
    }

    // XREF Table
    const startXref = Buffer.byteLength(out, 'latin1');
    out += `xref\n0 ${currentId}\n0000000000 65535 f \n`;
    for (let i = 1; i < currentId; i++) {
      const off = String(offsets[i]).padStart(10, '0');
      out += `${off} 00000 n \n`;
    }
    out += `trailer\n<< /Size ${currentId} /Root ${catalogObj} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(out, 'latin1');
  }
}

// Convert slides to PDF
function buildPdf() {
  const doc = new SimplePdfDoc(720, 405);
  const userUploaded = 'C:/Users/Esha/.gemini/antigravity/brain/dbe57032-cfdd-47d0-8f7b-09f28aeb13e4/.user_uploaded';

  // Load JPEG images
  const imgHome = doc.addJpeg('public/images/hero-night.jpg');
  const imgSplash1 = doc.addJpeg(path.join(userUploaded, 'media_1795030648270_891afb17.jpg'));
  const imgSplash2 = doc.addJpeg(path.join(userUploaded, 'media_1795030648301_e5859515.jpg'));
  const imgP1 = doc.addJpeg(path.join(userUploaded, 'media_1795251666647_6d41677b.jpg'));
  const imgAbout = doc.addJpeg('public/images/promo-care.jpg');
  const imgDocs = doc.addJpeg(path.join(userUploaded, 'media_1795033998338_c2e1fc3a.jpg'));
  const imgLoc = doc.addJpeg('public/images/live-location-hero.jpg');
  const imgInside = doc.addJpeg(path.join(userUploaded, 'media_1795176783401_66e1616b.jpg'));
  const imgBook = doc.addJpeg(path.join(userUploaded, 'media_1795113304445_c24373ce.jpg'));
  const imgWs = doc.addJpeg(path.join(userUploaded, 'media_1795198384113_9d8425b5.jpg'));
  const imgRegP = doc.addJpeg(path.join(userUploaded, 'media_1795250252626_7eb8f4e0.jpg'));
  const imgRegD = doc.addJpeg(path.join(userUploaded, 'media_1795183281715_e918bdf6.jpg'));
  const imgPDash = doc.addJpeg(path.join(userUploaded, 'media_1795288114663_f25209d1.jpg'));
  const imgDQueue = doc.addJpeg(path.join(userUploaded, 'media_1795288044371_6db2b6c2.jpg'));

  function esc(str) {
    return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function header(cat, title, sub) {
    return `
      0.015 0.051 0.118 rg 0 0 720 405 re f
      0.031 0.145 0.271 rg 0 355 720 50 re f
      0 0.898 1.0 rg 0.094 0.22 0.38 rg
      40 375 140 18 re f
      BT /F2 8.5 Tf 1 1 1 rg 48 380 Td (${esc(cat.toUpperCase())}) Tj ET
      BT /F2 15 Tf 1 1 1 rg 40 360 Td (${esc(title)}) Tj ET
      BT /F1 9 Tf 0.22 0.74 0.97 rg 40 346 Td (${esc(sub)}) Tj ET
      0.094 0.22 0.38 rg 40 340 640 1 re f
      BT /F1 7.5 Tf 0.39 0.45 0.54 rg 40 15 Td (MEDIVANCE  |  AI-Powered Doctor Appointment System  |  Presenter: Esha Kewalramani) Tj ET
    `;
  }

  // Slide 1: Intro
  {
    let cmd = `
      0.015 0.051 0.118 rg 0 0 720 405 re f
      0.024 0.086 0.176 rg 380 0 340 405 re f
      BT /F2 22 Tf 0 0.898 1 rg 40 340 Td (MEDIVANCE) Tj ET
      BT /F2 13 Tf 1 1 1 rg 40 318 Td (AI-Powered Doctor Appointment System) Tj ET
      BT /F1 8.5 Tf 0.58 0.64 0.72 rg
      40 280 Td (A modern web system that makes doctor appointments fast and paperless.) Tj
      0 -14 Td (Connects patients, doctors, and hospital administration in one platform.) Tj
      0 -14 Td (Features instant online booking, live queue tracking, and QR gate passes.) Tj
      0 -14 Td (Built-in AURA AI assistant guides patients to the right medical wing.) Tj
      ET
      0.027 0.102 0.208 rg 40 110 300 70 re f
      BT /F2 8.5 Tf 0 0.898 1 rg 50 162 Td (PRESENTER) Tj ET
      BT /F2 13 Tf 1 1 1 rg 50 144 Td (Esha Kewalramani) Tj ET
      BT /F1 8 Tf 0.58 0.64 0.72 rg 50 128 Td (Project Lead & Full-Stack Developer) Tj ET
      BT /F1 7.5 Tf 0.39 0.45 0.54 rg 40 20 Td (Production Build  |  Next.js 14  |  Tailwind CSS  |  Supabase PostgreSQL) Tj ET
    `;
    const imgs = {};
    if (imgHome) {
      imgs['ImHome'] = imgHome;
      cmd += `q 300 0 0 240 395 100 cm /ImHome Do Q\n`;
      cmd += `BT /F2 8.5 Tf 0 0.898 1 rg 470 80 Td (ACTUAL PRODUCTION HOMEPAGE) Tj ET\n`;
    }
    doc.addPage(cmd, imgs);
  }

  // Slide 2: Splash Screens
  {
    let cmd = header('Splash Screens', 'Splash Screen Experience', 'Two welcoming screens that introduce the MEDIVANCE brand and vision');
    cmd += `
      0.031 0.118 0.239 rg 40 315 640 22 re f
      BT /F2 9.5 Tf 0 0.898 1 rg 120 321 Td ("MEDIVANCE should not simply open; it should leave an impression.") Tj ET
      0.027 0.098 0.2 rg 40 50 305 255 re f
      0.027 0.098 0.2 rg 375 50 305 255 re f
      BT /F2 9 Tf 0 0.898 1 rg 50 288 Td (STAGE 1: BRAND IDENTITY) Tj ET
      BT /F2 9 Tf 0.05 0.58 0.53 rg 385 288 Td (STAGE 2: HEALTHCARE VISION) Tj ET
      BT /F1 8 Tf 1 1 1 rg
      50 90 Td (Displays the official MEDIVANCE emblem and typography.) Tj
      0 -12 Td (Builds instant brand recognition, warmth, and institutional trust.) Tj
      385 90 Td (Welcomes patients into an intelligent clinical journey.) Tj
      0 -12 Td (Introduces our core promise: zero waiting rooms and faster care.) Tj
      ET
    `;
    const imgs = {};
    if (imgSplash1) { imgs['ImS1'] = imgSplash1; cmd += `q 285 0 0 160 50 115 cm /ImS1 Do Q\n`; }
    if (imgSplash2) { imgs['ImS2'] = imgSplash2; cmd += `q 285 0 0 160 385 115 cm /ImS2 Do Q\n`; }
    doc.addPage(cmd, imgs);
  }

  // Slide 3: Public Pages I
  {
    let cmd = header('Public Website', 'Explore MEDIVANCE: Public Pages I', 'Three essential public pages: Home, About, and Doctors directory');
    cmd += `
      0.027 0.098 0.2 rg 40 50 310 280 re f
      0.027 0.098 0.2 rg 370 195 310 135 re f
      0.027 0.098 0.2 rg 370 50 310 135 re f
      BT /F2 9 Tf 0 0.898 1 rg 50 315 Td (1. HOME PAGE (/)) Tj ET
      BT /F2 9 Tf 0.05 0.58 0.53 rg 380 315 Td (2. ABOUT PAGE (/about)) Tj ET
      BT /F2 9 Tf 0.22 0.74 0.97 rg 380 170 Td (3. DOCTORS PAGE (/doctors)) Tj ET
      BT /F1 8 Tf 0.58 0.64 0.72 rg
      50 110 Td (Features 24/7 emergency dispatch, doctor search, and booking CTAs.) Tj
      0 -12 Td (Purpose: Welcomes users and guides them straight to clinical care.) Tj
      380 205 Td (Details hospital care units, patient ethics, and facilities.) Tj
      380 60 Td (Search specialists by department, consultation fee, and room availability.) Tj
      ET
    `;
    const imgs = {};
    if (imgP1) { imgs['ImP1'] = imgP1; cmd += `q 290 0 0 170 50 135 cm /ImP1 Do Q\n`; }
    if (imgAbout) { imgs['ImAb'] = imgAbout; cmd += `q 140 0 0 85 530 230 cm /ImAb Do Q\n`; }
    if (imgDocs) { imgs['ImDoc'] = imgDocs; cmd += `q 140 0 0 85 530 85 cm /ImDoc Do Q\n`; }
    doc.addPage(cmd, imgs);
  }

  // Slide 4: Public Pages II
  {
    let cmd = header('Public Website', 'Explore MEDIVANCE: Public Pages II', 'Live Location, 15 Hospital Facilities Gallery, and Direct Booking');
    cmd += `
      0.027 0.098 0.2 rg 40 50 200 280 re f
      0.027 0.098 0.2 rg 260 50 200 280 re f
      0.027 0.098 0.2 rg 480 50 200 280 re f
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 50 315 Td (LIVE LOCATION (/location)) Tj ET
      BT /F2 8.5 Tf 0 0.898 1 rg 270 315 Td (INSIDE (/inside)) Tj ET
      BT /F2 8.5 Tf 0.22 0.74 0.97 rg 490 315 Td (BOOK NOW (/book)) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg
      50 120 Td (Campus floor maps & clinic wings.) Tj
      0 -11 Td (Guides patients to their exact room.) Tj
      270 120 Td (15 hospital facilities gallery.) Tj
      0 -11 Td (Displays ICU, suites, & labs.) Tj
      490 120 Td (Direct booking without login.) Tj
      0 -11 Td (Home "Book Now" locks slots.) Tj
      ET
    `;
    const imgs = {};
    if (imgLoc) { imgs['ImLoc'] = imgLoc; cmd += `q 180 0 0 130 50 160 cm /ImLoc Do Q\n`; }
    if (imgInside) { imgs['ImIns'] = imgInside; cmd += `q 180 0 0 130 270 160 cm /ImIns Do Q\n`; }
    if (imgBook) { imgs['ImBk'] = imgBook; cmd += `q 180 0 0 130 490 160 cm /ImBk Do Q\n`; }
    doc.addPage(cmd, imgs);
  }

  // Slide 5: Workspace and Three Portals
  {
    let cmd = header('Workspace & Roles', 'Workspace and Three Portals', 'Central role selector providing dedicated workspaces for Patients, Doctors, and Administrators');
    cmd += `
      0.027 0.098 0.2 rg 40 50 330 280 re f
      0.031 0.118 0.239 rg 50 60 310 40 re f
      BT /F2 10 Tf 0 0.898 1 rg 60 84 Td ("One Platform. Three Perspectives.") Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 60 70 Td (Role-partitioned clinical portals with secure data isolation.) Tj ET
      0.027 0.098 0.2 rg 390 240 290 90 re f
      0.027 0.098 0.2 rg 390 145 290 90 re f
      0.027 0.098 0.2 rg 390 50 290 90 re f
      BT /F2 9.5 Tf 0 0.898 1 rg 405 315 Td (PATIENT PORTAL) Tj ET
      BT /F1 8 Tf 1 1 1 rg 405 300 Td (Manage appointments and healthcare information.) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 405 285 Td (Live queue tokens, digital gate passes, and prescription history.) Tj ET
      BT /F2 9.5 Tf 0.05 0.58 0.53 rg 405 220 Td (DOCTOR PORTAL) Tj ET
      BT /F1 8 Tf 1 1 1 rg 405 205 Td (Manage appointments, availability and patient records.) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 405 190 Td (Queue auto-pilot, lobby speech chime, AI SOAP notes, and e-Rx.) Tj ET
      BT /F2 9.5 Tf 0.22 0.74 0.97 rg 405 125 Td (ADMIN PORTAL) Tj ET
      BT /F1 8 Tf 1 1 1 rg 405 110 Td (Manage doctors, patients, appointments and system settings.) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 405 95 Td (Doctor license vetting, queue monitor, analytics, and CSV exports.) Tj ET
    `;
    const imgs = {};
    if (imgWs) { imgs['ImWs'] = imgWs; cmd += `q 310 0 0 190 50 120 cm /ImWs Do Q\n`; }
    doc.addPage(cmd, imgs);
  }

  // Slide 6: Patient Registration
  {
    let cmd = header('Patient Onboarding', 'Patient Registration', 'Online registration form capturing essential details for seamless access to the Patient Portal');
    cmd += `
      0.027 0.098 0.2 rg 40 50 370 280 re f
      0.027 0.098 0.2 rg 430 265 250 65 re f
      0.027 0.098 0.2 rg 430 195 250 65 re f
      0.027 0.098 0.2 rg 430 125 250 65 re f
      0.027 0.098 0.2 rg 430 55 250 65 re f
      BT /F2 8.5 Tf 0 0.898 1 rg 440 315 Td (1. PERSONAL INFORMATION) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 440 300 Td (Captures legal name, age, gender, and blood group.) Tj ET
      BT /F2 8.5 Tf 0 0.898 1 rg 440 245 Td (2. CONTACT DETAILS) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 440 230 Td (Stores phone and email to send automated SMS visit alerts.) Tj ET
      BT /F2 8.5 Tf 0 0.898 1 rg 440 175 Td (3. ACCOUNT SECURITY) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 440 160 Td (Protected private account with encrypted authentication.) Tj ET
      BT /F2 8.5 Tf 0 0.898 1 rg 440 105 Td (4. INSTANT PORTAL ACCESS) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 440 90 Td (Immediate provisioning to the live personal dashboard.) Tj ET
    `;
    const imgs = {};
    if (imgRegP) { imgs['ImRegP'] = imgRegP; cmd += `q 350 0 0 240 50 75 cm /ImRegP Do Q\n`; }
    doc.addPage(cmd, imgs);
  }

  // Slide 7: Doctor Registration
  {
    let cmd = header('Doctor Onboarding', 'Doctor Registration', 'Verified clinical onboarding workflow with mandatory administrative approval gate');
    cmd += `
      0.027 0.098 0.2 rg 40 50 370 280 re f
      0.027 0.098 0.2 rg 430 265 250 65 re f
      0.027 0.098 0.2 rg 430 195 250 65 re f
      0.027 0.098 0.2 rg 430 125 250 65 re f
      0.027 0.098 0.2 rg 430 55 250 65 re f
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 440 315 Td (1. MEDICAL LICENSE NUMBER) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 440 300 Td (Records state medical council registration number.) Tj ET
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 440 245 Td (2. SPECIALIZATION & WING) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 440 230 Td (Assigns doctor to Cardiology, Neurology, Pediatrics, etc.) Tj ET
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 440 175 Td (3. CLINIC ROOM & FEES) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 440 160 Td (Defines clinic room, shift timings, and consultation fee.) Tj ET
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 440 105 Td (4. ADMIN APPROVAL GATE) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 440 90 Td (Account stays locked until hospital admin approves degrees.) Tj ET
    `;
    const imgs = {};
    if (imgRegD) { imgs['ImRegD'] = imgRegD; cmd += `q 350 0 0 240 50 75 cm /ImRegD Do Q\n`; }
    doc.addPage(cmd, imgs);
  }

  // Slide 8: Patient Dashboard
  {
    let cmd = header('Patient Portal', 'Patient Dashboard', 'Comprehensive personal health dashboard with live queue tracking and Digital Gate Pass');
    cmd += `
      0.027 0.098 0.2 rg 40 50 330 280 re f
      0.027 0.098 0.2 rg 390 50 290 280 re f
      BT /F2 9.5 Tf 0 0.898 1 rg 405 315 Td (DIGITAL GATE PASS & QR CODE) Tj ET
      BT /F1 8 Tf 1 1 1 rg
      405 295 Td (• Token Number: #15) Tj
      0 -14 Td (• Patient: Esha Kewalramani) Tj
      0 -14 Td (• Doctor: Dr. Sara Ahmed) Tj
      0 -14 Td (• Room: Room 102 - OPD Heart Wing) Tj
      0 -14 Td (• Status: SEATED IN LOBBY) Tj
      0 -20 Td (Features Demonstrated:) Tj
      ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg
      405 180 Td (• Health summary: live queue radar and wait tracker.) Tj
      0 -12 Td (• Turnstile QR barcode check-in eliminates desk lines.) Tj
      0 -12 Td (• Automated SMS alerts sent 1 hour prior to appointment.) Tj
      0 -12 Td (• Downloadable verifiable medical prescriptions.) Tj
      ET
    `;
    const imgs = {};
    if (imgPDash) { imgs['ImPDash'] = imgPDash; cmd += `q 310 0 0 240 50 75 cm /ImPDash Do Q\n`; }
    doc.addPage(cmd, imgs);
  }

  // Slide 9: Doctor Dashboard
  {
    let cmd = header('Doctor Portal', 'Doctor Dashboard', 'Clinical console for appointment control, queue auto-pilot, and digital prescriptions');
    cmd += `
      0.027 0.098 0.2 rg 40 50 350 280 re f
      0.027 0.098 0.2 rg 410 270 270 60 re f
      0.027 0.098 0.2 rg 410 205 270 60 re f
      0.027 0.098 0.2 rg 410 140 270 60 re f
      0.027 0.098 0.2 rg 410 75 270 60 re f
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 420 315 Td (APPOINTMENT MANAGEMENT) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 420 300 Td (Accept, reject, or complete requests with one click.) Tj ET
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 420 250 Td (30-MIN QUEUE AUTO-PILOT) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 420 235 Td (Real-clock consultation timer that skips passed slots.) Tj ET
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 420 185 Td (PATIENT RECORDS & AI SOAP) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 420 170 Td (1-click preview of intake notes (Subjective, Objective).) Tj ET
      BT /F2 8.5 Tf 0.05 0.58 0.53 rg 420 120 Td (SMART DIGITAL PRESCRIPTION) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 420 105 Td (Issues official digital prescription with pharmacy QR code.) Tj ET
    `;
    const imgs = {};
    if (imgDQueue) { imgs['ImDQ'] = imgDQueue; cmd += `q 330 0 0 240 50 75 cm /ImDQ Do Q\n`; }
    doc.addPage(cmd, imgs);
  }

  // Slide 10: Admin Dashboard
  {
    let cmd = header('Admin Portal', 'Admin Dashboard', 'Central administration console for doctor vetting, appointment oversight, and system analytics');
    cmd += `
      0.027 0.098 0.2 rg 40 50 310 280 re f
      0.027 0.098 0.2 rg 370 265 310 65 re f
      0.027 0.098 0.2 rg 370 195 310 65 re f
      0.027 0.098 0.2 rg 370 125 310 65 re f
      0.027 0.098 0.2 rg 370 55 310 65 re f
      BT /F2 9.5 Tf 0.22 0.74 0.97 rg 55 315 Td (DASHBOARD STATISTICS & METRICS) Tj ET
      BT /F1 8 Tf 1 1 1 rg
      55 285 Td (• Total Patients: Full hospital directory registry) Tj
      0 -14 Td (• Active Doctors: Verified medical specialists) Tj
      0 -14 Td (• Total Appointments: Live hospital volume tracker) Tj
      0 -14 Td (• Pending Bookings: Real-time conflict resolution) Tj
      0 -14 Td (• Completed Consultations: Daily outpatient count) Tj
      0 -20 Td (Administrative Capabilities:) Tj
      ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg
      55 160 Td (• Recharts analytics: Weekly activity, monthly volume.) Tj
      0 -12 Td (• Visual specialty distribution donut chart.) Tj
      0 -12 Td (• 1-click CSV data export for hospital reporting.) Tj
      ET
      BT /F2 8.5 Tf 0.22 0.74 0.97 rg 385 315 Td (DOCTOR APPROVAL & VETTING) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 385 300 Td (Review pending doctor licenses and activate privileges.) Tj ET
      BT /F2 8.5 Tf 0.22 0.74 0.97 rg 385 245 Td (DOCTOR & PATIENT MANAGEMENT) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 385 230 Td (Search, filter, edit, or deactivate accounts system-wide.) Tj ET
      BT /F2 8.5 Tf 0.22 0.74 0.97 rg 385 175 Td (APPOINTMENT & QUEUE OVERSIGHT) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 385 160 Td (Supervise scheduled, waiting, and completed clinic slots.) Tj ET
      BT /F2 8.5 Tf 0.22 0.74 0.97 rg 385 105 Td (SPECIALIZATIONS & SYSTEM SETTINGS) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg 385 90 Td (Configure medical departments and Row-Level Security rules.) Tj ET
    `;
    doc.addPage(cmd);
  }

  // Slide 11: Core Modules
  {
    let cmd = header('Main Modules', 'Core Modules of MEDIVANCE', 'Ten verified functional modules powering the complete outpatient experience');
    const modules = [
      'Appointment Management', 'Doctor Management', 'Patient Management', 'Doctor Availability', 'Payment and Receipts',
      'Notifications Engine', 'Live Location & Maps', 'Emergency Assistance', 'Reports and Analytics', 'In-Dashboard AURA AI'
    ];
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = 40 + col * 130;
      const y = 195 - row * 140;
      cmd += `
        0.027 0.098 0.2 rg ${x} ${y} 120 125 re f
        BT /F2 8 Tf 0 0.898 1 rg ${x + 8} ${y + 105} Td (MODULE ${i + 1}) Tj ET
        BT /F2 8 Tf 1 1 1 rg ${x + 8} ${y + 85} Td (${esc(modules[i])}) Tj ET
      `;
    }
    doc.addPage(cmd);
  }

  // Slide 12: Features and Technologies
  {
    let cmd = header('System Overview', 'Features and Technologies', 'Comprehensive breakdown of system capabilities and production technology stack');
    cmd += `
      0.027 0.098 0.2 rg 40 50 305 280 re f
      0.027 0.098 0.2 rg 365 50 315 280 re f
      BT /F2 9.5 Tf 0 0.898 1 rg 55 315 Td (KEY FEATURES) Tj ET
      BT /F1 7.8 Tf 1 1 1 rg
      55 295 Td (• Three separate user portals (Patient, Doctor, Admin).) Tj
      0 -13 Td (• Dark and Light themes with instant personalization.) Tj
      0 -13 Td (• Fully responsive interface (mobile, tablet, desktop).) Tj
      0 -13 Td (• Doctor search and medical specialization filters.) Tj
      0 -13 Td (• Direct appointment scheduling without prior registration.) Tj
      0 -13 Td (• Doctor approval workflow for clinical safety.) Tj
      0 -13 Td (• 24/7 Emergency assistance hotline & campus locator.) Tj
      0 -13 Td (• Hospital facilities gallery presenting 15 spaces.) Tj
      0 -13 Td (• Calendar integration and simulated payment receipts.) Tj
      0 -13 Td (• Reports and CSV data export for administrators.) Tj
      ET
      BT /F2 9.5 Tf 0.05 0.58 0.53 rg 380 315 Td (TECHNOLOGIES USED) Tj ET
      BT /F1 7.8 Tf 1 1 1 rg
      380 295 Td (Framework: Next.js 14 (App Router)) Tj
      0 -13 Td (UI Library: React 18 (Strict Concurrent Mode)) Tj
      0 -13 Td (Language: TypeScript (Type-Safe Contracts)) Tj
      0 -13 Td (Styling: Tailwind CSS 3 (Custom Themes)) Tj
      0 -13 Td (Backend: Supabase (BaaS Architecture)) Tj
      0 -13 Td (Database: PostgreSQL (Cloud Database)) Tj
      0 -13 Td (Authentication: Supabase Auth (JWT Security)) Tj
      0 -13 Td (Charts: Recharts (Data Visualizations)) Tj
      0 -13 Td (Icons: Lucide React (Clinical Icons)) Tj
      0 -13 Td (Notifications: SweetAlert2 & Web Speech API) Tj
      0 -13 Td (Hosting: Vercel (Edge Network Deployment)) Tj
      ET
    `;
    doc.addPage(cmd);
  }

  // Slide 13: System Architecture
  {
    let cmd = header('System Blueprint', 'System Architecture', 'End-to-end architecture supporting Demo Mode and Supabase Mode with Vercel deployment');
    cmd += `
      0.027 0.098 0.2 rg 40 280 640 40 re f
      BT /F2 9 Tf 0 0.898 1 rg 55 295 Td (USERS:) Tj ET
      BT /F1 8.5 Tf 1 1 1 rg 110 295 Td (Patient (Mobile/Desktop)    |    Doctor (Clinical Tablet)    |    Admin (Workstation)) Tj ET
      BT /F2 10 Tf 0 0.898 1 rg 355 268 Td (v) Tj ET

      0.027 0.098 0.2 rg 40 225 640 40 re f
      BT /F2 9 Tf 0.05 0.58 0.53 rg 55 240 Td (FRONTEND:) Tj ET
      BT /F1 8.5 Tf 1 1 1 rg 135 240 Td (Next.js 14 App Router    |    React 18    |    TypeScript    |    Tailwind CSS 3) Tj ET
      BT /F2 10 Tf 0.05 0.58 0.53 rg 355 213 Td (v) Tj ET

      0.027 0.098 0.2 rg 40 170 640 40 re f
      BT /F2 9 Tf 0.22 0.74 0.97 rg 55 185 Td (LOGIC:) Tj ET
      BT /F1 8.5 Tf 1 1 1 rg 110 185 Td (Role Protected Routing    |    Queue Auto-Pilot    |    AURA AI Keyword Engine    |    Simulated Payment) Tj ET
      BT /F2 10 Tf 0.22 0.74 0.97 rg 355 158 Td (v) Tj ET

      0.027 0.098 0.2 rg 40 85 305 70 re f
      0.027 0.098 0.2 rg 375 85 305 70 re f
      BT /F2 8.5 Tf 0.06 0.72 0.5 rg 55 135 Td (DEMO MODE (OFFLINE)) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg
      55 120 Td (• Browser LocalStorage store) Tj
      0 -11 Td (• Realistic sample clinical data) Tj
      0 -11 Td (• 100% demo uptime without internet) Tj
      ET
      BT /F2 8.5 Tf 0.96 0.62 0.04 rg 390 135 Td (SUPABASE MODE (CLOUD)) Tj ET
      BT /F1 7.5 Tf 0.58 0.64 0.72 rg
      390 120 Td (• Supabase Auth & PostgreSQL DB) Tj
      0 -11 Td (• Realtime WebSocket subscriptions) Tj
      0 -11 Td (• Row-Level Security (RLS) & Edge Functions) Tj
      ET
      0.031 0.118 0.239 rg 40 50 640 25 re f
      BT /F2 8.5 Tf 0 0.898 1 rg 160 58 Td (DEPLOYMENT: Hosted on Vercel Global Edge Network with CI/CD Automation) Tj ET
    `;
    doc.addPage(cmd);
  }

  const pdfBuffer = doc.generate();
  fs.writeFileSync('MEDIVANCE_Master_Presentation.pdf', pdfBuffer);
  fs.writeFileSync('C:/Users/Esha/.gemini/antigravity/brain/dbe57032-cfdd-47d0-8f7b-09f28aeb13e4/MEDIVANCE_Master_Presentation.pdf', pdfBuffer);
  console.log('PDF generated successfully!');
}

buildPdf();
