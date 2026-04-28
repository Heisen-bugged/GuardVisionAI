import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  try {
    await pb.collection('_superusers').authWithPassword('admin@example.com', 'password123');
    console.log('Auth successful');
    // Get assets collection to see its ID
    const assetsCol = await pb.collections.getOne('assets');
    console.log('Assets collection ID:', assetsCol.id);

    // Get violations collection to see its schema
    const violationsCol = await pb.collections.getOne('violations');
    console.log('Violations collection schema:', JSON.stringify(violationsCol.schema, null, 2));

    // Try a relational filter
    const records = await pb.collection('violations').getList(1, 1, { filter: 'asset_id.org_id="demo-org-123"' });
    console.log('List successful:', records);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
