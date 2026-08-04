import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const apiVersion = process.env.INSTAGRAM_API_VERSION || "v23.0";
const fixturePath = process.env.INSTAGRAM_INSIGHTS_FIXTURE;
const outputRoot = resolve(process.env.INSIGHTS_OUTPUT_DIR || "analytics");
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
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseGraphResponse(response);
}

function metricValue(payload) {
  const metric = payload.data?.[0];
  const value = metric?.total_value?.value ?? metric?.values?.at(-1)?.value;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function categoryFor(caption = "") {
  const text = caption.toLowerCase();
  if (/fail|duplicate|guardrail|error|safe|risk/.test(text)) return "safety";
  if (/agent|autonomous|ai\b/.test(text)) return "ai-agents";
  if (/first|starter|begin|starting point/.test(text)) return "starter-workflows";
  if (/self.host|cloud|local/.test(text)) return "hosting";
  if (/map|design|trigger|decision|node/.test(text)) return "workflow-design";
  return "automation-practice";
}

function normalizeMedia(media) {
  const metrics = media.metrics || {};
  const reach = metrics.reach || 0;
  const interactions =
    metrics.total_interactions ??
    (media.like_count || 0) +
      (media.comments_count || 0) +
      (metrics.saved || 0) +
      (metrics.shares || 0);
  return {
    ...media,
    category: media.category || categoryFor(media.caption),
    metrics: { ...metrics, total_interactions: interactions },
    rates: {
      engagementPerReach: reach ? interactions / reach : 0,
      savesPerReach: reach ? (metrics.saved || 0) / reach : 0,
      sharesPerReach: reach ? (metrics.shares || 0) / reach : 0,
    },
  };
}

function summarize(profile, media) {
  const ranked = [...media].sort(
    (a, b) => b.rates.engagementPerReach - a.rates.engagementPerReach,
  );
  const categoryScores = new Map();
  const formatScores = new Map();
  for (const item of media) {
    const score = item.rates.engagementPerReach;
    const category = categoryScores.get(item.category) || [];
    category.push(score);
    categoryScores.set(item.category, category);
    const format = item.media_product_type === "REELS" ? "reel" : "carousel";
    const formatValues = formatScores.get(format) || [];
    formatValues.push(score);
    formatScores.set(format, formatValues);
  }
  const averageRanking = (map) =>
    [...map.entries()]
      .map(([name, values]) => ({
        name,
        average: values.reduce((sum, value) => sum + value, 0) / values.length,
        samples: values.length,
      }))
      .sort((a, b) => b.average - a.average);
  const categories = averageRanking(categoryScores);
  const formats = averageRanking(formatScores);
  const hasPerformanceData = media.some(
    (item) => (item.metrics.reach || 0) > 0 || (item.metrics.total_interactions || 0) > 0,
  );
  return {
    profile,
    totals: {
      mediaAnalyzed: media.length,
      reach: media.reduce((sum, item) => sum + (item.metrics.reach || 0), 0),
      interactions: media.reduce(
        (sum, item) => sum + (item.metrics.total_interactions || 0),
        0,
      ),
      saves: media.reduce((sum, item) => sum + (item.metrics.saved || 0), 0),
      shares: media.reduce((sum, item) => sum + (item.metrics.shares || 0), 0),
    },
    recommendations: {
      bestCategory: hasPerformanceData ? categories[0]?.name : null,
      bestFormat: hasPerformanceData ? formats[0]?.name : null,
      note: !hasPerformanceData
        ? "Instagram has not returned usable reach or interaction data yet; keep the publishing mix balanced."
        : media.length < 6
          ? "Not enough history for a strong conclusion; keep the publishing mix balanced."
          : "Prioritize the best category, but reserve one weekly slot for exploration.",
    },
    categoryRanking: categories,
    formatRanking: formats,
    topMedia: ranked.slice(0, 5).map((item) => ({
      id: item.id,
      permalink: item.permalink,
      category: item.category,
      format: item.media_product_type === "REELS" ? "reel" : "carousel",
      reach: item.metrics.reach || 0,
      interactions: item.metrics.total_interactions || 0,
      engagementPerReach: item.rates.engagementPerReach,
    })),
  };
}

function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function reportMarkdown(snapshot) {
  const { generatedAt, summary } = snapshot;
  const rows = summary.topMedia.length
    ? summary.topMedia
        .map(
          (item) =>
            `| [${item.id}](${item.permalink || "#"}) | ${item.format} | ${item.category} | ${item.reach} | ${item.interactions} | ${percent(item.engagementPerReach)} |`,
        )
        .join("\n")
    : "| — | — | — | 0 | 0 | 0.00% |";
  const recommendation = summary.recommendations.bestCategory
    ? `Favor **${summary.recommendations.bestCategory}** in **${summary.recommendations.bestFormat}** format. ${summary.recommendations.note}`
    : summary.recommendations.note;
  return `# Instagram weekly performance\n\nGenerated: ${generatedAt}\n\n- Followers: ${summary.profile.followers_count ?? "not available"}\n- Media analyzed: ${summary.totals.mediaAnalyzed}\n- Combined reach: ${summary.totals.reach}\n- Interactions: ${summary.totals.interactions}\n- Saves: ${summary.totals.saves}\n- Shares: ${summary.totals.shares}\n\n## Recommendation\n\n${recommendation}\n\n## Best media by interactions / reach\n\n| Media | Format | Category | Reach | Interactions | Rate |\n|---|---|---|---:|---:|---:|\n${rows}\n`;
}

async function collectLive() {
  if (!token) throw new Error("INSTAGRAM_ACCESS_TOKEN is required.");
  const me = await graphGet("me", {
    fields: "user_id,username,name,followers_count,media_count",
  });
  const userId = me.user_id || me.id;
  const listed = await graphGet(`${userId}/media`, {
    fields:
      "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count",
    limit: "50",
  });
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = (listed.data || []).filter(
    (item) => new Date(item.timestamp).getTime() >= cutoff,
  );
  const metricNames = [
    "reach",
    "views",
    "saved",
    "shares",
    "total_interactions",
  ];
  const media = [];
  for (const item of recent) {
    const metrics = {};
    for (const metric of metricNames) {
      try {
        metrics[metric] = metricValue(await graphGet(`${item.id}/insights`, { metric }));
      } catch (error) {
        console.warn(`${item.id}: ${metric} unavailable (${error.message})`);
      }
    }
    media.push(normalizeMedia({ ...item, metrics }));
  }
  return {
    profile: {
      username: me.username,
      name: me.name,
      followers_count: me.followers_count,
      media_count: me.media_count,
    },
    media,
  };
}

async function main() {
  const source = fixturePath
    ? JSON.parse(await readFile(resolve(fixturePath), "utf8"))
    : await collectLive();
  const media = (source.media || []).map(normalizeMedia);
  const generatedAt = new Date().toISOString();
  const snapshot = {
    generatedAt,
    source: fixturePath ? "fixture" : "instagram-api",
    summary: summarize(source.profile || {}, media),
    media,
  };
  const day = generatedAt.slice(0, 10);
  const snapshotPath = resolve(outputRoot, "snapshots", `${day}.json`);
  await mkdir(dirname(snapshotPath), { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  await writeFile(
    resolve(outputRoot, "latest.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`,
  );
  await writeFile(resolve(outputRoot, "weekly-report.md"), reportMarkdown(snapshot));
  console.log(
    `Insights collected: ${media.length} media; best category ${snapshot.summary.recommendations.bestCategory}.`,
  );
}

await main();
