/**
 * The Supabase project address, cleaned up. People often paste the "API URL"
 * that ends in /rest/v1 or has a trailing slash; Supabase only wants
 * https://<project>.supabase.co, so strip anything after that.
 */
export function supabaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  return raw.replace(/\/+$/, "").replace(/\/(rest|auth)\/v1.*$/, "");
}
