import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

// Server-side only admin client
export async function getAdminClient() {
  const adminPb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
  
  if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
    try {
      await adminPb.collection('_superusers').authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
    } catch (err) {
      console.error('PocketBase Auth Error:', err);
    }
  }
  
  return adminPb;
}
