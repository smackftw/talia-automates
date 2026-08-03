import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { topics } from "../topics.mjs";

const factoryRoot = resolve(import.meta.dirname, "..");
const siteRoot = resolve(factoryRoot, "..");
const statePath = resolve(factoryRoot, "state.json");
const currentPath = resolve(factoryRoot, "current-batch.json");

function cyprusDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Nicosia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

const batchDate = process.env.BATCH_DATE || cyprusDate();
const existing = await readJson(currentPath, null);
if (existing?.batchDate === batchDate) {
  console.log(`Reusing existing batch ${batchDate}.`);
  process.exit(0);
}

const state = await readJson(statePath, { usedTopicIds: [] });
let available = topics.filter((topic) => !state.usedTopicIds.includes(topic.id));
if (available.length < 3) {
  state.usedTopicIds = [];
  available = [...topics];
}

const insights = await readJson(resolve(siteRoot, "analytics", "latest.json"), null);
const favored = insights?.summary?.recommendations?.bestCategory;
available.sort((a, b) => Number(b.category === favored) - Number(a.category === favored));
const chosen = available.slice(0, 3);

function caption(topic) {
  const steps = topic.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  return `${topic.promise}\n\n${steps}\n\n${topic.outcome}\n\nSave this for your next build. Two free n8n starter templates are available through the link in bio.\n\n#n8n #automation #workflowautomation #aiautomation #solopreneur`;
}

function carousel(topic, index) {
  return {
    id: `draft-${batchDate}-carousel-${index + 1}`,
    type: "carousel",
    topicId: topic.id,
    category: topic.category,
    caption: caption(topic),
    slides: [
      {
        eyebrow: topic.eyebrow,
        title: topic.title,
        highlight: topic.highlight,
        body: topic.promise,
      },
      {
        eyebrow: "THE 4-STEP PATTERN",
        title: "Build it like this.",
        bullets: topic.steps,
      },
      {
        eyebrow: "THE RULE TO KEEP",
        title: topic.mistake,
        highlight: topic.outcome,
        cta: "SAVE THIS PATTERN →",
      },
    ],
  };
}

function reel(topic) {
  return {
    id: `draft-${batchDate}-reel-1`,
    type: "reel",
    topicId: topic.id,
    category: topic.category,
    caption: caption(topic),
    hook: topic.title,
    highlight: topic.highlight,
    nodes: topic.steps,
    takeaway: topic.outcome,
    voiceScript: topic.voiceScript,
  };
}

const batch = {
  batchDate,
  generatedFrom: favored ? `Instagram preference: ${favored}` : "balanced starter rotation",
  status: "draft",
  items: [carousel(chosen[0], 0), carousel(chosen[1], 1), reel(chosen[2])],
};

state.usedTopicIds.push(...chosen.map((topic) => topic.id));
await mkdir(resolve(factoryRoot, "public", "audio"), { recursive: true });
await writeFile(currentPath, `${JSON.stringify(batch, null, 2)}\n`);
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
console.log(`Selected ${chosen.map((topic) => topic.id).join(", ")} for ${batchDate}.`);
