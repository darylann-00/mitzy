import { createClient } from '@supabase/supabase-js';

// Deletes leftover "+pw-<uuid>" auth users created by tests/e2e/helpers/auth.js.
// Runs as a Playwright globalTeardown so prod Supabase auth doesn't accumulate
// one throwaway user per CI run/worker forever.
export default async function cleanupTestUsers() {
  const supabaseUrl    = process.env.VITE_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceRoleKey) return;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.warn(`cleanupTestUsers: listUsers failed: ${error.message}`);
      return;
    }

    const stale = data.users.filter(u => u.email?.includes('+pw-'));
    await Promise.all(stale.map(u => admin.auth.admin.deleteUser(u.id).catch(err => {
      console.warn(`cleanupTestUsers: failed to delete ${u.email}: ${err.message}`);
    })));

    if (data.users.length < perPage) break;
    page += 1;
  }
}
