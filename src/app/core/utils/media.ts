import { environment } from '../../../environments/environment';

/**
 * Turns a backend media path into a browser-loadable URL.
 * Uploaded files come back as a relative path (e.g. "/uploads/image/2026/06/x.png")
 * served by the API (UseStaticFiles), but the SPA runs on a different origin (:4200),
 * so we prefix it with the API origin (derived from environment.apiUrl, minus "/api").
 * Absolute URLs (http/https) are returned as-is; empty/null → null.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = environment.apiUrl.replace(/\/api\/?$/, '');
  return origin + (path.startsWith('/') ? path : '/' + path);
}
