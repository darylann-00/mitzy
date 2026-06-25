export const sanitize = (str) =>
  str ? String(str).replace(/[\r\n\t]/g, ' ').replace(/[^\x20-\x7E]/g, '').trim() : str;

export const sanitizeZip = (zip) =>
  zip ? String(zip).replace(/\D/g, '').slice(0, 10) : zip;

const THIS_YEAR = new Date().getFullYear();
export const getAge = (birthYear) => birthYear ? THIS_YEAR - parseInt(birthYear, 10) : null;

export async function hashShort(s) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).slice(0, 4)
      .map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'nohash';
  }
}

export function buildProfileContext(profile) {
  if (!profile || typeof profile !== 'object') return 'No profile context.';
  const zip = sanitizeZip(profile.zip);
  const region = sanitize(profile.region);
  const carStr = Array.isArray(profile.cars) && profile.cars.length
    ? profile.cars.map(sanitize).filter(Boolean).join(', ') : '';
  const kidsStr = Array.isArray(profile.kids) && profile.kids.length
    ? profile.kids.map(k => `${sanitize(k?.name) || 'child'} age ${getAge(k?.birthYear) ?? '?'}`).join(', ') : '';
  const petsStr = Array.isArray(profile.pets) && profile.pets.length
    ? profile.pets.map(p => `${sanitize(p?.name) || 'pet'} (${sanitize(p?.type) || 'pet'}, age ${getAge(p?.birthYear) ?? '?'})`).join(', ') : '';
  const age = getAge(profile.birthYear);

  const parts = [];
  if (zip)     parts.push(`zip ${zip}`);
  if (region)  parts.push(`climate region: ${region}`);
  if (age)     parts.push(`user age ${age}`);
  if (carStr)  parts.push(`vehicles: ${carStr}`);
  if (kidsStr) parts.push(`kids: ${kidsStr}`);
  if (petsStr) parts.push(`pets: ${petsStr}`);
  return parts.length ? parts.join('; ') : 'No profile context.';
}

export function corsHeaders(req) {
  const allowed = process.env.ALLOWED_ORIGIN || '';
  const origin  = req.headers.get('origin') || '';
  const match   = allowed && origin === allowed ? origin : null;
  return {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Vary': 'Origin',
    ...(match ? { 'Access-Control-Allow-Origin': match } : {}),
  };
}
