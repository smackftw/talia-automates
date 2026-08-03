import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { publicationQueue } from "./content.mjs";

const args = new Set(process.argv.slice(2));
const contentArg = process.argv
  .slice(2)
  .find((value) => value.startsWith("--content="));
const requestedId = contentArg?.slice("--content=".length);
const dryRun = args.has("--dry-run");
const scheduled = args.has("--scheduled");

if ((!requestedId && !scheduled) || (requestedId && scheduled)) {
  throw new Error(
    "Use exactly one of --content=<id> or --scheduled. Add --dry-run for validation.",
  );
}

const todayInCyprus = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Nicosia",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const item = requestedId
  ? publicationQueue.find((entry) => entry.id === requestedId)
  : publicationQueue.find((entry) => entry.scheduledDate === todayInCyprus);

if (!item) {
  const message = requestedId
    ? `Unknown content id: ${requestedId}`
    : `Nothing scheduled for ${todayInCyprus} (Asia/Nicosia).`;
  if (requestedId) throw new Error(message);
  console.log(message);
  process.exit(0);
}

const statePath = fileURLToPath(new URL("./published.json", import.meta.url));
const state = JSON.parse(await readFile(statePath, "utf8"));
if (state.published[item.id]) {
  console.log(
    `${item.id} is already recorded as published: ${state.published[item.id].instagramMediaId}`,
  );
  process.exit(0);
}

const assetUrls = item.type === "reel" ? [item.videoUrl] : item.imageUrls;

async function validateAsset(url) {
  const response = await fetch(url, { method: "HEAD", redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Public asset is unavailable (${response.status}): ${url}`);
  }
  const contentType = response.headers.get("content-type") ?? "unknown";
  const contentLength = response.headers.get("content-length") ?? "unknown";
  console.log(`Asset OK: ${contentType}, ${contentLength} bytes — ${url}`);
}

for (const url of assetUrls) await validateAsset(url);

if (dryRun) {
  console.log(
    `DRY RUN OK: ${item.id}, ${item.type}, ${assetUrls.length} public asset(s), scheduled ${item.scheduledDate}.`,
  );
  process.exit(0);
}

const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
const userId = process.env.INSTAGRAM_USER_ID;
const apiVersion = process.env.INSTAGRAM_API_VERSION || "v23.0";
if (!accessToken || !userId) {
  throw new Error(
    "INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID are required for a live publish.",
  );
}

const apiBase = `https://graph.instagram.com/${apiVersion}`;

async function parseGraphResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const message = payload.error?.message || `HTTP ${response.status}`;
    const code = payload.error?.code ? ` (code ${payload.error.code})` : "";
    throw new Error(`Instagram API error${code}: ${message}`);
  }
  return payload;
}

async function graphGet(path, params = {}) {
  const url = new URL(`${apiBase}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseGraphResponse(response);
}

async function graphPost(path, params) {
  const response = await fetch(`${apiBase}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  return parseGraphResponse(response);
}

async function findExistingPost() {
  const recent = await graphGet(`${userId}/media`, {
    fields: "id,caption,permalink,timestamp",
    limit: "50",
  });
  return recent.data?.find((media) => media.caption === item.caption);
}

async function waitForContainer(containerId, attempts = 60) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const status = await graphGet(containerId, {
      fields: "status_code,status",
    });
    if (status.status_code === "FINISHED") return status;
    if (["ERROR", "EXPIRED"].includes(status.status_code)) {
      throw new Error(`Container ${containerId} failed: ${status.status}`);
    }
    console.log(
      `Container ${containerId}: ${status.status_code || "processing"} (${attempt}/${attempts})`,
    );
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error(`Timed out waiting for container ${containerId}.`);
}

async function createCarousel() {
  const children = [];
  for (const imageUrl of item.imageUrls) {
    const child = await graphPost(`${userId}/media`, {
      image_url: imageUrl,
      is_carousel_item: "true",
    });
    children.push(child.id);
  }

  const carousel = await graphPost(`${userId}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption: item.caption,
  });
  await waitForContainer(carousel.id);
  return carousel.id;
}

async function createReel() {
  const reel = await graphPost(`${userId}/media`, {
    media_type: "REELS",
    video_url: item.videoUrl,
    caption: item.caption,
    share_to_feed: "true",
  });
  await waitForContainer(reel.id);
  return reel.id;
}

const existing = await findExistingPost();
if (existing) {
  state.published[item.id] = {
    instagramMediaId: existing.id,
    permalink: existing.permalink,
    publishedAt: existing.timestamp,
    detectedFromInstagram: true,
  };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`${item.id} already exists on Instagram; local state repaired.`);
  process.exit(0);
}

console.log(`Creating ${item.type} container for ${item.id}...`);
const creationId =
  item.type === "reel" ? await createReel() : await createCarousel();
const published = await graphPost(`${userId}/media_publish`, {
  creation_id: creationId,
});
const media = await graphGet(published.id, {
  fields: "id,permalink,timestamp",
});

state.published[item.id] = {
  instagramMediaId: published.id,
  permalink: media.permalink,
  publishedAt: media.timestamp || new Date().toISOString(),
};
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
console.log(`Published ${item.id}: ${media.permalink || published.id}`);
