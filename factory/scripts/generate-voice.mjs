import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { KokoroTTS } from "kokoro-js";

const root = resolve(import.meta.dirname, "..");
const batch = JSON.parse(await readFile(resolve(root, "current-batch.json"), "utf8"));
const reel = batch.items.find((item) => item.type === "reel");
if (!reel) throw new Error("Current batch has no Reel.");

const audioDir = resolve(root, "public", "audio");
const rawDir = resolve(root, "output", "voice-raw");
const raw = resolve(rawDir, "current-reel.wav");
const output = resolve(audioDir, "current-reel.wav");
await mkdir(audioDir, { recursive: true });
await mkdir(rawDir, { recursive: true });

const localFfmpeg = resolve(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const parentFfmpeg = resolve(root, "..", "..", "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const ffmpeg = process.platform === "win32"
  ? existsSync(localFfmpeg) ? localFfmpeg : parentFfmpeg
  : "ffmpeg";

console.log("Loading Kokoro q8 voice model...");
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-ONNX", {
  dtype: "q8",
});
const audio = await tts.generate(reel.voiceScript, {
  voice: "af_bella",
  speed: 1.04,
});
await audio.save(raw);

const result = spawnSync(
  ffmpeg,
  [
    "-y",
    "-i", raw,
    "-af",
    "asetrate=23050,aresample=24000,atempo=1.0412,loudnorm=I=-16:LRA=7:TP=-1.5,aresample=48000",
    output,
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) throw new Error("Voice post-processing failed.");
console.log(`Voice ready: ${output}`);
