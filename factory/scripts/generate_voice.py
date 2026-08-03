import json
import os
import subprocess
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro


ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = Path(os.environ.get("KOKORO_MODEL_DIR", ROOT / "models"))
MODEL = MODEL_DIR / "kokoro-v1.0.int8.onnx"
VOICES = MODEL_DIR / "voices-v1.0.bin"

with (ROOT / "current-batch.json").open(encoding="utf-8") as file:
    batch = json.load(file)

reel = next((item for item in batch["items"] if item["type"] == "reel"), None)
if not reel:
    raise RuntimeError("Current batch has no Reel.")
if not MODEL.exists() or not VOICES.exists():
    raise FileNotFoundError("Kokoro model files are missing.")

audio_dir = ROOT / "public" / "audio"
raw_dir = ROOT / "output" / "voice-raw"
audio_dir.mkdir(parents=True, exist_ok=True)
raw_dir.mkdir(parents=True, exist_ok=True)
raw_path = raw_dir / "current-reel.wav"
output_path = audio_dir / "current-reel.wav"

kokoro = Kokoro(str(MODEL), str(VOICES))
samples, sample_rate = kokoro.create(
    reel["voiceScript"], voice="af_bella", speed=1.04, lang="en-us"
)
sf.write(raw_path, samples, sample_rate)

subprocess.run(
    [
        "ffmpeg",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(raw_path),
        "-af",
        "asetrate=23050,aresample=24000,atempo=1.0412,loudnorm=I=-16:LRA=7:TP=-1.5,aresample=48000",
        str(output_path),
    ],
    check=True,
)
print(f"Voice ready: {output_path}")
