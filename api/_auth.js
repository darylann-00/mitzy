export const config = { runtime: "edge" };

export async function requireUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^bearer\s+/i, '');

  if (!token) {
    return { error: new Response('Unauthorized', { status: 401 }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: new Response('Server misconfigured', { status: 500 }) };
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { error: new Response('Unauthorized', { status: 401 }) };
    }

    const data = await res.json();
    return { userId: data.id };
  } catch {
    return { error: new Response('Unauthorized', { status: 401 }) };
  }
}
