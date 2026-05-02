import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, Footer, TabStopType, TabStopPosition
} from 'docx';
import fs from 'fs';

// Color palette
const C = {
  primary: "1A73E8",      // Google Blue
  secondary: "0F9D58",    // Google Green
  accent: "F4B400",       // Google Yellow
  danger: "DB4437",       // Google Red
  dark: "202124",
  mid: "5F6368",
  light: "F8F9FA",
  border: "DADCE0",
  headerBg: "1A73E8",
  codeBg: "F1F3F4",
  sectionBg: "E8F0FE",
};

const border = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const _noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.primary, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: C.primary })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: C.dark })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: C.mid })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.dark, ...opts })]
  });
}

function _pMixed(runs, spacing = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 120, ...spacing },
    children: runs.map(r => new TextRun({ font: "Arial", size: 22, color: C.dark, ...r }))
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.dark })]
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.dark })]
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 360 },
    shading: { fill: "F1F3F4", type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "0D47A1" })]
  });
}

function spacer(before = 200) {
  return new Paragraph({ spacing: { before }, children: [] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function infoBox(label, content) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 7560],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 1800, type: WidthType.DXA },
          shading: { fill: C.primary, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: "FFFFFF" })] })]
        }),
        new TableCell({
          borders,
          width: { size: 7560, type: WidthType.DXA },
          shading: { fill: C.sectionBg, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: content, font: "Arial", size: 20, color: C.dark })] })]
        })
      ]
    })]
  });
}

function sectionTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows: rows.map(([label, val], i) => new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? C.light : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: C.dark })] })]
        }),
        new TableCell({
          borders,
          width: { size: 6360, type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? C.light : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: val, font: "Arial", size: 20, color: C.dark })] })]
        })
      ]
    }))
  });
}

function apiTable(rows, headers = ["Parameter", "Type", "Required", "Description"]) {
  const colWidths = [2000, 1400, 1200, 4760];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: C.primary, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: "FFFFFF" })] })]
        }))
      }),
      ...rows.map(([p, t, r, d], idx) => new TableRow({
        children: [p, t, r, d].map((val, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: idx % 2 === 0 ? C.light : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: val, font: i === 2 ? "Arial" : i === 0 ? "Courier New" : "Arial", size: 19, color: i === 0 ? "0D47A1" : C.dark, bold: i === 2 && val === "Yes" })] })]
        }))
      }))
    ]
  });
}

function wideTable(rows, headers, colWidths) {
  const _total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: C.dark, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: "FFFFFF" })] })]
        }))
      }),
      ...rows.map((row, idx) => new TableRow({
        children: row.map((val, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: idx % 2 === 0 ? C.light : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: val, font: "Arial", size: 19, color: C.dark })] })]
        }))
      }))
    ]
  });
}

// COVER PAGE
function makeCoverPage() {
  return [
    spacer(800),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: "TECHNICAL SPECIFICATION", font: "Arial", size: 22, color: C.mid, bold: true, allCaps: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: "Digital Asset Protection System", font: "Arial", size: 52, bold: true, color: C.primary })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: "Protecting the Integrity of Digital Sports Media", font: "Arial", size: 30, color: C.dark, italics: true })]
    }),
    spacer(200),
    new Table({
      width: { size: 6000, type: WidthType.DXA },
      columnWidths: [6000],
      rows: [new TableRow({
        children: [new TableCell({
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.primary }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.primary }, left: noBorder, right: noBorder },
          width: { size: 6000, type: WidthType.DXA },
          shading: { fill: C.sectionBg, type: ShadingType.CLEAR },
          margins: { top: 200, bottom: 200, left: 300, right: 300 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Hackathon Prototype MVP", font: "Arial", size: 24, bold: true, color: C.primary })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Google AI APIs  |  Next.js  |  Cloud Infrastructure", font: "Arial", size: 20, color: C.mid })] }),
          ]
        })]
      })]
    }),
    spacer(600),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Version 1.0  |  April 2025", font: "Arial", size: 20, color: C.mid })]
    }),
    pageBreak()
  ];
}

// ── DOCUMENT BUILD ──────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: C.primary },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: C.dark },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: C.mid },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.border, space: 4 } },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: "Digital Asset Protection System  |  Technical Specification", font: "Arial", size: 18, color: C.mid }),
            new TextRun({ text: "\t", font: "Arial", size: 18, color: C.mid }),
          ]
        })]
      })
    },
    children: [

      // ── COVER ──
      ...makeCoverPage(),

      // ── 1. EXECUTIVE SUMMARY ──
      h1("1. Executive Summary"),
      p("The Digital Asset Protection System (DAPS) is a scalable platform that enables sports organizations to register, watermark, and continuously monitor their official digital media assets across the open internet. Built on Google Cloud AI infrastructure, the system combines invisible watermarking, perceptual fingerprinting, web-scale content detection, and a real-time alerting dashboard."),
      spacer(100),
      p("The MVP targets three core capabilities:"),
      bullet("Asset Registration: Ingest official media, embed invisible watermarks via Google SynthID, generate perceptual fingerprints, and store in a tamper-evident registry."),
      bullet("Detection Engine: Continuously scan the internet and major platforms for content that matches registered fingerprints using Google Vision AI Web Detection, Video Intelligence API, and Vertex AI multimodal embeddings."),
      bullet("Ops Dashboard: A Next.js-powered control center for rights holders to review detections, triage violations, and initiate takedowns in near real-time."),
      spacer(120),
      wideTable([
        ["Sports organizations, broadcast rights holders, leagues", "Primary rights holders managing official media libraries"],
        ["Legal / IP enforcement teams", "Teams acting on takedown notices and violations"],
        ["Platform operations teams", "Internal ops monitoring content propagation"],
      ], ["Target User", "Role"], [3600, 5760]),
      spacer(200),

      // ── 2. SYSTEM ARCHITECTURE ──
      pageBreak(),
      h1("2. System Architecture Overview"),
      p("DAPS is structured into four primary layers: Ingestion, Detection, Monitoring, and Presentation. Google Cloud provides the backbone for all AI inference, storage, and queuing."),
      spacer(100),
      h2("2.1 Architecture Layers"),
      wideTable([
        ["Ingestion Layer", "Next.js upload UI, GCS bucket, Cloud Functions", "Accepts new media, triggers watermarking and fingerprint jobs"],
        ["Processing Layer", "SynthID API, Vision AI, Video Intelligence, Vertex AI", "Embeds watermarks, generates hashes and embeddings"],
        ["Detection Layer", "Cloud Scheduler, Pub/Sub, Crawler Workers", "Periodically crawls web/platforms, scores matches"],
        ["Presentation Layer", "Next.js Dashboard, Firebase Realtime / Supabase", "Displays violations, stats, takedown workflows"],
      ], ["Layer", "Components", "Responsibility"], [2200, 3400, 3760]),
      spacer(160),

      h2("2.2 High-Level Data Flow"),
      numbered("Rights holder uploads official media asset via the Dashboard."),
      numbered("Cloud Function triggers: SynthID watermarks the asset; perceptual hash + Vertex embedding are computed."),
      numbered("Asset metadata, hash, and embedding are stored in Postgres (Supabase) + Pinecone/pgvector for similarity search."),
      numbered("Scheduled crawler jobs pull media from YouTube API, Google Image Search, and RSS feeds."),
      numbered("Each discovered piece of media is fingerprinted and compared against the registry using vector similarity search."),
      numbered("Matches above a configurable confidence threshold are written to the Violations table and surfaced in the dashboard with real-time notifications."),
      numbered("Rights holder reviews violation, can trigger a DMCA takedown or mark as licensed."),
      spacer(200),

      h2("2.3 Component Diagram (Text Representation)"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders,
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: "0D1117", type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "┌──────────────────────────────────────────────────────────┐", font: "Courier New", size: 18, color: "58A6FF" })] }),
            new Paragraph({ children: [new TextRun({ text: "│                  DAPS System Architecture                 │", font: "Courier New", size: 18, color: "58A6FF" })] }),
            new Paragraph({ children: [new TextRun({ text: "├──────────────────────────────────────────────────────────┤", font: "Courier New", size: 18, color: "58A6FF" })] }),
            new Paragraph({ children: [new TextRun({ text: "│  [Upload UI]  →  [GCS Bucket]  →  [Cloud Function]       │", font: "Courier New", size: 18, color: "3FB950" })] }),
            new Paragraph({ children: [new TextRun({ text: "│                                       │                  │", font: "Courier New", size: 18, color: "6E7681" })] }),
            new Paragraph({ children: [new TextRun({ text: "│              ┌────────────────────────┤                  │", font: "Courier New", size: 18, color: "6E7681" })] }),
            new Paragraph({ children: [new TextRun({ text: "│              ↓                        ↓                  │", font: "Courier New", size: 18, color: "6E7681" })] }),
            new Paragraph({ children: [new TextRun({ text: "│  [SynthID Watermark]       [pHash + Vertex Embedding]    │", font: "Courier New", size: 18, color: "FFA657" })] }),
            new Paragraph({ children: [new TextRun({ text: "│              ↓                        ↓                  │", font: "Courier New", size: 18, color: "6E7681" })] }),
            new Paragraph({ children: [new TextRun({ text: "│       [Asset Registry DB]  ←→  [pgvector / Pinecone]     │", font: "Courier New", size: 18, color: "D2A8FF" })] }),
            new Paragraph({ children: [new TextRun({ text: "│                                       ↑                  │", font: "Courier New", size: 18, color: "6E7681" })] }),
            new Paragraph({ children: [new TextRun({ text: "│  [Cloud Scheduler] → [Pub/Sub] → [Crawler Workers]       │", font: "Courier New", size: 18, color: "79C0FF" })] }),
            new Paragraph({ children: [new TextRun({ text: "│       ↑ YouTube API  ↑ Vision Web  ↑ RSS Feeds           │", font: "Courier New", size: 18, color: "6E7681" })] }),
            new Paragraph({ children: [new TextRun({ text: "│                                       ↓                  │", font: "Courier New", size: 18, color: "6E7681" })] }),
            new Paragraph({ children: [new TextRun({ text: "│              [Violations DB]  →  [Dashboard / Alerts]    │", font: "Courier New", size: 18, color: "FF7B72" })] }),
            new Paragraph({ children: [new TextRun({ text: "└──────────────────────────────────────────────────────────┘", font: "Courier New", size: 18, color: "58A6FF" })] }),
          ]
        })]})],
      }),
      spacer(200),

      // ── 3. GOOGLE AI APIS ──
      pageBreak(),
      h1("3. Google AI API Integration"),
      p("The following Google APIs form the intelligence core of DAPS. Each serves a specific detection or protection role."),
      spacer(100),

      h2("3.1 Google SynthID — Invisible Watermarking"),
      infoBox("Purpose", "Embed imperceptible, cryptographically verifiable watermarks into official images and video at ingest time, surviving compression, cropping, and re-encoding."),
      spacer(100),
      p("SynthID, developed by Google DeepMind, embeds watermarks directly into the pixel values or spectrogram of media without perceptible quality loss. The watermark survives common transformations (JPEG compression, resizing, color grading). Verification extracts the watermark signal and produces a confidence score."),
      spacer(100),
      h3("Integration Points"),
      bullet("Triggered on every new asset upload via a Cloud Function."),
      bullet("Watermarked asset replaces the original in GCS and is redistributed as the official copy."),
      bullet("During detection, suspected infringing content can be passed through the SynthID verifier to confirm it originated from the official asset."),
      spacer(100),
      h3("API Usage"),
      code("POST https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/us-central1/publishers/google/models/imagewatermarking:predict"),
      spacer(80),
      wideTable([
        ["Watermark Image", "Pass image bytes + watermarking_config to /predict", "Returns watermarked image bytes"],
        ["Detect Watermark", "Pass suspected image bytes to /predict with action=identify", "Returns {verdict: WATERMARK_DETECTED, confidence: 0.97}"],
        ["Video Watermarking", "Use synthid-video model endpoint (Vertex AI)", "Processes video segment-by-segment"],
      ], ["Action", "Method", "Output"], [2400, 4560, 2400]),
      spacer(100),
      h3("Key Parameters"),
      apiTable([
        ["image_bytes", "base64 string", "Yes", "Base64-encoded image to watermark or verify"],
        ["watermarking_config.watermark_size_preference", "enum", "No", "WATERMARK_SIZE_SMALL | LARGE. Small is less detectable, Large is more robust."],
        ["watermarking_config.attack_type", "enum", "No", "Controls robustness vs. distortion trade-off"],
      ]),
      spacer(200),

      h2("3.2 Google Cloud Vision API — Web Detection"),
      infoBox("Purpose", "Find every public URL on the internet where an image (or visually similar derivative) appears, in a single API call."),
      spacer(100),
      p("The Vision API Web Detection feature is the most powerful tool in this stack for image tracking. Given an input image, it returns: exact URL matches (same image), partial matches (cropped/resized versions), visually similar images, and matching pages. This is equivalent to a reverse image search at API scale."),
      spacer(100),
      h3("Integration Points"),
      bullet("Run against every registered asset periodically (e.g., every 6 hours via Cloud Scheduler)."),
      bullet("Also triggered on-demand when a new asset is registered."),
      bullet("Results are parsed and matched against the asset registry to separate licensed uses from violations."),
      spacer(100),
      h3("API Usage"),
      code("POST https://vision.googleapis.com/v1/images:annotate"),
      spacer(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders,
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: C.codeBg, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ children: [new TextRun({ text: '// Request Body', font: "Courier New", size: 18, color: "6A737D" })] }),
            new Paragraph({ children: [new TextRun({ text: '{', font: "Courier New", size: 18, color: C.dark })] }),
            new Paragraph({ children: [new TextRun({ text: '  "requests": [{', font: "Courier New", size: 18, color: C.dark })] }),
            new Paragraph({ children: [new TextRun({ text: '    "image": { "source": { "imageUri": "gs://bucket/asset.jpg" } },', font: "Courier New", size: 18, color: C.dark })] }),
            new Paragraph({ children: [new TextRun({ text: '    "features": [{ "type": "WEB_DETECTION", "maxResults": 100 }],', font: "Courier New", size: 18, color: C.dark })] }),
            new Paragraph({ children: [new TextRun({ text: '    "imageContext": { "webDetectionParams": {', font: "Courier New", size: 18, color: C.dark })] }),
            new Paragraph({ children: [new TextRun({ text: '      "includeGeoResults": true } }', font: "Courier New", size: 18, color: C.dark })] }),
            new Paragraph({ children: [new TextRun({ text: '  }]', font: "Courier New", size: 18, color: C.dark })] }),
            new Paragraph({ children: [new TextRun({ text: '}', font: "Courier New", size: 18, color: C.dark })] }),
          ]
        })]})],
      }),
      spacer(100),
      h3("Response Fields Used"),
      wideTable([
        ["webDetection.fullMatchingImages", "Array of {url}", "Exact copies — high priority violations"],
        ["webDetection.partialMatchingImages", "Array of {url}", "Cropped / edited versions — medium priority"],
        ["webDetection.visuallySimilarImages", "Array of {url}", "Stylistically similar — low priority, flag for review"],
        ["webDetection.pagesWithMatchingImages", "Array of {url, pageTitle}", "Pages embedding the image — for context"],
        ["webDetection.bestGuessLabels", "Array of {label}", "Used to confirm sports content relevance"],
      ], ["Field", "Type", "DAPS Usage"], [3200, 2400, 3760]),
      spacer(200),

      h2("3.3 Google Video Intelligence API — Video Fingerprinting"),
      infoBox("Purpose", "Analyze video content for shot boundaries, labels, and explicit content; generate segment-level signatures for matching against known assets."),
      spacer(100),
      p("The Video Intelligence API enables DAPS to process discovered video content at scale. It supports shot-change detection (critical for identifying clipped highlights), label detection, and text overlay recognition. Combined with video-level perceptual hashing, it forms the video detection pipeline."),
      spacer(100),
      h3("Features Used"),
      wideTable([
        ["SHOT_CHANGE_DETECTION", "Segments video into shots; each shot is fingerprinted independently, enabling partial clip matching"],
        ["LABEL_DETECTION", "Identifies sports content ('soccer', 'basketball', 'stadium') to filter irrelevant crawled content before expensive matching"],
        ["TEXT_DETECTION", "Extracts on-screen text — useful for detecting official lower-thirds, scoreboard overlays, and watermark text"],
        ["OBJECT_TRACKING", "Tracks team logos and jerseys frame-by-frame for logo-based ownership signals"],
      ], ["Feature", "DAPS Use Case"], [2800, 6560]),
      spacer(100),
      h3("Video Processing Pipeline"),
      numbered("Crawler discovers a new video URL (YouTube or direct MP4)."),
      numbered("Video is submitted to Video Intelligence API for async processing."),
      numbered("Operation result is polled via Cloud Function or Pub/Sub callback."),
      numbered("Each detected shot segment is extracted and perceptually hashed using ffmpeg."),
      numbered("Segment hashes are compared against the registered asset hash library."),
      numbered("Matching segments trigger a Violation record with timestamp, source URL, and confidence score."),
      spacer(200),

      h2("3.4 Vertex AI Multimodal Embeddings — Semantic Similarity"),
      infoBox("Purpose", "Generate dense vector representations of images and video frames that capture semantic content, enabling similarity search even when pixel-level hashing fails due to heavy re-encoding."),
      spacer(100),
      p("Vertex AI's multimodal embedding model (multimodalembedding@001) produces 1408-dimensional vectors for images and video clips. These vectors are stored in a pgvector-enabled Postgres database (Supabase) and queried using approximate nearest neighbor search. This layer catches violations that evade perceptual hashing — e.g., screen recordings, heavy compression, or format conversions."),
      spacer(100),
      h3("API Usage"),
      code("POST https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/us-central1/publishers/google/models/multimodalembedding@001:predict"),
      spacer(80),
      apiTable([
        ["image.bytesBase64Encoded", "string", "Yes (image)", "Base64 image bytes for embedding generation"],
        ["video.bytesBase64Encoded", "string", "Yes (video)", "Base64 video bytes (clips up to 120s)"],
        ["video.startOffsetSec", "number", "No", "Start time for video segment embedding"],
        ["video.endOffsetSec", "number", "No", "End time for video segment embedding"],
        ["dimension", "number", "No", "Output dimension: 128, 256, 512, or 1408 (default)"],
      ]),
      spacer(100),
      h3("Similarity Search Query (pgvector)"),
      code("SELECT asset_id, title, 1 - (embedding <=> $1::vector) AS similarity"),
      code("FROM asset_embeddings"),
      code("WHERE 1 - (embedding <=> $1::vector) > 0.85"),
      code("ORDER BY similarity DESC LIMIT 20;"),
      spacer(200),

      h2("3.5 YouTube Data API v3 — Platform Crawler"),
      infoBox("Purpose", "Search YouTube for recently uploaded videos matching sports organization keywords; extract video metadata and thumbnails for the detection pipeline."),
      spacer(100),
      h3("Endpoints Used"),
      wideTable([
        ["search.list", "Search videos by keyword (e.g., 'IPL highlights 2025', 'Premier League goal'). Filter by publishedAfter, order=date."],
        ["videos.list", "Fetch full metadata: duration, channelId, thumbnails, statistics for flagged videos."],
        ["channels.list", "Check if uploader is a licensed broadcaster — cross-reference against the whitelist."],
      ], ["Endpoint", "Usage"], [2200, 7160]),
      spacer(100),
      h3("Crawler Job Logic"),
      code("// Pseudo-code for YouTube Crawler Worker"),
      code("const keywords = assetRegistry.getKeywords(orgId); // e.g. ['IPL 2025', 'CSK vs MI']"),
      code("for (const kw of keywords) {"),
      code("  const results = await youtube.search.list({ q: kw, type: 'video',"),
      code("    publishedAfter: lastScanTimestamp, maxResults: 50 });"),
      code("  for (const video of results.items) {"),
      code("    const thumb = await fetchThumbnail(video.snippet.thumbnails.maxres.url);"),
      code("    const match = await runDetectionPipeline(thumb, video.id);"),
      code("    if (match.confidence > THRESHOLD) createViolation(video, match);"),
      code("  }"),
      code("}"),
      spacer(200),

      h2("3.6 Supporting Google Services"),
      wideTable([
        ["Google Cloud Storage (GCS)", "Primary storage for original assets, watermarked copies, and thumbnails. Lifecycle rules auto-archive old scans."],
        ["Cloud Functions (Gen 2)", "Event-driven processing: watermark-on-upload, hash-on-upload, crawler-worker invocation."],
        ["Cloud Scheduler", "Cron-based orchestration: triggers crawl jobs every 6h, daily summary digest, weekly full scan."],
        ["Pub/Sub", "Async message queue between crawlers and the detection engine; decouples ingestion from processing."],
        ["Cloud Tasks", "Rate-limited task queue for Vision API calls (1,800 req/min quota management)."],
        ["Gemini 1.5 Pro Vision", "Optional: analyze violation context — generate human-readable violation report, suggest severity level."],
      ], ["Service", "Role in DAPS"], [2800, 6560]),
      spacer(200),

      // ── 4. DATA MODELS ──
      pageBreak(),
      h1("4. Data Models"),
      p("DAPS uses a relational schema (PostgreSQL via Supabase) with a pgvector extension for embedding similarity search. The core tables are Asset, Detection Job, Violation, and Whitelist."),
      spacer(100),

      h2("4.1 Asset (Registered Official Media)"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 1800, 5360],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: {size:2200,type:WidthType.DXA}, shading:{fill:C.dark,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, children:[new Paragraph({children:[new TextRun({text:"Column",font:"Arial",size:20,bold:true,color:"FFFFFF"})]})] }),
            new TableCell({ borders, width: {size:1800,type:WidthType.DXA}, shading:{fill:C.dark,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, children:[new Paragraph({children:[new TextRun({text:"Type",font:"Arial",size:20,bold:true,color:"FFFFFF"})]})] }),
            new TableCell({ borders, width: {size:5360,type:WidthType.DXA}, shading:{fill:C.dark,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, children:[new Paragraph({children:[new TextRun({text:"Notes",font:"Arial",size:20,bold:true,color:"FFFFFF"})]})] }),
          ]}),
          ...([
            ["id", "UUID PK", "Auto-generated asset identifier"],
            ["org_id", "UUID FK", "Owning organization"],
            ["title", "TEXT", "Human-readable asset title"],
            ["asset_type", "ENUM", "image | video | clip"],
            ["gcs_original_url", "TEXT", "GCS path to the original upload"],
            ["gcs_watermarked_url", "TEXT", "GCS path to the SynthID-watermarked version"],
            ["phash", "TEXT", "64-bit perceptual hash (hex string) of the asset"],
            ["embedding", "VECTOR(1408)", "Vertex AI multimodal embedding for similarity search"],
            ["synthid_key", "TEXT", "SynthID watermark key / reference token"],
            ["keywords", "TEXT[]", "Search keywords for crawler targeting (e.g. ['IPL 2025', 'CSK'])"],
            ["licensed_domains", "TEXT[]", "Domains / channels that are authorized to host this asset"],
            ["created_at", "TIMESTAMPTZ", "Registration timestamp"],
            ["metadata", "JSONB", "Extra: duration, resolution, event, match date, etc."],
          ]).map(([col, type, note], i) => new TableRow({ children: [
            new TableCell({ borders, width:{size:2200,type:WidthType.DXA}, shading:{fill:i%2===0?C.light:"FFFFFF",type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, children:[new Paragraph({children:[new TextRun({text:col,font:"Courier New",size:19,color:"0D47A1"})]})] }),
            new TableCell({ borders, width:{size:1800,type:WidthType.DXA}, shading:{fill:i%2===0?C.light:"FFFFFF",type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, children:[new Paragraph({children:[new TextRun({text:type,font:"Arial",size:19,color:C.mid})]})] }),
            new TableCell({ borders, width:{size:5360,type:WidthType.DXA}, shading:{fill:i%2===0?C.light:"FFFFFF",type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, children:[new Paragraph({children:[new TextRun({text:note,font:"Arial",size:19,color:C.dark})]})] }),
          ]}))
        ]
      }),
      spacer(200),

      h2("4.2 Violation"),
      sectionTable([
        ["id", "UUID PK — Violation identifier"],
        ["asset_id", "UUID FK → Asset — Which registered asset was matched"],
        ["source_url", "TEXT — URL where the infringing content was found"],
        ["platform", "ENUM — youtube | twitter | instagram | web | unknown"],
        ["match_type", "ENUM — exact | partial | semantic | watermark_confirmed"],
        ["confidence", "FLOAT — Match score 0.0–1.0"],
        ["status", "ENUM — pending_review | confirmed | licensed | dmca_sent | resolved"],
        ["phash_distance", "INT — Hamming distance between asset and discovered content hashes"],
        ["embedding_similarity", "FLOAT — Cosine similarity score from pgvector query"],
        ["synthid_verdict", "ENUM — detected | not_detected | inconclusive | not_checked"],
        ["screenshot_url", "TEXT — GCS path to captured screenshot of violation page"],
        ["detected_at", "TIMESTAMPTZ — When the violation was first detected"],
        ["metadata", "JSONB — Raw Vision API / Video Intelligence API response snippet"],
      ]),
      spacer(200),

      h2("4.3 Detection Job"),
      sectionTable([
        ["id", "UUID PK"],
        ["asset_id", "UUID FK → Asset — Asset being scanned"],
        ["job_type", "ENUM — web_detection | youtube_crawl | full_scan"],
        ["status", "ENUM — queued | running | completed | failed"],
        ["started_at / completed_at", "TIMESTAMPTZ"],
        ["violations_found", "INT — Count of new violations created by this job"],
        ["api_calls_made", "INT — For quota tracking"],
        ["error_log", "TEXT — Last error if failed"],
      ]),
      spacer(200),

      // ── 5. API SPECIFICATION ──
      pageBreak(),
      h1("5. Backend API Specification"),
      p("DAPS exposes a REST API via Next.js API Routes (or a separate FastAPI service for heavy Python processing). All endpoints require bearer token authentication."),
      spacer(100),

      h2("5.1 Asset Management"),
      h3("POST /api/assets — Register a New Asset"),
      p("Accepts a multipart/form-data upload. Triggers watermarking and fingerprinting pipeline."),
      apiTable([
        ["file", "File", "Yes", "The media file to register (JPEG, PNG, MP4, MOV). Max 500MB."],
        ["title", "string", "Yes", "Human-readable name for the asset"],
        ["keywords", "string[]", "Yes", "Search terms for crawler targeting"],
        ["licensed_domains", "string[]", "No", "Domains/channels authorized to embed this asset"],
        ["metadata", "object", "No", "Event name, match date, tournament, teams"],
      ]),
      spacer(80),
      p("Response (201 Created):"),
      code('{ "asset_id": "uuid", "status": "processing", "estimated_ready_at": "ISO8601" }'),
      spacer(160),

      h3("GET /api/assets — List Registered Assets"),
      apiTable([
        ["org_id", "string", "Yes", "Filter by organization (from auth token)"],
        ["page / limit", "number", "No", "Pagination. Default limit: 20, max: 100"],
        ["asset_type", "string", "No", "Filter: image | video | clip"],
      ]),
      spacer(160),

      h3("GET /api/assets/:id — Get Asset Detail"),
      p("Returns full asset metadata, processing status, watermark status, and linked violation summary."),
      spacer(200),

      h2("5.2 Detection"),
      h3("POST /api/detect/web — Trigger Web Detection Scan"),
      apiTable([
        ["asset_id", "string", "Yes", "UUID of the asset to scan"],
        ["force", "boolean", "No", "Re-scan even if scanned within cooldown period (default 6h)"],
      ]),
      spacer(80),
      p("Enqueues a Cloud Task for Vision API Web Detection and Video Intelligence. Returns job_id for polling."),
      spacer(160),

      h3("POST /api/detect/verify — SynthID Verify"),
      p("Accepts a suspected infringing image/video and runs SynthID verification against all registered assets."),
      apiTable([
        ["file", "File", "Yes (or url)", "Media to verify — uploaded directly"],
        ["url", "string", "Yes (or file)", "Public URL of the suspected content"],
        ["asset_id", "string", "No", "If known, verify against a specific asset only"],
      ]),
      spacer(80),
      code('{ "verdict": "WATERMARK_DETECTED", "confidence": 0.97, "matched_asset_id": "uuid" }'),
      spacer(200),

      h2("5.3 Violations"),
      h3("GET /api/violations — List Violations"),
      apiTable([
        ["status", "string", "No", "Filter by status: pending_review | confirmed | resolved"],
        ["platform", "string", "No", "Filter by platform: youtube | web | instagram"],
        ["asset_id", "string", "No", "Filter violations for a specific asset"],
        ["confidence_min", "number", "No", "Minimum confidence threshold (0.0–1.0). Default: 0.75"],
        ["from / to", "ISO8601", "No", "Date range filter"],
      ]),
      spacer(160),

      h3("PATCH /api/violations/:id — Update Violation Status"),
      apiTable([
        ["status", "string", "Yes", "New status: confirmed | licensed | dmca_sent | resolved"],
        ["note", "string", "No", "Internal note for audit trail"],
      ]),
      spacer(160),

      h3("POST /api/violations/:id/takedown — Initiate DMCA Takedown"),
      p("Generates a pre-filled DMCA takedown notice PDF and (if integrated) submits via the YouTube Content ID / Google Content Removal API. Returns notice document URL."),
      spacer(200),

      h2("5.4 Stats & Dashboard"),
      h3("GET /api/stats/summary — Organization Dashboard Summary"),
      p("Returns aggregate stats for the dashboard header cards:"),
      code('{ "total_assets": 42, "scans_today": 180, "violations_open": 7,'),
      code('  "violations_resolved_this_week": 23, "platforms_monitored": ["youtube","web"],'),
      code('  "top_violated_asset": { "id": "...", "title": "...", "violation_count": 15 } }'),
      spacer(200),

      // ── 6. DETECTION ENGINE ──
      pageBreak(),
      h1("6. Detection Engine Deep Dive"),
      p("The detection engine is the technical core of DAPS. It runs a multi-stage pipeline that escalates from cheap/fast checks to expensive/accurate checks."),
      spacer(100),

      h2("6.1 Pipeline Stages"),
      wideTable([
        ["Stage 1", "Label Filter", "Video Intelligence LABEL_DETECTION", "< $0.001", "Discard non-sports content immediately"],
        ["Stage 2", "Perceptual Hash Match", "pHash comparison (Hamming distance ≤ 10)", "Free (local)", "Fast exact/near-exact image matching"],
        ["Stage 3", "Web Detection", "Vision API WEB_DETECTION", "$0.0015/image", "Find all URLs hosting the asset"],
        ["Stage 4", "Semantic Embedding", "Vertex AI multimodalembedding@001", "$0.002/image", "Catch heavy re-encodes and screen-grabs"],
        ["Stage 5", "Watermark Verification", "SynthID verification endpoint", "$0.003/image", "Cryptographic proof for confirmed violations"],
        ["Stage 6", "Context Analysis", "Gemini 1.5 Pro Vision (optional)", "$0.01/call", "Explain violation, suggest severity, draft notice"],
      ], ["Stage", "Name", "API / Method", "Cost/Unit", "Purpose"], [700, 1600, 2800, 1200, 3060]),
      spacer(160),

      h2("6.2 Confidence Scoring"),
      p("Each detection run produces a composite confidence score (0.0–1.0) from the contributing signals:"),
      sectionTable([
        ["Watermark Detected (SynthID)", "≥ 0.95 regardless of other signals — treated as proof"],
        ["pHash Hamming Distance = 0", "+0.90 to composite score"],
        ["pHash Hamming Distance 1–10", "+0.70 to composite score"],
        ["Vision API fullMatchingImages", "+0.85 to composite score"],
        ["Vision API partialMatchingImages", "+0.60 to composite score"],
        ["Embedding Cosine Similarity ≥ 0.92", "+0.80 to composite score"],
        ["Embedding Cosine Similarity 0.85–0.92", "+0.55 to composite score"],
        ["Domain not in licensed_domains", "+0.20 penalty bonus (increases violation score)"],
      ]),
      spacer(160),

      h2("6.3 Violation Thresholds"),
      wideTable([
        ["< 0.50", "Ignored", "Not stored — below noise floor"],
        ["0.50 – 0.74", "Low", "Logged for review — requires human confirmation"],
        ["0.75 – 0.89", "Medium", "Auto-flagged as pending_review — sends dashboard notification"],
        ["0.90 – 0.94", "High", "Auto-confirmed violation — rights holder alerted via email/webhook"],
        ["≥ 0.95 or SynthID detected", "Critical", "Auto-confirmed + DMCA notice generation triggered"],
      ], ["Confidence", "Severity", "Automated Action"], [1600, 1400, 6360]),
      spacer(200),

      // ── 7. FRONTEND DASHBOARD ──
      pageBreak(),
      h1("7. Frontend Dashboard (Next.js)"),
      p("The dashboard is a Next.js 14 App Router application using TypeScript, Tailwind CSS, and shadcn/ui. It provides the rights holder with full visibility into their asset library and detected violations."),
      spacer(100),

      h2("7.1 Core Pages & Screens"),
      wideTable([
        ["/dashboard", "Overview", "Summary KPI cards: assets registered, active scans, open violations, violations resolved. Real-time activity feed."],
        ["/assets", "Asset Library", "Grid/list of registered assets. Status badges: Processing / Active / Paused. Quick-scan button."],
        ["/assets/new", "Register Asset", "Multi-step upload wizard: Upload file → Set keywords → Configure licensed domains → Confirm."],
        ["/assets/:id", "Asset Detail", "Asset preview, watermark status, fingerprint info, violation history timeline."],
        ["/violations", "Violation Feed", "Filterable table: platform, severity, status, date. Thumbnail preview column. Bulk actions."],
        ["/violations/:id", "Violation Detail", "Side-by-side: original vs. infringing content. Confidence breakdown. Action panel: Mark Licensed / Send DMCA / Resolve."],
        ["/scans", "Scan History", "Log of all detection job runs with quota usage, API calls, violations found per scan."],
        ["/settings", "Settings", "Organization profile, API key management, licensed domain whitelist, notification webhooks."],
      ], ["Route", "Screen", "Description"], [1800, 1800, 5760]),
      spacer(200),

      h2("7.2 Key UI Components"),
      bullet("ViolationCard — Shows thumbnail, platform badge, confidence meter, severity pill, and quick-action buttons."),
      bullet("AssetStatusBadge — Processing / Active / Scanning / Error states with animated indicators."),
      bullet("ConfidenceBreakdown — Expandable detail showing which signals contributed to the score (pHash, embedding, SynthID, web detection)."),
      bullet("ScanTimeline — Visual timeline of when scans ran and how many violations were found."),
      bullet("PlatformDistributionChart — Recharts donut chart showing violation breakdown by platform."),
      bullet("RealtimeActivityFeed — Supabase Realtime subscription showing new violations as they arrive."),
      spacer(200),

      h2("7.3 Real-time Updates"),
      p("DAPS uses Supabase Realtime (Postgres changes via websocket) to push violation notifications to the dashboard without polling. When a crawler worker writes a new row to the violations table, the dashboard receives it within ~500ms and inserts it into the feed."),
      code("// Next.js client component"),
      code("const channel = supabase.channel('violations')"),
      code("  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violations',"),
      code("    filter: `org_id=eq.${orgId}` }, (payload) => {"),
      code("    setViolations(prev => [payload.new, ...prev]);"),
      code("    toast.error(`New violation detected on ${payload.new.platform}`);"),
      code("  }).subscribe();"),
      spacer(200),

      // ── 8. TECH STACK ──
      pageBreak(),
      h1("8. Full Tech Stack"),
      wideTable([
        ["Frontend", "Next.js 14 (App Router)", "TypeScript", "React Server Components + client islands"],
        ["Styling", "Tailwind CSS", "shadcn/ui", "Consistent, accessible component library"],
        ["Database", "PostgreSQL (Supabase)", "pgvector extension", "Relational data + vector similarity search"],
        ["File Storage", "Google Cloud Storage", "Signed URLs", "Original assets, watermarked copies, screenshots"],
        ["Auth", "Supabase Auth", "JWT", "Organization-scoped access control"],
        ["Serverless", "Cloud Functions Gen 2", "Node.js 20", "Event-driven watermarking, hashing, crawling"],
        ["Queue", "Google Pub/Sub", "Cloud Tasks", "Async crawl orchestration, rate limiting"],
        ["Scheduler", "Cloud Scheduler", "Cron", "Periodic crawl jobs (every 6h default)"],
        ["Perceptual Hash", "sharp + blockhash-js", "Node.js", "Fast local image hashing before API calls"],
        ["Video Processing", "ffmpeg (Cloud Function)", "WASM", "Frame extraction, segment hashing for video pipeline"],
        ["Monitoring", "Google Cloud Monitoring", "Datadog (opt)", "API quota tracking, error rates, job latencies"],
        ["Deployment", "Vercel (Next.js)", "Google Cloud Run", "Frontend on Vercel; workers on Cloud Run"],
      ], ["Layer", "Primary", "Secondary", "Notes"], [1400, 2200, 2000, 3760]),
      spacer(200),

      // ── 9. MVP SCOPE ──
      pageBreak(),
      h1("9. Hackathon MVP Scope & Build Plan"),
      p("This section defines the minimal viable build to demonstrate all core capabilities within a hackathon timeline."),
      spacer(100),

      h2("9.1 In-Scope for MVP"),
      bullet("Asset upload (image + video) with SynthID watermarking."),
      bullet("Perceptual hash generation on upload using sharp."),
      bullet("Vertex AI embedding generation for uploaded assets."),
      bullet("On-demand web detection scan via Vision API for images."),
      bullet("YouTube crawler for one set of configured keywords."),
      bullet("Violation matching using pHash + embedding similarity."),
      bullet("Dashboard: asset list, violation feed, violation detail with confidence breakdown."),
      bullet("Supabase Realtime for live violation notifications in the dashboard."),
      bullet("SynthID verification endpoint (verify a suspect image against registry)."),
      spacer(100),

      h2("9.2 Out of Scope for MVP (Post-Hackathon)"),
      bullet("Automated DMCA filing (show UI, generate PDF, manual submission)."),
      bullet("Twitter/Instagram/TikTok crawlers (start with YouTube only)."),
      bullet("Video-level SynthID watermarking (image SynthID first, video later)."),
      bullet("Multi-organization support (single org, single admin for demo)."),
      bullet("Historical scan analytics beyond last 30 days."),
      spacer(100),

      h2("9.3 Build Phases"),
      wideTable([
        ["Phase 1", "Infra Setup", "GCS bucket, Supabase project + pgvector, Cloud project, API keys for all Google services. Environment variables configured."],
        ["Phase 2", "Ingestion Pipeline", "Upload endpoint → GCS → SynthID watermark → pHash → Vertex embedding → DB insert. Test with sample sports images."],
        ["Phase 3", "Detection Engine", "Vision API web detection job, YouTube crawler worker, pHash + embedding matcher, violation writer."],
        ["Phase 4", "Dashboard", "Next.js app: asset library, violation feed, violation detail, Supabase Realtime integration."],
        ["Phase 5", "SynthID Verify Demo", "Upload-a-URL / drag-and-drop verify screen. Runs watermark check and shows verdict."],
        ["Phase 6", "Polish + Demo", "Seed with real sports media examples, record demo flow, prepare presentation slides."],
      ], ["Phase", "Name", "Deliverables"], [900, 1800, 6660]),
      spacer(200),

      // ── 10. ENVIRONMENT SETUP ──
      pageBreak(),
      h1("10. Environment & API Key Setup"),
      h2("10.1 Required API Credentials"),
      sectionTable([
        ["GOOGLE_CLOUD_PROJECT_ID", "Your GCP project ID"],
        ["GOOGLE_APPLICATION_CREDENTIALS", "Path to service account JSON key file (or Workload Identity in prod)"],
        ["VISION_API_KEY", "Google Cloud Vision API key (or use ADC)"],
        ["VERTEX_AI_LOCATION", "GCP region, e.g. us-central1"],
        ["YOUTUBE_API_KEY", "YouTube Data API v3 key from Google Cloud Console"],
        ["GCS_BUCKET_NAME", "Your Cloud Storage bucket for media assets"],
        ["SUPABASE_URL", "Your Supabase project URL"],
        ["SUPABASE_ANON_KEY", "Supabase public anon key"],
        ["SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key (server-side only)"],
        ["SYNTHID_ENDPOINT", "Vertex AI model endpoint for SynthID"],
      ]),
      spacer(100),

      h2("10.2 GCP APIs to Enable"),
      bullet("Cloud Vision API"),
      bullet("Video Intelligence API"),
      bullet("Vertex AI API"),
      bullet("Cloud Storage API"),
      bullet("Cloud Functions API"),
      bullet("Cloud Pub/Sub API"),
      bullet("Cloud Scheduler API"),
      bullet("Cloud Tasks API"),
      bullet("YouTube Data API v3"),
      spacer(100),

      h2("10.3 Supabase Schema Bootstrap"),
      code("-- Enable pgvector"),
      code("CREATE EXTENSION IF NOT EXISTS vector;"),
      code(""),
      code("-- Assets table"),
      code("CREATE TABLE assets ("),
      code("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      code("  org_id UUID NOT NULL,"),
      code("  title TEXT NOT NULL,"),
      code("  asset_type TEXT CHECK (asset_type IN ('image','video','clip')),"),
      code("  gcs_original_url TEXT,"),
      code("  gcs_watermarked_url TEXT,"),
      code("  phash TEXT,"),
      code("  embedding VECTOR(1408),"),
      code("  synthid_key TEXT,"),
      code("  keywords TEXT[],"),
      code("  licensed_domains TEXT[],"),
      code("  created_at TIMESTAMPTZ DEFAULT NOW(),"),
      code("  metadata JSONB"),
      code(");"),
      code(""),
      code("-- Violations table"),
      code("CREATE TABLE violations ("),
      code("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      code("  asset_id UUID REFERENCES assets(id),"),
      code("  source_url TEXT,"),
      code("  platform TEXT,"),
      code("  match_type TEXT,"),
      code("  confidence FLOAT,"),
      code("  status TEXT DEFAULT 'pending_review',"),
      code("  phash_distance INT,"),
      code("  embedding_similarity FLOAT,"),
      code("  synthid_verdict TEXT,"),
      code("  screenshot_url TEXT,"),
      code("  detected_at TIMESTAMPTZ DEFAULT NOW(),"),
      code("  metadata JSONB"),
      code(");"),
      code(""),
      code("-- Vector similarity index"),
      code("CREATE INDEX ON assets USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);"),
      spacer(200),

      // ── 11. COST ESTIMATES ──
      pageBreak(),
      h1("11. API Cost Estimates (Hackathon Scale)"),
      p("All estimates are approximate based on Google Cloud pricing as of Q1 2025. The hackathon demo scale assumes a small asset library (~50 assets) with daily crawls."),
      spacer(100),
      wideTable([
        ["Vision API — Web Detection", "50 assets × 4 scans/day", "$0.0035/image", "~$0.70/day"],
        ["Vertex AI — Embedding (text+image)", "200 calls/day (assets + discoveries)", "$0.002/call", "~$0.40/day"],
        ["Video Intelligence API", "20 videos/day × avg 5 min", "$0.10/min", "~$10/day"],
        ["SynthID Watermarking", "50 new assets", "$0.003/image", "~$0.15 one-time"],
        ["YouTube Data API v3", "5 crawls/day, 50 results each", "Free (10k units/day quota)", "$0"],
        ["Cloud Functions", "1000 invocations/day", "Free tier (2M/month)", "$0"],
        ["Cloud Storage", "50GB storage + egress", "$0.02/GB storage", "<$2/month"],
        ["Supabase", "Free tier (500MB DB, 1GB storage)", "Free", "$0"],
      ], ["Service", "Volume Estimate", "Unit Price", "Est. Daily Cost"], [2800, 2400, 1800, 2360]),
      spacer(100),
      p("Total estimated daily cost for MVP demo: ~$11–13/day, primarily driven by Video Intelligence API. For image-only demo mode, cost drops to <$1.50/day."),
      spacer(200),

      // ── 12. KEY RISKS ──
      pageBreak(),
      h1("12. Key Risks & Mitigations"),
      wideTable([
        ["SynthID API access", "SynthID may require allowlist access via Google DeepMind. Apply early or use watermark simulation for demo.", "High", "Apply via Google AI Early Access program"],
        ["Video Intelligence quota", "Video Intelligence API has per-minute billing and default quotas. Heavy crawling can exhaust budget quickly.", "Medium", "Implement label filtering (Stage 1) to avoid processing non-sports content"],
        ["pHash false positives", "Completely different images can hash similarly. Rely on multi-signal scoring, not pHash alone.", "Medium", "Multi-stage pipeline — pHash is only Stage 2; embedding is the decider"],
        ["YouTube API rate limits", "YouTube Data API v3 has 10,000 units/day free quota. search.list costs 100 units per call.", "Medium", "Limit to 80 searches/day max; use publishedAfter filter to avoid re-scanning old content"],
        ["SynthID watermark detection rate", "Watermarks may not survive heavy re-encoding (e.g., screen recording). Embedding similarity handles this fallback.", "Low", "Multi-signal architecture means no single point of failure"],
      ], ["Risk", "Description", "Likelihood", "Mitigation"], [1800, 3600, 1200, 2760]),
      spacer(200),

      // ── APPENDIX ──
      pageBreak(),
      h1("Appendix: Useful References"),
      sectionTable([
        ["SynthID Documentation", "https://deepmind.google/technologies/synthid/"],
        ["Vision API Web Detection Guide", "https://cloud.google.com/vision/docs/detecting-web"],
        ["Video Intelligence API Docs", "https://cloud.google.com/video-intelligence/docs"],
        ["Vertex AI Multimodal Embeddings", "https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-multimodal-embeddings"],
        ["YouTube Data API v3 Reference", "https://developers.google.com/youtube/v3/docs"],
        ["pgvector Documentation", "https://github.com/pgvector/pgvector"],
        ["Supabase pgvector Guide", "https://supabase.com/docs/guides/ai/vector-columns"],
        ["shadcn/ui Components", "https://ui.shadcn.com"],
        ["GCS Node.js Client", "https://cloud.google.com/storage/docs/reference/libraries#client-libraries-usage-nodejs"],
      ]),
      spacer(200),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.border, space: 8 } },
        children: [new TextRun({ text: "End of Document  |  Digital Asset Protection System  |  Technical Specification v1.0", font: "Arial", size: 18, color: C.mid, italics: true })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("./DAPS_TechSpec.docx", buf);
  console.log("Done");
});