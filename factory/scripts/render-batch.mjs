import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const siteRoot = resolve(root, "..");
const batch = JSON.parse(await readFile(resolve(root, "current-batch.json"), "utf8"));
const outRoot = resolve(siteRoot, "media", "drafts", batch.batchDate);
const localCli = resolve(root, "node_modules", "@remotion", "cli", "remotion-cli.js");
const parentCli = resolve(root, "..", "..", "node_modules", "@remotion", "cli", "remotion-cli.js");
const cli = existsSync(localCli) ? localCli : parentCli;
if (!existsSync(cli)) throw new Error(`Remotion CLI was not found: ${cli}`);

const run = (args) => new Promise((resolvePromise, reject) => {
  const child = spawn(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit" });
  child.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`Remotion failed with ${code}: ${args.join(" ")}`)));
});

const entry = resolve(root, "src", "index.ts");
const jobs = [];
const manifestItems = [];
let carouselIndex = 0;
for (const item of batch.items) {
  if (item.type === "carousel") {
    carouselIndex += 1;
    const itemDir = resolve(outRoot, `carousel-${String(carouselIndex).padStart(2, "0")}`);
    await mkdir(itemDir, { recursive: true });
    const imageUrls = [];
    for (let slideIndex = 0; slideIndex < item.slides.length; slideIndex += 1) {
      const file = `slide-${String(slideIndex + 1).padStart(2, "0")}.png`;
      const output = resolve(itemDir, file);
      jobs.push([
        "still", entry, `Carousel-${carouselIndex}-${slideIndex + 1}`, output,
        "--frame=30", "--log=error",
      ]);
      imageUrls.push(`https://smackftw.github.io/talia-automates/media/drafts/${batch.batchDate}/carousel-${String(carouselIndex).padStart(2, "0")}/${file}`);
    }
    await writeFile(resolve(itemDir, "caption.txt"), `${item.caption}\n`);
    manifestItems.push({
      id: item.id,
      type: "carousel",
      topicId: item.topicId,
      category: item.category,
      caption: item.caption,
      imageUrls,
    });
  }
}

for (let index = 0; index < jobs.length; index += 2) {
  await Promise.all(jobs.slice(index, index + 2).map(run));
}

const reel = batch.items.find((item) => item.type === "reel");
if (reel) {
  const reelDir = resolve(outRoot, "reel-01");
  await mkdir(reelDir, { recursive: true });
  const output = resolve(reelDir, "reel.mp4");
  await run([
    "render", entry, "WeeklyReel", output,
    "--codec=h264", "--audio-codec=aac", "--crf=18", "--log=error",
  ]);
  await writeFile(resolve(reelDir, "caption.txt"), `${reel.caption}\n`);
  manifestItems.push({
    id: reel.id,
    type: "reel",
    topicId: reel.topicId,
    category: reel.category,
    caption: reel.caption,
    videoUrl: `https://smackftw.github.io/talia-automates/media/drafts/${batch.batchDate}/reel-01/reel.mp4`,
  });
}

const manifest = {
  batchDate: batch.batchDate,
  status: "awaiting-approval",
  generatedFrom: batch.generatedFrom,
  items: manifestItems,
};
await mkdir(outRoot, { recursive: true });
await writeFile(resolve(outRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await copyFile(resolve(root, "current-batch.json"), resolve(outRoot, "source.json"));
console.log(`Draft batch rendered to ${outRoot}.`);
