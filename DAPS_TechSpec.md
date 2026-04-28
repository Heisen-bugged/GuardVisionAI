**TECHNICAL SPECIFICATION**

**Digital Asset Protection System**

*Protecting the Integrity of Digital Sports Media*

+-----------------------------------------------------------------------+
| **Hackathon Prototype MVP**                                           |
|                                                                       |
| Google AI APIs \| Next.js \| Cloud Infrastructure                     |
+-----------------------------------------------------------------------+

Version 1.0 \| April 2025

**1. Executive Summary**

The Digital Asset Protection System (DAPS) is a scalable platform that
enables sports organizations to register, watermark, and continuously
monitor their official digital media assets across the open internet.
Built on Google Cloud AI infrastructure, the system combines invisible
watermarking, perceptual fingerprinting, web-scale content detection,
and a real-time alerting dashboard.

The MVP targets three core capabilities:

-   Asset Registration: Ingest official media, embed invisible
    watermarks via Google SynthID, generate perceptual fingerprints, and
    store in a tamper-evident registry.

-   Detection Engine: Continuously scan the internet and major platforms
    for content that matches registered fingerprints using Google Vision
    AI Web Detection, Video Intelligence API, and Vertex AI multimodal
    embeddings.

-   Ops Dashboard: A Next.js-powered control center for rights holders
    to review detections, triage violations, and initiate takedowns in
    near real-time.

  --------------------------- -------------------------------------------
  **Target User**             **Role**

  Sports organizations,       Primary rights holders managing official
  broadcast rights holders,   media libraries
  leagues                     

  Legal / IP enforcement      Teams acting on takedown notices and
  teams                       violations

  Platform operations teams   Internal ops monitoring content propagation
  --------------------------- -------------------------------------------

**2. System Architecture Overview**

DAPS is structured into four primary layers: Ingestion, Detection,
Monitoring, and Presentation. Google Cloud provides the backbone for all
AI inference, storage, and queuing.

**2.1 Architecture Layers**

  ---------------- ------------------------- ----------------------------
  **Layer**        **Components**            **Responsibility**

  Ingestion Layer  Next.js upload UI, GCS    Accepts new media, triggers
                   bucket, Cloud Functions   watermarking and fingerprint
                                             jobs

  Processing Layer SynthID API, Vision AI,   Embeds watermarks, generates
                   Video Intelligence,       hashes and embeddings
                   Vertex AI                 

  Detection Layer  Cloud Scheduler, Pub/Sub, Periodically crawls
                   Crawler Workers           web/platforms, scores
                                             matches

  Presentation     Next.js Dashboard,        Displays violations, stats,
  Layer            PocketBase (SSE           takedown workflows
                   Realtime)                 
  ---------------- ------------------------- ----------------------------

**2.2 High-Level Data Flow**

1.  Rights holder uploads official media asset via the Dashboard.

2.  Cloud Function triggers: SynthID watermarks the asset; perceptual
    hash + Vertex embedding are computed.

3.  Asset metadata, hash, and embedding are stored in PocketBase
    (SQLite) + a pgvector-compatible sidecar or native JSON vector
    field for similarity search.

4.  Scheduled crawler jobs pull media from YouTube API, Google Image
    Search, and RSS feeds.

5.  Each discovered piece of media is fingerprinted and compared against
    the registry using vector similarity search.

6.  Matches above a configurable confidence threshold are written to the
    Violations table and surfaced in the dashboard with real-time
    notifications.

7.  Rights holder reviews violation, can trigger a DMCA takedown or mark
    as licensed.

**2.3 Component Diagram (Text Representation)**

+-----------------------------------------------------------------------+
| ┌──────────────────────────────────────────────────────────┐          |
|                                                                       |
| │ DAPS System Architecture │                                          |
|                                                                       |
| ├──────────────────────────────────────────────────────────┤          |
|                                                                       |
| │ \[Upload UI\] → \[GCS Bucket\] → \[Cloud Function\] │               |
|                                                                       |
| │ │ │                                                                 |
|                                                                       |
| │ ┌────────────────────────┤ │                                        |
|                                                                       |
| │ ↓ ↓ │                                                               |
|                                                                       |
| │ \[SynthID Watermark\] \[pHash + Vertex Embedding\] │                |
|                                                                       |
| │ ↓ ↓ │                                                               |
|                                                                       |
| │ \[Asset Registry DB\] ←→ \[pgvector / Pinecone\] │                  |
|                                                                       |
| │ ↑ │                                                                 |
|                                                                       |
| │ \[Cloud Scheduler\] → \[Pub/Sub\] → \[Crawler Workers\] │           |
|                                                                       |
| │ ↑ YouTube API ↑ Vision Web ↑ RSS Feeds │                            |
|                                                                       |
| │ ↓ │                                                                 |
|                                                                       |
| │ \[Violations DB\] → \[Dashboard / Alerts\] │                        |
|                                                                       |
| └──────────────────────────────────────────────────────────┘          |
+-----------------------------------------------------------------------+

**3. Google AI API Integration**

The following Google APIs form the intelligence core of DAPS. Each
serves a specific detection or protection role.

**3.1 Google SynthID --- Invisible Watermarking**

  ------------- ---------------------------------------------------------
  **Purpose**   Embed imperceptible, cryptographically verifiable
                watermarks into official images and video at ingest time,
                surviving compression, cropping, and re-encoding.

  ------------- ---------------------------------------------------------

SynthID, developed by Google DeepMind, embeds watermarks directly into
the pixel values or spectrogram of media without perceptible quality
loss. The watermark survives common transformations (JPEG compression,
resizing, color grading). Verification extracts the watermark signal and
produces a confidence score.

**Integration Points**

-   Triggered on every new asset upload via a Cloud Function.

-   Watermarked asset replaces the original in GCS and is redistributed
    as the official copy.

-   During detection, suspected infringing content can be passed through
    the SynthID verifier to confirm it originated from the official
    asset.

**API Usage**

\> POST (image)
\> https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/us-central1/publishers/google/models/imagewatermarking:predict

\> POST (video)
\> https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/us-central1/publishers/google/models/synthid-video:predict

  ----------------------- ---------------------------------- ---------------------
  **Action**              **Method**                         **Output**

  Watermark Image         Pass image bytes +                 Returns watermarked
                          watermarking_config to /predict    image bytes

  Detect Image Watermark  Pass suspected image bytes to      Returns {verdict:
                          /predict with action=identify      WATERMARK_DETECTED,
                                                             confidence: 0.97}

  Watermark Video         Pass video bytes/GCS URI to        Returns watermarked
                          synthid-video:predict              video bytes or GCS
                                                             output path

  Detect Video Watermark  Pass suspected video bytes/URI to  Returns {verdict:
                          synthid-video:predict with         WATERMARK_DETECTED,
                          action=identify                    confidence: 0.95,
                                                             segments: [...]}
  ----------------------- ---------------------------------- ---------------------

**Key Parameters**

  ----------------------------------------------- ---------- -------------- ------------------------------------
  **Parameter**                                   **Type**   **Required**   **Description**

  image_bytes                                     base64     Yes (image)    Base64-encoded image to watermark or
                                                  string                    verify

  video_uri                                       string     Yes (video)    GCS URI of the video to watermark or
                                                                            verify (gs://bucket/video.mp4)

  video_bytes                                     base64     Alt. to        Base64-encoded video bytes (short
                                                  string     video_uri      clips; prefer GCS URI for large files)

  watermarking_config.watermark_size_preference   enum       No             WATERMARK_SIZE_SMALL \| LARGE. Small
                                                                            is less detectable, Large is more
                                                                            robust.

  watermarking_config.attack_type                 enum       No             Controls robustness vs. distortion
                                                                            trade-off (applies to both image and
                                                                            video)

  segment_duration_secs                           number     No (video)     Duration of each video segment to
                                                                            watermark independently (default: 5s)
  ----------------------------------------------- ---------- -------------- ------------------------------------

**3.2 Google Cloud Vision API --- Web Detection**

  ------------- ---------------------------------------------------------
  **Purpose**   Find every public URL on the internet where an image (or
                visually similar derivative) appears, in a single API
                call.

  ------------- ---------------------------------------------------------

The Vision API Web Detection feature is the most powerful tool in this
stack for image tracking. Given an input image, it returns: exact URL
matches (same image), partial matches (cropped/resized versions),
visually similar images, and matching pages. This is equivalent to a
reverse image search at API scale.

**Integration Points**

-   Run against every registered asset periodically (e.g., every 6 hours
    via Cloud Scheduler).

-   Also triggered on-demand when a new asset is registered.

-   Results are parsed and matched against the asset registry to
    separate licensed uses from violations.

**API Usage**

> POST https://vision.googleapis.com/v1/images:annotate

+-----------------------------------------------------------------------+
| // Request Body                                                       |
|                                                                       |
| {                                                                     |
|                                                                       |
| \"requests\": \[{                                                     |
|                                                                       |
| \"image\": { \"source\": { \"imageUri\": \"gs://bucket/asset.jpg\" }  |
| },                                                                    |
|                                                                       |
| \"features\": \[{ \"type\": \"WEB_DETECTION\", \"maxResults\": 100    |
| }\],                                                                  |
|                                                                       |
| \"imageContext\": { \"webDetectionParams\": {                         |
|                                                                       |
| \"includeGeoResults\": true } }                                       |
|                                                                       |
| }\]                                                                   |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**Response Fields Used**

  -------------------------------------- ------------------ ----------------------------
  **Field**                              **Type**           **DAPS Usage**

  webDetection.fullMatchingImages        Array of {url}     Exact copies --- high
                                                            priority violations

  webDetection.partialMatchingImages     Array of {url}     Cropped / edited versions
                                                            --- medium priority

  webDetection.visuallySimilarImages     Array of {url}     Stylistically similar ---
                                                            low priority, flag for
                                                            review

  webDetection.pagesWithMatchingImages   Array of {url,     Pages embedding the image
                                         pageTitle}         --- for context

  webDetection.bestGuessLabels           Array of {label}   Used to confirm sports
                                                            content relevance
  -------------------------------------- ------------------ ----------------------------

**3.3 Google Video Intelligence API --- Video Fingerprinting**

  ------------- ---------------------------------------------------------
  **Purpose**   Analyze video content for shot boundaries, labels, and
                explicit content; generate segment-level signatures for
                matching against known assets.

  ------------- ---------------------------------------------------------

The Video Intelligence API enables DAPS to process discovered video
content at scale. It supports shot-change detection (critical for
identifying clipped highlights), label detection, and text overlay
recognition. Combined with video-level perceptual hashing, it forms the
video detection pipeline.

**Features Used**

  ----------------------- -------------------------------------------------
  **Feature**             **DAPS Use Case**

  SHOT_CHANGE_DETECTION   Segments video into shots; each shot is
                          fingerprinted independently, enabling partial
                          clip matching

  LABEL_DETECTION         Identifies sports content (\'soccer\',
                          \'basketball\', \'stadium\') to filter irrelevant
                          crawled content before expensive matching

  TEXT_DETECTION          Extracts on-screen text --- useful for detecting
                          official lower-thirds, scoreboard overlays, and
                          watermark text

  OBJECT_TRACKING         Tracks team logos and jerseys frame-by-frame for
                          logo-based ownership signals
  ----------------------- -------------------------------------------------

**Video Processing Pipeline**

8.  Crawler discovers a new video URL (YouTube or direct MP4).

9.  Video is submitted to Video Intelligence API for async processing.

10. Operation result is polled via Cloud Function or Pub/Sub callback.

11. Each detected shot segment is extracted and perceptually hashed
    using ffmpeg.

12. Segment hashes are compared against the registered asset hash
    library.

13. Matching segments trigger a Violation record with timestamp, source
    URL, and confidence score.

**3.4 Vertex AI Multimodal Embeddings --- Semantic Similarity**

  ------------- ---------------------------------------------------------
  **Purpose**   Generate dense vector representations of images and video
                frames that capture semantic content, enabling similarity
                search even when pixel-level hashing fails due to heavy
                re-encoding.

  ------------- ---------------------------------------------------------

Vertex AI\'s multimodal embedding model (multimodalembedding@001)
produces 1408-dimensional vectors for images and video clips. These
vectors are stored as JSON arrays in PocketBase (SQLite) and queried
by a lightweight cosine-similarity worker that reads the vectors and
ranks candidates in-process. For larger deployments, the worker can
dump vectors to a pgvector sidecar. This layer catches violations that
evade perceptual hashing --- e.g., screen recordings, heavy
compression, or format conversions.

**API Usage**

> POST
> https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/us-central1/publishers/google/models/multimodalembedding@001:predict

  -------------------------- ---------- -------------- ------------------------------------
  **Parameter**              **Type**   **Required**   **Description**

  image.bytesBase64Encoded   string     Yes (image)    Base64 image bytes for embedding
                                                       generation

  video.bytesBase64Encoded   string     Yes (video)    Base64 video bytes (clips up to
                                                       120s)

  video.startOffsetSec       number     No             Start time for video segment
                                                       embedding

  video.endOffsetSec         number     No             End time for video segment embedding

  dimension                  number     No             Output dimension: 128, 256, 512, or
                                                       1408 (default)
  -------------------------- ---------- -------------- ------------------------------------

**Similarity Search Query (pgvector)**

> SELECT asset_id, title, 1 - (embedding \<=\> \$1::vector) AS
> similarity
>
> FROM asset_embeddings
>
> WHERE 1 - (embedding \<=\> \$1::vector) \> 0.85
>
> ORDER BY similarity DESC LIMIT 20;

**3.5 YouTube Data API v3 --- Platform Crawler**

  ------------- ---------------------------------------------------------
  **Purpose**   Search YouTube for recently uploaded videos matching
                sports organization keywords; extract video metadata and
                thumbnails for the detection pipeline.

  ------------- ---------------------------------------------------------

**Endpoints Used**

  ---------------- ------------------------------------------------------
  **Endpoint**     **Usage**

  search.list      Search videos by keyword (e.g., \'IPL highlights
                   2025\', \'Premier League goal\'). Filter by
                   publishedAfter, order=date.

  videos.list      Fetch full metadata: duration, channelId, thumbnails,
                   statistics for flagged videos.

  channels.list    Check if uploader is a licensed broadcaster ---
                   cross-reference against the whitelist.
  ---------------- ------------------------------------------------------

**Crawler Job Logic**

> // Pseudo-code for YouTube Crawler Worker
>
> const keywords = assetRegistry.getKeywords(orgId); // e.g. \[\'IPL
> 2025\', \'CSK vs MI\'\]
>
> for (const kw of keywords) {
>
> const results = await youtube.search.list({ q: kw, type: \'video\',
>
> publishedAfter: lastScanTimestamp, maxResults: 50 });
>
> for (const video of results.items) {
>
> const thumb = await
> fetchThumbnail(video.snippet.thumbnails.maxres.url);
>
> const match = await runDetectionPipeline(thumb, video.id);
>
> if (match.confidence \> THRESHOLD) createViolation(video, match);
>
> }
>
> }

**3.6 Supporting Google Services**

  --------------------- -------------------------------------------------
  **Service**           **Role in DAPS**

  Google Cloud Storage  Primary storage for original assets, watermarked
  (GCS)                 copies, and thumbnails. Lifecycle rules
                        auto-archive old scans.

  Cloud Functions (Gen  Event-driven processing: watermark-on-upload,
  2)                    hash-on-upload, crawler-worker invocation.

  Cloud Scheduler       Cron-based orchestration: triggers crawl jobs
                        every 6h, daily summary digest, weekly full scan.

  Pub/Sub               Async message queue between crawlers and the
                        detection engine; decouples ingestion from
                        processing.

  Cloud Tasks           Rate-limited task queue for Vision API calls
                        (1,800 req/min quota management).

  Gemini 1.5 Pro Vision Optional: analyze violation context --- generate
                        human-readable violation report, suggest severity
                        level.
  --------------------- -------------------------------------------------

**4. Data Models**

DAPS uses PocketBase as its primary datastore. PocketBase runs as a
single self-hosted Go binary, exposing a SQLite-backed REST/realtime
API with built-in auth. The core **collections** (analogous to SQL
tables) are Asset, Violation, and Detection Job. Embeddings are stored
as JSON text fields and processed by a Node.js similarity worker.

**4.1 Asset (Registered Official Media)**

  --------------------- -------------- ----------------------------------------
  **Column**            **Type**       **Notes**

  id                    UUID PK        Auto-generated asset identifier

  org_id                UUID FK        Owning organization

  title                 TEXT           Human-readable asset title

  asset_type            ENUM           image \| video \| clip

  gcs_original_url      TEXT           GCS path to the original upload

  gcs_watermarked_url   TEXT           GCS path to the SynthID-watermarked
                                       version

  phash                 TEXT           64-bit perceptual hash (hex string) of
                                       the asset

  embedding             VECTOR(1408)   Vertex AI multimodal embedding for
                                       similarity search

  synthid_key           TEXT           SynthID watermark key / reference token

  keywords              TEXT\[\]       Search keywords for crawler targeting
                                       (e.g. \[\'IPL 2025\', \'CSK\'\])

  licensed_domains      TEXT\[\]       Domains / channels that are authorized
                                       to host this asset

  created_at            TIMESTAMPTZ    Registration timestamp

  metadata              JSONB          Extra: duration, resolution, event,
                                       match date, etc.
  --------------------- -------------- ----------------------------------------

**4.2 Violation**

  -------------------------- ------------------------------------------------
  **id**                     UUID PK --- Violation identifier

  **asset_id**               UUID FK → Asset --- Which registered asset was
                             matched

  **source_url**             TEXT --- URL where the infringing content was
                             found

  **platform**               ENUM --- youtube \| twitter \| instagram \| web
                             \| unknown

  **match_type**             ENUM --- exact \| partial \| semantic \|
                             watermark_confirmed

  **confidence**             FLOAT --- Match score 0.0--1.0

  **status**                 ENUM --- pending_review \| confirmed \| licensed
                             \| dmca_sent \| resolved

  **phash_distance**         INT --- Hamming distance between asset and
                             discovered content hashes

  **embedding_similarity**   FLOAT --- Cosine similarity score from pgvector
                             query

  **synthid_verdict**        ENUM --- detected \| not_detected \|
                             inconclusive \| not_checked

  **screenshot_url**         TEXT --- GCS path to captured screenshot of
                             violation page

  **detected_at**            TIMESTAMPTZ --- When the violation was first
                             detected

  **metadata**               JSONB --- Raw Vision API / Video Intelligence
                             API response snippet
  -------------------------- ------------------------------------------------

**4.3 Detection Job**

  ---------------------- ------------------------------------------------
  **id**                 UUID PK

  **asset_id**           UUID FK → Asset --- Asset being scanned

  **job_type**           ENUM --- web_detection \| youtube_crawl \|
                         full_scan

  **status**             ENUM --- queued \| running \| completed \|
                         failed

  **started_at /         TIMESTAMPTZ
  completed_at**         

  **violations_found**   INT --- Count of new violations created by this
                         job

  **api_calls_made**     INT --- For quota tracking

  **error_log**          TEXT --- Last error if failed
  ---------------------- ------------------------------------------------

**5. Backend API Specification**

DAPS exposes a REST API via Next.js API Routes (or a separate FastAPI
service for heavy Python processing). All endpoints require bearer token
authentication.

**5.1 Asset Management**

**POST /api/assets --- Register a New Asset**

Accepts a multipart/form-data upload. Triggers watermarking and
fingerprinting pipeline.

  ------------------ ------------ -------------- ------------------------------------
  **Parameter**      **Type**     **Required**   **Description**

  file               File         **Yes**        The media file to register (JPEG,
                                                 PNG, MP4, MOV). Max 500MB.

  title              string       **Yes**        Human-readable name for the asset

  keywords           string\[\]   **Yes**        Search terms for crawler targeting

  licensed_domains   string\[\]   No             Domains/channels authorized to embed
                                                 this asset

  metadata           object       No             Event name, match date, tournament,
                                                 teams
  ------------------ ------------ -------------- ------------------------------------

Response (201 Created):

> { \"asset_id\": \"uuid\", \"status\": \"processing\",
> \"estimated_ready_at\": \"ISO8601\" }

**GET /api/assets --- List Registered Assets**

  --------------- ---------- -------------- ------------------------------------
  **Parameter**   **Type**   **Required**   **Description**

  org_id          string     **Yes**        Filter by organization (from auth
                                            token)

  page / limit    number     No             Pagination. Default limit: 20, max:
                                            100

  asset_type      string     No             Filter: image \| video \| clip
  --------------- ---------- -------------- ------------------------------------

**GET /api/assets/:id --- Get Asset Detail**

Returns full asset metadata, processing status, watermark status, and
linked violation summary.

**5.2 Detection**

**POST /api/detect/web --- Trigger Web Detection Scan**

  --------------- ---------- -------------- ------------------------------------
  **Parameter**   **Type**   **Required**   **Description**

  asset_id        string     **Yes**        UUID of the asset to scan

  force           boolean    No             Re-scan even if scanned within
                                            cooldown period (default 6h)
  --------------- ---------- -------------- ------------------------------------

Enqueues a Cloud Task for Vision API Web Detection and Video
Intelligence. Returns job_id for polling.

**POST /api/detect/verify --- SynthID Verify**

Accepts a suspected infringing image/video and runs SynthID verification
against all registered assets.

  --------------- ---------- -------------- ------------------------------------
  **Parameter**   **Type**   **Required**   **Description**

  file            File       Yes (or url)   Media to verify --- uploaded
                                            directly

  url             string     Yes (or file)  Public URL of the suspected content

  asset_id        string     No             If known, verify against a specific
                                            asset only
  --------------- ---------- -------------- ------------------------------------

> { \"verdict\": \"WATERMARK_DETECTED\", \"confidence\": 0.97,
> \"matched_asset_id\": \"uuid\" }

**5.3 Violations**

**GET /api/violations --- List Violations**

  ---------------- ---------- -------------- ------------------------------------
  **Parameter**    **Type**   **Required**   **Description**

  status           string     No             Filter by status: pending_review \|
                                             confirmed \| resolved

  platform         string     No             Filter by platform: youtube \| web
                                             \| instagram

  asset_id         string     No             Filter violations for a specific
                                             asset

  confidence_min   number     No             Minimum confidence threshold
                                             (0.0--1.0). Default: 0.75

  from / to        ISO8601    No             Date range filter
  ---------------- ---------- -------------- ------------------------------------

**PATCH /api/violations/:id --- Update Violation Status**

  --------------- ---------- -------------- ------------------------------------
  **Parameter**   **Type**   **Required**   **Description**

  status          string     **Yes**        New status: confirmed \| licensed \|
                                            dmca_sent \| resolved

  note            string     No             Internal note for audit trail
  --------------- ---------- -------------- ------------------------------------

**POST /api/violations/:id/takedown --- Initiate DMCA Takedown**

Generates a pre-filled DMCA takedown notice PDF and (if integrated)
submits via the YouTube Content ID / Google Content Removal API. Returns
notice document URL.

**5.4 Stats & Dashboard**

**GET /api/stats/summary --- Organization Dashboard Summary**

Returns aggregate stats for the dashboard header cards:

> { \"total_assets\": 42, \"scans_today\": 180, \"violations_open\": 7,
>
> \"violations_resolved_this_week\": 23, \"platforms_monitored\":
> \[\"youtube\",\"web\"\],
>
> \"top_violated_asset\": { \"id\": \"\...\", \"title\": \"\...\",
> \"violation_count\": 15 } }

**6. Detection Engine Deep Dive**

The detection engine is the technical core of DAPS. It runs a
multi-stage pipeline that escalates from cheap/fast checks to
expensive/accurate checks.

**6.1 Pipeline Stages**

  ----------- -------------- ------------------------- ---------------- -----------------------
  **Stage**   **Name**       **API / Method**          **Cost/Unit**    **Purpose**

  Stage 1     Label Filter   Video Intelligence        \< \$0.001       Discard non-sports
                             LABEL_DETECTION                            content immediately

  Stage 2     Perceptual     pHash comparison (Hamming Free (local)     Fast exact/near-exact
              Hash Match     distance ≤ 10)                             image matching

  Stage 3     Web Detection  Vision API WEB_DETECTION  \$0.0015/image   Find all URLs hosting
                                                                        the asset

  Stage 4     Semantic       Vertex AI                 \$0.002/image    Catch heavy re-encodes
              Embedding      multimodalembedding@001                    and screen-grabs

  Stage 5     Watermark      SynthID verification      \$0.003/image;   Cryptographic proof for
              Verification   endpoint (image +         \$0.01/min       confirmed violations;
                             video)                    (video)          video checked
                                                                        segment-by-segment

  Stage 6     Context        Gemini 1.5 Pro Vision     \$0.01/call      Explain violation,
              Analysis       (optional)                                 suggest severity, draft
                                                                        notice
  ----------- -------------- ------------------------- ---------------- -----------------------

**6.2 Confidence Scoring**

Each detection run produces a composite confidence score (0.0--1.0) from
the contributing signals:

  ------------------------- ------------------------------------------------
  **Watermark Detected      ≥ 0.95 regardless of other signals --- treated
  (SynthID)**               as proof

  **pHash Hamming Distance  +0.90 to composite score
  = 0**                     

  **pHash Hamming Distance  +0.70 to composite score
  1--10**                   

  **Vision API              +0.85 to composite score
  fullMatchingImages**      

  **Vision API              +0.60 to composite score
  partialMatchingImages**   

  **Embedding Cosine        +0.80 to composite score
  Similarity ≥ 0.92**       

  **Embedding Cosine        +0.55 to composite score
  Similarity 0.85--0.92**   

  **Domain not in           +0.20 penalty bonus (increases violation score)
  licensed_domains**        
  ------------------------- ------------------------------------------------

**6.3 Violation Thresholds**

  ---------------- -------------- ------------------------------------------------
  **Confidence**   **Severity**   **Automated Action**

  \< 0.50          Ignored        Not stored --- below noise floor

  0.50 -- 0.74     Low            Logged for review --- requires human
                                  confirmation

  0.75 -- 0.89     Medium         Auto-flagged as pending_review --- sends
                                  dashboard notification

  0.90 -- 0.94     High           Auto-confirmed violation --- rights holder
                                  alerted via email/webhook

  ≥ 0.95 or        Critical       Auto-confirmed + DMCA notice generation
  SynthID detected                triggered
  ---------------- -------------- ------------------------------------------------

**7. Frontend Dashboard (Next.js)**

The dashboard is a Next.js 14 App Router application using TypeScript,
Tailwind CSS, and shadcn/ui. It provides the rights holder with full
visibility into their asset library and detected violations.

**7.1 Core Pages & Screens**

  ----------------- ------------- -------------------------------------------
  **Route**         **Screen**    **Description**

  /dashboard        Overview      Summary KPI cards: assets registered,
                                  active scans, open violations, violations
                                  resolved. Real-time activity feed.

  /assets           Asset Library Grid/list of registered assets. Status
                                  badges: Processing / Active / Paused.
                                  Quick-scan button.

  /assets/new       Register      Multi-step upload wizard: Upload file → Set
                    Asset         keywords → Configure licensed domains →
                                  Confirm.

  /assets/:id       Asset Detail  Asset preview, watermark status,
                                  fingerprint info, violation history
                                  timeline.

  /violations       Violation     Filterable table: platform, severity,
                    Feed          status, date. Thumbnail preview column.
                                  Bulk actions.

  /violations/:id   Violation     Side-by-side: original vs. infringing
                    Detail        content. Confidence breakdown. Action
                                  panel: Mark Licensed / Send DMCA / Resolve.

  /scans            Scan History  Log of all detection job runs with quota
                                  usage, API calls, violations found per
                                  scan.

  /settings         Settings      Organization profile, API key management,
                                  licensed domain whitelist, notification
                                  webhooks.
  ----------------- ------------- -------------------------------------------

**7.2 Key UI Components**

-   ViolationCard --- Shows thumbnail, platform badge, confidence meter,
    severity pill, and quick-action buttons.

-   AssetStatusBadge --- Processing / Active / Scanning / Error states
    with animated indicators.

-   ConfidenceBreakdown --- Expandable detail showing which signals
    contributed to the score (pHash, embedding, SynthID, web detection).

-   ScanTimeline --- Visual timeline of when scans ran and how many
    violations were found.

-   PlatformDistributionChart --- Recharts donut chart showing violation
    breakdown by platform.

-   RealtimeActivityFeed --- PocketBase SSE subscription showing new
    violations as they arrive.

**7.3 Real-time Updates**

DAPS uses PocketBase\'s built-in SSE (Server-Sent Events) realtime
API to push violation notifications to the dashboard without polling.
When a crawler worker creates a new record in the violations collection,
the dashboard receives the event within \~200--500ms and inserts it into
the feed.

\> // Next.js client component (PocketBase JS SDK)
\>
\> import PocketBase from \'pocketbase\';
\>
\> const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
\>
\> pb.collection(\'violations\').subscribe(\'*\', (e) =\> {
\>
\>   if (e.action === \'create\' \&\& e.record.org_id === orgId) {
\>
\>     setViolations(prev =\> \[e.record, ...prev\]);
\>
\>     toast.error(\`New violation detected on \${e.record.platform}\`);
\>
\>   }
\>
\> });

**8. Full Tech Stack**

  ------------ ---------------- --------------- ----------------------------
  **Layer**    **Primary**      **Secondary**   **Notes**

  Frontend     Next.js 14 (App  TypeScript      React Server Components +
               Router)                          client islands

  Styling      Tailwind CSS     shadcn/ui       Consistent, accessible
                                                component library

  Database /   PocketBase       SQLite          Self-hosted Go binary;
  Backend      (Go + SQLite)                    built-in REST, realtime
                                                SSE, and admin UI

  File Storage Google Cloud     Signed URLs /   Original assets, watermarked
               Storage          PocketBase      copies, screenshots
                                file API        

  Auth         PocketBase Auth  JWT             Built-in email/password +
                                                OAuth2; org-scoped access
                                                via collection rules

  Vector       Cosine-sim       pgvector        In-process JS worker reads
  Search       worker (Node)    sidecar (opt)   JSON embedding fields;
                                                pgvector for scale-out

  Serverless   Cloud Functions  Node.js 20      Event-driven watermarking,
               Gen 2                            hashing, crawling

  Queue        Google Pub/Sub   Cloud Tasks     Async crawl orchestration,
                                                rate limiting

  Scheduler    Cloud Scheduler  Cron            Periodic crawl jobs (every
                                                6h default)

  Perceptual   sharp +          Node.js         Fast local image hashing
  Hash         blockhash-js                     before API calls

  Video        ffmpeg (Cloud    WASM            Frame extraction, segment
  Processing   Function)                        hashing for video pipeline

  Monitoring   Google Cloud     Datadog (opt)   API quota tracking, error
               Monitoring                       rates, job latencies

  Deployment   Vercel (Next.js) Google Cloud    Frontend on Vercel; PocketBase
                                Run             + workers on Cloud Run
  ------------ ---------------- --------------- ----------------------------

**9. Hackathon MVP Scope & Build Plan**

This section defines the minimal viable build to demonstrate all core
capabilities within a hackathon timeline.

**9.1 In-Scope for MVP**

-   Asset upload (image + video) with SynthID watermarking.

-   Perceptual hash generation on upload using sharp.

-   Vertex AI embedding generation for uploaded assets.

-   On-demand web detection scan via Vision API for images.

-   YouTube crawler for one set of configured keywords.

-   Violation matching using pHash + embedding similarity.

-   Dashboard: asset list, violation feed, violation detail with
    confidence breakdown.

-   PocketBase SSE Realtime for live violation notifications in the dashboard.

-   SynthID verification endpoint (verify a suspect image **or video**
    against registry; both imagewatermarking and synthid-video endpoints).

**9.2 Out of Scope for MVP (Post-Hackathon)**

-   Automated DMCA filing (show UI, generate PDF, manual submission).

-   Twitter/Instagram/TikTok crawlers (start with YouTube only).

-   Automated DMCA filing for video-only violations (handled together with image flow in MVP).

-   Multi-organization support (single org, single admin for demo).

-   Historical scan analytics beyond last 30 days.

**9.3 Build Phases**

  ----------- ------------- --------------------------------------------------
  **Phase**   **Name**      **Deliverables**

  Phase 1     Infra Setup   GCS bucket, PocketBase instance (Docker / Cloud
                            Run), collections created, API keys for all
                            Google services. Environment variables configured.

  Phase 2     Ingestion     Upload endpoint → GCS → SynthID watermark → pHash
              Pipeline      → Vertex embedding → PocketBase record insert.
                            Test with sample sports images.

  Phase 3     Detection     Vision API web detection job, YouTube crawler
              Engine        worker, pHash + cosine-similarity matcher,
                            violation writer to PocketBase.

  Phase 4     Dashboard     Next.js app: asset library, violation feed,
                            violation detail, PocketBase SSE realtime feed.

  Phase 5     SynthID       Upload-a-URL / drag-and-drop verify screen. Runs
              Verify Demo   watermark check and shows verdict.

  Phase 6     Polish + Demo Seed with real sports media examples, record demo
                            flow, prepare presentation slides.
  ----------- ------------- --------------------------------------------------

**10. Environment & API Key Setup**

**10.1 Required API Credentials**

  ------------------------------------ ------------------------------------------------
  **GOOGLE_CLOUD_PROJECT_ID**          Your GCP project ID

  **GOOGLE_APPLICATION_CREDENTIALS**   Path to service account JSON key file (or
                                       Workload Identity in prod)

  **VISION_API_KEY**                   Google Cloud Vision API key (or use ADC)

  **VERTEX_AI_LOCATION**               GCP region, e.g. us-central1

  **YOUTUBE_API_KEY**                  YouTube Data API v3 key from Google Cloud
                                       Console

  **GCS_BUCKET_NAME**                  Your Cloud Storage bucket for media assets

  **POCKETBASE_URL**                   Base URL of your PocketBase instance
                                       (e.g. https://pb.yourdomain.com or
                                       http://localhost:8090 for local dev)

  **POCKETBASE_ADMIN_EMAIL**           PocketBase superuser e-mail (server-side
                                       admin SDK authentication)

  **POCKETBASE_ADMIN_PASSWORD**        PocketBase superuser password (server-side
                                       only, never exposed to the client)

  **NEXT_PUBLIC_POCKETBASE_URL**       Public URL used by the Next.js browser
                                       client for SSE realtime subscriptions

  **SYNTHID_ENDPOINT**                 Vertex AI model endpoint for SynthID
  ------------------------------------ ------------------------------------------------

**10.2 GCP APIs to Enable**

-   Cloud Vision API

-   Video Intelligence API

-   Vertex AI API

-   Cloud Storage API

-   Cloud Functions API

-   Cloud Pub/Sub API

-   Cloud Scheduler API

-   Cloud Tasks API

-   YouTube Data API v3

**10.3 PocketBase Collections Bootstrap**

PocketBase collections are created via the Admin UI or the JS Admin
SDK on first boot. The snippet below uses the PocketBase JS SDK in
admin mode (run once as a seed script).

\> // seed-pb.mjs --- run with: node seed-pb.mjs
\>
\> import PocketBase from \'pocketbase\';
\>
\> const pb = new PocketBase(process.env.POCKETBASE_URL);
\>
\> await pb.admins.authWithPassword(
\>
\>   process.env.POCKETBASE_ADMIN_EMAIL,
\>
\>   process.env.POCKETBASE_ADMIN_PASSWORD
\>
\> );
\>
\> // --- assets collection ---
\>
\> await pb.collections.create({
\>
\>   name: \'assets\', type: \'base\',
\>
\>   schema: [
\>
\>     { name: \'org_id\',              type: \'text\',   required: true },
\>
\>     { name: \'title\',               type: \'text\',   required: true },
\>
\>     { name: \'asset_type\',          type: \'select\', options: { values: [\'image\',\'video\',\'clip\'] } },
\>
\>     { name: \'gcs_original_url\',    type: \'url\'   },
\>
\>     { name: \'gcs_watermarked_url\', type: \'url\'   },
\>
\>     { name: \'phash\',               type: \'text\'  },
\>
\>     { name: \'embedding\',           type: \'json\'  },  // stores float[] as JSON
\>
\>     { name: \'synthid_key\',         type: \'text\'  },
\>
\>     { name: \'keywords\',            type: \'json\'  },  // string[]
\>
\>     { name: \'licensed_domains\',    type: \'json\'  },  // string[]
\>
\>     { name: \'metadata\',            type: \'json\'  },
\>
\>   ]
\>
\> });
\>
\> // --- violations collection ---
\>
\> await pb.collections.create({
\>
\>   name: \'violations\', type: \'base\',
\>
\>   schema: [
\>
\>     { name: \'asset_id\',             type: \'relation\', options: { collectionId: \'assets\', maxSelect: 1 } },
\>
\>     { name: \'source_url\',           type: \'url\'   },
\>
\>     { name: \'platform\',             type: \'select\', options: { values: [\'youtube\',\'twitter\',\'instagram\',\'web\',\'unknown\'] } },
\>
\>     { name: \'match_type\',           type: \'select\', options: { values: [\'exact\',\'partial\',\'semantic\',\'watermark_confirmed\'] } },
\>
\>     { name: \'confidence\',           type: \'number\'  },
\>
\>     { name: \'status\',               type: \'select\', options: { values: [\'pending_review\',\'confirmed\',\'licensed\',\'dmca_sent\',\'resolved\'] } },
\>
\>     { name: \'phash_distance\',       type: \'number\'  },
\>
\>     { name: \'embedding_similarity\', type: \'number\'  },
\>
\>     { name: \'synthid_verdict\',      type: \'select\', options: { values: [\'detected\',\'not_detected\',\'inconclusive\',\'not_checked\'] } },
\>
\>     { name: \'screenshot_url\',       type: \'url\'   },
\>
\>     { name: \'metadata\',             type: \'json\'  },
\>
\>   ]
\>
\> });
\>
\> // --- detection_jobs collection ---
\>
\> await pb.collections.create({
\>
\>   name: \'detection_jobs\', type: \'base\',
\>
\>   schema: [
\>
\>     { name: \'asset_id\',         type: \'relation\', options: { collectionId: \'assets\', maxSelect: 1 } },
\>
\>     { name: \'job_type\',         type: \'select\', options: { values: [\'web_detection\',\'youtube_crawl\',\'full_scan\'] } },
\>
\>     { name: \'status\',          type: \'select\', options: { values: [\'queued\',\'running\',\'completed\',\'failed\'] } },
\>
\>     { name: \'started_at\',      type: \'text\'   },
\>
\>     { name: \'completed_at\',    type: \'text\'   },
\>
\>     { name: \'violations_found\',type: \'number\'  },
\>
\>     { name: \'api_calls_made\',  type: \'number\'  },
\>
\>     { name: \'error_log\',       type: \'text\'   },
\>
\>   ]
\>
\> });
\>
\> console.log(\'PocketBase collections bootstrapped.\');

**11. API Cost Estimates (Hackathon Scale)**

All estimates are approximate based on Google Cloud pricing as of Q1
2025. The hackathon demo scale assumes a small asset library (\~50
assets) with daily crawls.

  --------------------- ------------------ ---------------- -----------------
  **Service**           **Volume           **Unit Price**   **Est. Daily
                        Estimate**                          Cost**

  Vision API --- Web    50 assets × 4      \$0.0035/image   \~\$0.70/day
  Detection             scans/day                           

  Vertex AI ---         200 calls/day      \$0.002/call     \~\$0.40/day
  Embedding             (assets +                           
  (text+image)          discoveries)                        

  Video Intelligence    20 videos/day ×    \$0.10/min       \~\$10/day
  API                   avg 5 min                           

  SynthID Watermarking  50 images + 10     \$0.003/image;   \~\$0.65 one-time
  (image + video)       videos (avg 2      \$0.01/min       (images \$0.15 +
                        min each)          (video)          video \$0.50)

  YouTube Data API v3   5 crawls/day, 50   Free (10k        \$0
                        results each       units/day quota) 

  Cloud Functions       1000               Free tier        \$0
                        invocations/day    (2M/month)       

  Cloud Storage         50GB storage +     \$0.02/GB        \<\$2/month
                        egress             storage          

  PocketBase            Self-hosted on     Free (open       \$0 (Cloud Run
                        Cloud Run (0.25    source)          free tier covers
                        vCPU / 256 MB)                      demo scale)
  --------------------- ------------------ ---------------- -----------------

Total estimated daily cost for MVP demo: \~\$11--13/day, primarily
driven by Video Intelligence API. For image-only demo mode, cost drops
to \<\$1.50/day.

**12. Key Risks & Mitigations**

  -------------- --------------------------- ---------------- --------------------
  **Risk**       **Description**             **Likelihood**   **Mitigation**

  SynthID API    SynthID may require         High             Apply via Google AI
  access         allowlist access via Google                  Early Access program
                 DeepMind. Apply early or                     
                 use watermark simulation                     
                 for demo.                                    

  Video          Video Intelligence API has  Medium           Implement label
  Intelligence   per-minute billing and                       filtering (Stage 1)
  quota          default quotas. Heavy                        to avoid processing
                 crawling can exhaust budget                  non-sports content
                 quickly.                                     

  pHash false    Completely different images Medium           Multi-stage pipeline
  positives      can hash similarly. Rely on                  --- pHash is only
                 multi-signal scoring, not                    Stage 2; embedding
                 pHash alone.                                 is the decider

  YouTube API    YouTube Data API v3 has     Medium           Limit to 80
  rate limits    10,000 units/day free                        searches/day max;
                 quota. search.list costs                     use publishedAfter
                 100 units per call.                          filter to avoid
                                                              re-scanning old
                                                              content

  SynthID        Watermarks may not survive  Low              Multi-signal
  watermark      heavy re-encoding (e.g.,                     architecture means
  detection rate screen recording).                           no single point of
                 Embedding similarity                         failure
                 handles this fallback.                       
  -------------- --------------------------- ---------------- --------------------

**Appendix: Useful References**

  ---------------------- --------------------------------------------------------------------------------------------
  **SynthID              https://deepmind.google/technologies/synthid/
  Documentation**        

  **Vision API Web       https://cloud.google.com/vision/docs/detecting-web
  Detection Guide**      

  **Video Intelligence   https://cloud.google.com/video-intelligence/docs
  API Docs**             

  **Vertex AI Multimodal https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-multimodal-embeddings
  Embeddings**           

  **YouTube Data API v3  https://developers.google.com/youtube/v3/docs
  Reference**            

  **PocketBase Docs**    https://pocketbase.io/docs/

  **PocketBase JS SDK**  https://github.com/pocketbase/js-sdk

  **PocketBase           https://pocketbase.io/docs/collections/
  Collections Guide**    

  **PocketBase Realtime  https://pocketbase.io/docs/api-realtime/
  (SSE) API**            

  **shadcn/ui            https://ui.shadcn.com
  Components**           

  **GCS Node.js Client** https://cloud.google.com/storage/docs/reference/libraries#client-libraries-usage-nodejs
  ---------------------- --------------------------------------------------------------------------------------------

*End of Document \| Digital Asset Protection System \| Technical
Specification v1.0*
