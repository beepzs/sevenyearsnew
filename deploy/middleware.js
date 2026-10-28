// Password gate for the client review build (HTTP Basic Auth, runs before every request).
// Credentials come from Vercel env vars REVIEW_USER / REVIEW_PASSWORD. If they are not set, access is denied.
import { next } from '@vercel/functions';

export const config = { matcher: '/:path*' };

const deny = () =>
  new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="The First Seven Years - client review", charset="UTF-8"', 'Cache-Control': 'no-store' },
  });

// compare without early exit
const same = (a, b) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export default function middleware(request) {
  const user = process.env.REVIEW_USER || 'client';
  const pass = process.env.REVIEW_PASSWORD;
  if (!pass) return deny();

  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Basic ')) return deny();
  let decoded = '';
  try { decoded = atob(auth.slice(6)); } catch { return deny(); }
  const i = decoded.indexOf(':');
  if (i < 0 || !same(decoded.slice(0, i), user) || !same(decoded.slice(i + 1), pass)) return deny();

  return next({ headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
}
