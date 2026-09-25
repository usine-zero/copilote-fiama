"""SAOU Transport — robust end-to-end OBINA Studio video pipeline.

Design goals
------------
- real temporal LTX video on Modal L40S; never a slideshow;
- six continuous-action shots;
- SAOU Transport branding only on staff left-chest and the coach;
- no captions, banners, route text, phone text, or other overlays;
- only a small OBINA Studio + baobab watermark at bottom-left;
- natural Edge Neural speech;
- TTS is prepared BEFORE GPU rendering;
- every generated scene is persisted in a Modal Volume immediately;
- failed later stages never force already-finished scenes to be regenerated;
- final H.264/AAC MP4 is Android/social compatible and persisted.

Run:
    modal run deploy/modal_saou_transport_ad.py

Force a complete re-render:
    modal run deploy/modal_saou_transport_ad.py --force true
"""
from __future__ import annotations

import modal
from pathlib import Path

APP = "obina-saou-transport-real-ad"
LTX_REPO = "/opt/LTX-Video"
LTX_COMMIT = "bdc8f017f0148a0f0bb9e3a5049d2d356423cee0"

CACHE = "/cache"
FINAL_DIR = f"{CACHE}/saou-transport-v2"
SCENE_DIR = f"{FINAL_DIR}/scenes"
AUDIO_DIR = f"{FINAL_DIR}/audio"
FINAL_MP4 = f"{FINAL_DIR}/SAOU_TRANSPORT_VRAIE_VIDEO.mp4"
FINAL_PROOF = f"{FINAL_DIR}/proof.json"

app = modal.App(APP)
cache = modal.Volume.from_name("obina-saou-ltx-cache", create_if_missing=True)

cpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "fonts-dejavu-core")
    .pip_install("edge-tts", "pillow")
)

gpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "git", "ffmpeg", "build-essential", "libgl1", "libglib2.0-0",
        "fonts-dejavu-core",
    )
    .run_commands(
        f"git clone https://github.com/Lightricks/LTX-Video.git {LTX_REPO}",
        f"git -C {LTX_REPO} checkout --detach {LTX_COMMIT}",
        f"python -m pip install -e '{LTX_REPO}[inference]'",
    )
    .pip_install("pillow", "huggingface_hub")
    .env({
        "HF_HOME": f"{CACHE}/hf",
        "PYTORCH_CUDA_ALLOC_CONF": "expandable_segments:True",
    })
)

DIALOGUE = [
    # scene_id, offset_sec, voice, rate, pitch, text
    ("01_client_home", 0.20, "fr-FR-DeniseNeural", "-6%", "-2Hz",
     "Naka colis bi ?"),
    ("01_client_home", 1.15, "fr-FR-DeniseNeural", "-4%", "-2Hz",
     "Ne t’inquiète pas, je l’envoie aujourd’hui avec SAOU Transport."),
    ("02_arrival_agency", 0.80, "fr-FR-DeniseNeural", "+2%", "+2Hz",
     "Bonjour madame, bienvenue chez SAOU Transport."),
    ("03_receive_parcel", 0.20, "fr-FR-DeniseNeural", "-4%", "-2Hz",
     "Bonjour. Je voudrais envoyer ce colis à Tamba."),
    ("03_receive_parcel", 2.15, "fr-FR-DeniseNeural", "+2%", "+2Hz",
     "Bien sûr madame. On s’occupe du reste."),
    ("03_receive_parcel", 3.95, "fr-FR-HenriNeural", "+2%", "+1Hz",
     "Colis pour Tamba. Il part aujourd’hui."),
    ("04_agent_to_bus", 1.95, "fr-FR-HenriNeural", "+2%", "+1Hz",
     "Un colis pour Tamba."),
    ("05_handoff_load", 0.70, "fr-FR-HenriNeural", "-2%", "-1Hz",
     "Parfait. On s’en occupe."),
    ("06_bus_departure", 0.30, "fr-FR-HenriNeural", "+6%", "-1Hz",
     "SAOU Transport. Dakar, Tamba. Rapide, sûr, abordable. Départ quotidien. "
     "77 404 47 38."),
]

SCENES = [
    {
        "id": "01_client_home",
        "seconds": 4.8,
        "frames": 97,
        "seed": 2026092501,
        "condition_from": None,
        "condition_strength": None,
        "prompt": (
            "Photorealistic Senegalese television commercial, one continuous medium-wide shot. "
            "A dignified Black Senegalese woman around 48 years old, elegant patterned boubou "
            "and matching headwrap, finishes sealing one medium cardboard parcel on a table in "
            "a bright realistic Dakar home. Her phone rings, she answers naturally, listens, smiles, "
            "then lifts the parcel with both hands and prepares to leave. Natural breathing and blinking, "
            "real body weight, anatomically correct hands, stable face, cinematic daylight, no cuts. "
            "There is no visible writing anywhere in the room."
        ),
    },
    {
        "id": "02_arrival_agency",
        "seconds": 4.5,
        "frames": 97,
        "seed": 2026092502,
        "condition_from": None,
        "condition_strength": None,
        "prompt": (
            "Photorealistic Senegalese television commercial, continuous medium-wide shot at a clean "
            "modern transport agency in Dakar. The same mature Black Senegalese woman around 48 enters "
            "carrying one cardboard parcel. A friendly Black Senegalese female receptionist around 24 "
            "stands behind the counter and welcomes her. A Black Senegalese male transport agent around 33 "
            "is nearby. Every SAOU employee wears a clean professional white shirt with one small "
            "SAOU Transport mark on the LEFT CHEST only; there is no other writing on clothing. "
            "The customer walks to the counter and gently sets the parcel down. Natural gestures, realistic "
            "eye contact, stable anatomy, no close-up mouth shot, no wall signs and no screen text."
        ),
    },
    {
        "id": "03_receive_parcel",
        "seconds": 5.5,
        "frames": 97,
        "seed": 2026092503,
        "condition_from": "02_arrival_agency",
        "condition_strength": 1.0,
        "prompt": (
            "Continue from the exact input frame inside the same Dakar agency with the same customer, "
            "same receptionist, same male transport agent, same clothes and same parcel. "
            "The receptionist receives the parcel, checks its label without showing readable label text, "
            "writes a receipt and hands the receipt to the customer. The male agent steps forward and "
            "takes the parcel securely with both hands. Every SAOU employee wears a professional white "
            "shirt with one small SAOU Transport mark on the LEFT CHEST only. Friendly efficient service, "
            "natural hands, stable parcel, subtle smiles, realistic body motion, no captions, no other writing."
        ),
    },
    {
        "id": "04_agent_to_bus",
        "seconds": 4.5,
        "frames": 97,
        "seed": 2026092504,
        "condition_from": None,
        "condition_strength": None,
        "prompt": (
            "Photorealistic Senegalese transport television commercial outside the agency in Dakar daylight. "
            "A Black male SAOU transport agent around 33 walks naturally toward a large clean white intercity "
            "coach while carrying one medium cardboard parcel. A Black Senegalese male bus driver around 49 "
            "waits beside the open luggage compartment. Both men wear professional white shirts with one small "
            "SAOU Transport mark on the LEFT CHEST only. The coach has one clear SAOU Transport mark on its side, "
            "black lettering with a small orange accent, with no other advertising text. Smooth walking, "
            "realistic weight and hands, stable bus, medium-wide cinematic shot, no captions, no extra signs."
        ),
    },
    {
        "id": "05_handoff_load",
        "seconds": 5.0,
        "frames": 97,
        "seed": 2026092505,
        "condition_from": "04_agent_to_bus",
        "condition_strength": 1.0,
        "prompt": (
            "Continue from the exact input frame outside the same Dakar agency with the same male transport "
            "agent, same driver, same parcel and same white coach. The employee hands the parcel to the driver. "
            "The driver receives it safely with both hands, turns, places it carefully inside the luggage "
            "compartment and closes the compartment securely. Both men wear professional white shirts with one "
            "small SAOU Transport mark on the LEFT CHEST only. The coach has one clear SAOU Transport mark on "
            "its side. Real human movement, realistic object interaction, stable parcel, stable vehicle geometry, "
            "one continuous television-commercial shot, no captions and no extra writing."
        ),
    },
    {
        "id": "06_bus_departure",
        "seconds": 5.5,
        "frames": 97,
        "seed": 2026092506,
        "condition_from": "05_handoff_load",
        "condition_strength": 1.0,
        "prompt": (
            "Continue from the same white SAOU intercity coach and same driver. The coach has one clear "
            "SAOU Transport mark on its side and no other advertising text. The driver walks to the front, "
            "boards the bus naturally, the door closes and the coach begins to move slowly forward on a sunny "
            "Dakar street. A clean cinematic wide shot follows the bus for a moment. Real wheel motion, stable "
            "coach geometry, natural traffic ambience, no captions, no title card, no extra writing."
        ),
    },
]

NEGATIVE = (
    "subtitles, captions, lower third, title card, poster, banner, phone number, route text, "
    "random letters, unrelated signage, watermark, on-screen graphics, slideshow, still image, "
    "pan zoom, deformed hands, extra fingers, extra limbs, face morphing, duplicate person, "
    "warped parcel, floating object, distorted coach bus, unstable vehicle geometry, low quality"
)

def _run(cmd: list[str], *, capture: bool = True):
    import subprocess
    p = subprocess.run(cmd, capture_output=capture, text=True)
    if p.returncode:
        if capture:
            raise RuntimeError((p.stderr or p.stdout)[-3000:])
        raise RuntimeError("command_failed:" + " ".join(cmd[:5]))
    return p

def _duration(path: Path) -> float:
    p = _run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path),
    ])
    return float(p.stdout.strip())

def _decode_ok(path: Path) -> bool:
    import subprocess
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "null", "-"],
        capture_output=True,
    )
    return p.returncode == 0

def _sha256(path: Path) -> str:
    import hashlib
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def _last_frame(video: Path, target: Path) -> Path:
    _run([
        "ffmpeg", "-y", "-v", "error", "-sseof", "-0.08", "-i", str(video),
        "-frames:v", "1", str(target),
    ])
    if not target.is_file() or target.stat().st_size < 1000:
        raise RuntimeError("transition_frame_missing")
    return target

@app.function(
    image=cpu_image,
    cpu=1,
    memory=1024,
    timeout=300,
    volumes={CACHE: cache},
)
def prepare_audio(force: bool = False) -> dict:
    """Create all dialogue before allocating any GPU.

    Important edge-tts CLI rule:
    negative values MUST be passed as --rate=-6% / --pitch=-2Hz, not
    '--rate', '-6%'. Otherwise argparse treats the negative value as an option.
    """
    import json
    from pathlib import Path

    audio_dir = Path(AUDIO_DIR)
    audio_dir.mkdir(parents=True, exist_ok=True)

    items = []
    for i, (scene_id, offset, voice, rate, pitch, text) in enumerate(DIALOGUE, 1):
        mp3 = audio_dir / f"{i:02d}.mp3"
        if force or not mp3.is_file() or mp3.stat().st_size < 1000:
            _run([
                "edge-tts",
                "--voice", voice,
                f"--rate={rate}",
                f"--pitch={pitch}",
                "--text", text,
                "--write-media", str(mp3),
            ])
            if not mp3.is_file() or mp3.stat().st_size < 1000:
                raise RuntimeError(f"tts_output_missing:{i:02d}")
        items.append({
            "scene_id": scene_id,
            "offset": offset,
            "path": str(mp3),
            "text": text,
            "bytes": mp3.stat().st_size,
        })

    cache.commit()
    return {"ok": True, "items": items}

@app.function(
    image=gpu_image,
    gpu="L40S",
    cpu=4,
    memory=32768,
    timeout=3600,
    scaledown_window=30,
    max_containers=1,
    volumes={CACHE: cache},
)
def produce(force: bool = False) -> dict:
    import json
    import re
    import shutil
    import sys
    from pathlib import Path
    from PIL import Image, ImageDraw, ImageFont

    final_store = Path(FINAL_MP4)
    proof_store = Path(FINAL_PROOF)

    if not force and final_store.is_file() and proof_store.is_file():
        return {
            "proof": json.loads(proof_store.read_text(encoding="utf-8")),
            "cached": True,
            "storedPath": FINAL_MP4,
        }

    # Audio must exist BEFORE GPU work starts.
    audio_paths = [Path(AUDIO_DIR) / f"{i:02d}.mp3" for i in range(1, len(DIALOGUE) + 1)]
    missing_audio = [str(p) for p in audio_paths if not p.is_file() or p.stat().st_size < 1000]
    if missing_audio:
        raise RuntimeError("audio_not_prepared:" + ",".join(missing_audio[:3]))

    root = Path(LTX_REPO)
    work = Path("/tmp/saou-ad")
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    clips = work / "clips"; clips.mkdir()
    refs = work / "refs"; refs.mkdir()

    scene_store_dir = Path(SCENE_DIR)
    scene_store_dir.mkdir(parents=True, exist_ok=True)

    cfg_text = (root / "configs/ltxv-2b-0.9.8-distilled.yaml").read_text()
    cfg_text = re.sub(
        r"(?m)^prompt_enhancement_words_threshold:\s*[^\n#]+",
        "prompt_enhancement_words_threshold: 0",
        cfg_text,
    )
    cfg = work / "saou-ltx.yaml"
    cfg.write_text(cfg_text, encoding="utf-8")

    sys.path.insert(0, str(root))
    from ltx_video.inference import infer, InferenceConfig

    generated: dict[str, Path] = {}
    transition: dict[str, Path] = {}
    scene_status = []

    for scene in SCENES:
        sid = scene["id"]
        persistent_scene = scene_store_dir / f"{sid}.mp4"

        if (
            not force
            and persistent_scene.is_file()
            and persistent_scene.stat().st_size > 4096
            and _decode_ok(persistent_scene)
        ):
            generated[sid] = persistent_scene
            scene_status.append({"id": sid, "cached": True})
        else:
            out_dir = clips / sid
            out_dir.mkdir(parents=True, exist_ok=True)

            kwargs = dict(
                prompt=scene["prompt"],
                negative_prompt=NEGATIVE,
                output_path=str(out_dir),
                pipeline_config=str(cfg),
                height=384,
                width=640,
                num_frames=scene["frames"],
                frame_rate=24,
                offload_to_cpu=True,
                seed=scene["seed"],
            )

            parent = scene.get("condition_from")
            if parent:
                ref = transition[parent]
                kwargs.update(
                    conditioning_media_paths=[str(ref)],
                    conditioning_strengths=[float(scene.get("condition_strength") or 1.0)],
                    conditioning_start_frames=[0],
                )

            infer(InferenceConfig(**kwargs))
            candidates = sorted(
                out_dir.rglob("*.mp4"),
                key=lambda p: p.stat().st_mtime,
            )
            if not candidates:
                raise RuntimeError("missing_video:" + sid)

            candidate = candidates[-1]
            if candidate.stat().st_size < 4096 or not _decode_ok(candidate):
                raise RuntimeError("invalid_video:" + sid)

            shutil.copy2(candidate, persistent_scene)
            cache.commit()  # checkpoint every completed scene immediately
            generated[sid] = persistent_scene
            scene_status.append({"id": sid, "cached": False})

        transition[sid] = _last_frame(
            generated[sid],
            refs / f"{sid}-last.png",
        )

    # Normalize real temporal clips to vertical phone/TV framing.
    normalized = []
    scene_start = {}
    cursor = 0.0

    for scene in SCENES:
        sid = scene["id"]
        src = generated[sid]
        target = float(scene["seconds"])
        dur = _duration(src)
        factor = max(1.0, target / dur)
        dst = work / f"{sid}-vertical.mp4"

        _run([
            "ffmpeg", "-y", "-v", "error", "-i", str(src),
            "-vf",
            f"setpts={factor:.6f}*PTS,"
            "scale=720:1280:force_original_aspect_ratio=increase,"
            "crop=720:1280,fps=24",
            "-t", f"{target:.3f}",
            "-an",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
            "-pix_fmt", "yuv420p",
            str(dst),
        ])

        scene_start[sid] = cursor
        cursor += target
        normalized.append(dst)

    concat = work / "concat.txt"
    concat.write_text(
        "".join(f"file '{p.as_posix()}'\n" for p in normalized),
        encoding="utf-8",
    )

    picture = work / "picture.mp4"
    _run([
        "ffmpeg", "-y", "-v", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat),
        "-c", "copy", str(picture),
    ])

    # Small, non-intrusive OBINA Studio watermark, bottom-left only.
    wm = work / "obina-studio-watermark.png"
    canvas = Image.new("RGBA", (230, 84), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    tree = (238, 238, 238, 170)

    draw.rounded_rectangle((20, 38, 34, 72), radius=4, fill=tree)
    draw.line((27, 43, 10, 25), fill=tree, width=5)
    draw.line((27, 42, 47, 22), fill=tree, width=5)
    draw.line((26, 38, 18, 13), fill=tree, width=4)
    draw.line((31, 38, 40, 11), fill=tree, width=4)
    draw.ellipse((3, 7, 24, 28), fill=tree)
    draw.ellipse((17, 1, 42, 25), fill=tree)
    draw.ellipse((36, 6, 57, 28), fill=tree)

    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            24,
        )
    except Exception:
        font = ImageFont.load_default()

    draw.text((64, 34), "OBINA Studio", font=font, fill=(242, 242, 242, 170))
    canvas.save(wm)

    # Mix neural dialogue across exact scene timeline.
    starts = []
    for idx, (scene_id, offset, _voice, _rate, _pitch, _text) in enumerate(DIALOGUE, 1):
        starts.append((idx, scene_start[scene_id] + float(offset)))

    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", str(picture),
        "-loop", "1", "-i", str(wm),
    ]

    for i in range(1, len(DIALOGUE) + 1):
        cmd += ["-i", str(Path(AUDIO_DIR) / f"{i:02d}.mp3")]

    filter_parts = [
        "[1:v]format=rgba,colorchannelmixer=aa=0.76[wm];"
        "[0:v][wm]overlay=16:H-h-16:shortest=1[v]"
    ]

    audio_labels = []
    # input 0 picture, input 1 watermark, dialogue inputs start at input 2
    for idx, start in starts:
        input_index = idx + 1
        delay_ms = int(start * 1000)
        label = f"a{idx}"
        filter_parts.append(
            f"[{input_index}:a]aresample=48000,"
            f"aformat=channel_layouts=stereo,"
            f"adelay={delay_ms}|{delay_ms}[{label}]"
        )
        audio_labels.append(f"[{label}]")

    filter_parts.append(
        "".join(audio_labels)
        + f"amix=inputs={len(audio_labels)}:duration=longest:normalize=0[a]"
    )

    final = work / "SAOU_TRANSPORT_VRAIE_VIDEO.mp4"
    cmd += [
        "-filter_complex", ";".join(filter_parts),
        "-map", "[v]", "-map", "[a]",
        "-t", f"{cursor:.3f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
        "-movflags", "+faststart",
        str(final),
    ]

    _run(cmd)

    if final.stat().st_size < 4096 or not _decode_ok(final):
        raise RuntimeError("final_video_invalid")

    digest = _sha256(final)
    final_duration = _duration(final)

    manifest = {
        "ok": True,
        "schema": "obina.saou.real-ad.v3",
        "engine": "LTX-Video 2B / Modal L40S",
        "realTemporalGeneration": True,
        "slideshow": False,
        "tts": "Microsoft Edge Neural",
        "captions": False,
        "screenTextPolicy": "physical SAOU branding + small OBINA Studio watermark only",
        "obinaWatermark": "bottom-left, baobab + OBINA Studio",
        "lipSyncClaimed": False,
        "storyShots": [x["id"] for x in SCENES],
        "sceneStatus": scene_status,
        "durationSec": final_duration,
        "bytes": final.stat().st_size,
        "sha256": digest,
        "semanticReviewRequired": [
            "customer identity continuity",
            "receptionist identity continuity",
            "agent and driver identity continuity",
            "parcel handoff realism",
            "SAOU shirt logo legibility",
            "SAOU bus logo legibility",
            "natural motion",
        ],
    }

    final_store.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(final, final_store)
    proof_store.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    cache.commit()

    return {
        "proof": manifest,
        "cached": False,
        "storedPath": FINAL_MP4,
    }

@app.local_entrypoint()
def main(force: bool = False):
    import json

    print("1/2 — Préparation des voix SANS GPU...")
    audio = prepare_audio.remote(force=force)
    print("✅ VOIX_OK:", len(audio["items"]))

    print("2/2 — Production vidéo L40S...")
    result = produce.remote(force=force)

    proof = Path("SAOU_TRANSPORT_VRAIE_VIDEO.proof.json")
    proof.write_text(
        json.dumps(result["proof"], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("✅ SAOU_REAL_VIDEO_OK")
    print("CACHED:", result.get("cached", False))
    print("STOCKE:", result["storedPath"])
    print("PREUVE:", proof)
    print("SHA256:", result["proof"]["sha256"])
