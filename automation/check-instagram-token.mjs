const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const apiVersion = process.env.INSTAGRAM_API_VERSION || "v23.0";

if (!token) throw new Error("INSTAGRAM_ACCESS_TOKEN is missing.");

const url = new URL(`https://graph.instagram.com/${apiVersion}/me`);
url.searchParams.set("fields", "user_id,username");
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});
const payload = await response.json().catch(() => ({}));

if (!response.ok || payload.error) {
  const message = payload.error?.message || `HTTP ${response.status}`;
  const code = payload.error?.code ? ` (code ${payload.error.code})` : "";
  throw new Error(`Instagram token check failed${code}: ${message}`);
}

if (!(payload.user_id || payload.id)) {
  throw new Error("Instagram token is valid but returned no user ID.");
}

console.log(`Instagram token is valid for @${payload.username || "unknown"}.`);
