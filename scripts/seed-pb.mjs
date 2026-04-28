import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function main() {
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );

  try {
    // --- assets collection ---
    await pb.collections.create({
      name: 'assets',
      type: 'base',
      fields: [
        { name: 'org_id',              type: 'text',   required: true },
        { name: 'title',               type: 'text',   required: true },
        { name: 'asset_type',          type: 'select', options: { maxSelect: 1, values: ['image','video','clip'] } },
        { name: 'original_file',       type: 'file',   options: { maxSelect: 1, maxSize: 524288000 } },
        { name: 'watermarked_file',    type: 'file',   options: { maxSelect: 1, maxSize: 524288000 } },
        { name: 'gcs_original_url',    type: 'url'   }, // Keeping for backwards compatibility
        { name: 'gcs_watermarked_url', type: 'url'   }, // Keeping for backwards compatibility
        { name: 'phash',               type: 'text'  },
        { name: 'embedding',           type: 'json'  },  // stores float[] as JSON
        { name: 'synthid_key',         type: 'text'  },
        { name: 'keywords',            type: 'json'  },  // string[]
        { name: 'licensed_domains',    type: 'json'  },  // string[]
        { name: 'metadata',            type: 'json'  },
      ]
    });
    console.log('assets collection created.');
  } catch (err) {
    console.log('assets collection might already exist.', err.message);
  }

  try {
    // --- violations collection ---
    await pb.collections.create({
      name: 'violations',
      type: 'base',
      fields: [
        { name: 'asset_id',             type: 'relation', options: { collectionId: 'assets', maxSelect: 1 } },
        { name: 'source_url',           type: 'url'   },
        { name: 'platform',             type: 'select', options: { maxSelect: 1, values: ['youtube','twitter','instagram','web','unknown'] } },
        { name: 'match_type',           type: 'select', options: { maxSelect: 1, values: ['exact','partial','semantic','watermark_confirmed'] } },
        { name: 'confidence',           type: 'number'  },
        { name: 'status',               type: 'select', options: { maxSelect: 1, values: ['pending_review','confirmed','licensed','dmca_sent','resolved'] } },
        { name: 'phash_distance',       type: 'number'  },
        { name: 'embedding_similarity', type: 'number'  },
        { name: 'synthid_verdict',      type: 'select', options: { maxSelect: 1, values: ['detected','not_detected','inconclusive','not_checked'] } },
        { name: 'screenshot_url',       type: 'url'   },
        { name: 'metadata',             type: 'json'  },
      ]
    });
    console.log('violations collection created.');
  } catch (err) {
    console.log('violations collection might already exist.', err.message);
  }

  try {
    // --- detection_jobs collection ---
    await pb.collections.create({
      name: 'detection_jobs',
      type: 'base',
      fields: [
        { name: 'asset_id',         type: 'relation', options: { collectionId: 'assets', maxSelect: 1 } },
        { name: 'job_type',         type: 'select', options: { maxSelect: 1, values: ['web_detection','youtube_crawl','full_scan'] } },
        { name: 'status',          type: 'select', options: { maxSelect: 1, values: ['queued','running','completed','failed'] } },
        { name: 'started_at',      type: 'text'   },
        { name: 'completed_at',    type: 'text'   },
        { name: 'violations_found',type: 'number'  },
        { name: 'api_calls_made',  type: 'number'  },
        { name: 'error_log',       type: 'text'   },
      ]
    });
    console.log('detection_jobs collection created.');
  } catch (err) {
    console.log('detection_jobs collection might already exist.', err.message);
  }

  console.log('PocketBase collections bootstrapped.');
}

main().catch(console.error);
