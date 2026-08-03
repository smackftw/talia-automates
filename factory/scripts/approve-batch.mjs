import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const batchDate = process.argv[2];
const firstDate = process.argv[3];
if (!/^\d{4}-\d{2}-\d{2}$/.test(batchDate || "") || !/^\d{4}-\d{2}-\d{2}$/.test(firstDate || "")) {
  throw new Error("Usage: node approve-batch.mjs <batch YYYY-MM-DD> <first publication YYYY-MM-DD>");
}

const siteRoot = resolve(import.meta.dirname, "..", "..");
const manifestPath = resolve(siteRoot, "media", "drafts", batchDate, "manifest.json");
const approvedPath = resolve(siteRoot, "automation", "approved-content.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const approved = JSON.parse(await readFile(approvedPath, "utf8"));

const scheduled = manifest.items.map((item, index) => {
  const date = new Date(`${firstDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + index);
  return { ...item, scheduledDate: date.toISOString().slice(0, 10) };
});
const ids = new Set(scheduled.map((item) => item.id));
approved.items = [...approved.items.filter((item) => !ids.has(item.id)), ...scheduled];
approved.items.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
await writeFile(approvedPath, `${JSON.stringify(approved, null, 2)}\n`);
console.log(`Approved ${scheduled.length} items for ${scheduled.map((item) => item.scheduledDate).join(", ")}.`);
