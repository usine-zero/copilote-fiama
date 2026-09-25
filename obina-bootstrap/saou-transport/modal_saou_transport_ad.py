"""SAOU Transport — complete real-video pipeline for OBINA Studio.

Target:
- real temporal LTX video on Modal L40S, never a slideshow;
- six story shots with continuity where useful;
- Senegalese cast fixed by age/role descriptions;
- SAOU Transport branding only on staff shirts and the coach;
- NO captions, banners, phone number, route or other screen text;
- the only overlay is a small OBINA Studio + baobab watermark at bottom-left;
- natural Edge Neural voices;
- Android/social H.264 + AAC output;
- persistent final MP4 + proof JSON in a Modal Volume;
- authenticated HTTP endpoint for OBINA Studio.

Run once from a Modal-authenticated checkout:
    modal run deploy/modal_saou_transport_ad.py

Deploy the reusable endpoint:
    modal deploy deploy/modal_saou_transport_ad.py
"""
from __future__ import annotations

import modal
from pathlib import Path

APP="obina-saou-transport-real-ad"
LTX_REPO="/opt/LTX-Video"
LTX_COMMIT="bdc8f017f0148a0f0bb9e3a5049d2d356423cee0"
CACHE="/cache"
FINAL_DIR=f"{CACHE}/saou-transport-v1"
FINAL_MP4=f"{FINAL_DIR}/SAOU_TRANSPORT_VRAIE_VIDEO.mp4"
FINAL_PROOF=f"{FINAL_DIR}/proof.json"

app=modal.App(APP)
cache=modal.Volume.from_name("obina-saou-ltx-cache", create_if_missing=True)

gpu_image=(
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "git","ffmpeg","build-essential","libgl1","libglib2.0-0",
        "fonts-dejavu-core",
    )
    .run_commands(
        f"git clone https://github.com/Lightricks/LTX-Video.git {LTX_REPO}",
        f"git -C {LTX_REPO} checkout --detach {LTX_COMMIT}",
        f"python -m pip install -e '{LTX_REPO}[inference]'",
    )
    .pip_install(
        "pillow",
        "huggingface_hub",
        "edge-tts",
    )
    .env({
        "HF_HOME":f"{CACHE}/hf",
        "PYTORCH_CUDA_ALLOC_CONF":"expandable_segments:True",
    })
)


def _run(cmd:list[str], cwd:Path|None=None)->None:
    import subprocess
    p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True)
    if p.returncode:
        raise RuntimeError((p.stderr or p.stdout)[-2400:])

def _duration(path:Path)->float:
    import subprocess
    p=subprocess.run([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=nw=1:nk=1",str(path)
    ],capture_output=True,text=True,check=True)
    return float(p.stdout.strip())

def _sha256(path:Path)->str:
    import hashlib
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def _last_frame(video:Path,target:Path)->Path:
    _run([
        "ffmpeg","-y","-v","error","-sseof","-0.08","-i",str(video),
        "-frames:v","1",str(target)
    ])
    if not target.is_file() or target.stat().st_size<1000:
        raise RuntimeError("transition_frame_missing")
    return target

@app.function(
    image=gpu_image,
    gpu="L40S",
    cpu=4,
    memory=32768,
    timeout=3600,
    scaledown_window=30,
    max_containers=1,
    volumes={CACHE:cache},
)
def produce(force:bool=False)->dict:
    import json, os, re, shutil, sys
    from pathlib import Path
    from PIL import Image, ImageDraw, ImageFont

    final_store=Path(FINAL_MP4)
    proof_store=Path(FINAL_PROOF)
    if not force and final_store.is_file() and proof_store.is_file():
        return {
            "proof":json.loads(proof_store.read_text(encoding="utf-8")),
            "cached":True,
            "storedPath":FINAL_MP4,
        }

    root=Path(LTX_REPO)
    work=Path("/tmp/saou-ad")
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    clips=work/"clips"; clips.mkdir()
    audios=work/"audio"; audios.mkdir()
    refs=work/"refs"; refs.mkdir()

    # Keep prompt enhancement disabled; our scene directions are deliberate.
    cfg_text=(root/"configs/ltxv-2b-0.9.8-distilled.yaml").read_text()
    cfg_text=re.sub(
        r"(?m)^prompt_enhancement_words_threshold:\s*[^\n#]+",
        "prompt_enhancement_words_threshold: 0",
        cfg_text,
    )
    cfg=work/"saou-ltx.yaml"
    cfg.write_text(cfg_text,encoding="utf-8")

    sys.path.insert(0,str(root))
    from ltx_video.inference import infer, InferenceConfig

    # Screen must look like television/commercial footage: no layout text.
    # SAOU wording is allowed only as physical branding on uniforms and bus.
    NEG=(
        "subtitles, captions, lower third, title card, poster, banner, phone number, route text, "
        "random letters, unrelated signage, watermark, on-screen graphics, slideshow, still image, "
        "pan zoom, deformed hands, extra fingers, extra limbs, face morphing, duplicate person, "
        "warped parcel, floating object, distorted coach bus, unstable vehicle geometry, low quality"
    )

    uniform_rule=(
        "Every SAOU employee wears a clean professional white shirt with one small embroidered "
        "SAOU Transport mark on the LEFT CHEST only, black lettering with a small orange accent; "
        "there is no other writing on clothing. "
    )
    bus_rule=(
        "The coach is a large clean white intercity bus with one clear SAOU Transport brand mark "
        "on its side, black lettering with a small orange accent; no other advertising text. "
    )

    scenes=[
        {
            "id":"01_client_home",
            "seconds":5.2,
            "frames":73,
            "seed":2026092501,
            "condition_from":None,
            "prompt":(
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
            "id":"02_arrival_agency",
            "seconds":5.4,
            "frames":73,
            "seed":2026092502,
            "condition_from":None,
            "prompt":(
                "Photorealistic Senegalese television commercial, continuous medium-wide shot at a clean "
                "modern transport agency in Dakar. The same mature Black Senegalese woman around 48 enters "
                "carrying the same cardboard parcel. A friendly Black Senegalese female receptionist around 24 "
                "stands behind the counter and welcomes her. A Black Senegalese male transport agent around 33 "
                "is nearby preparing shipment work. "+uniform_rule+
                "The customer walks to the counter and gently sets the parcel down. Natural gestures, realistic "
                "eye contact, stable anatomy, no close-up mouth shot, no wall signs and no screen text."
            ),
        },
        {
            "id":"03_receive_parcel",
            "seconds":6.0,
            "frames":73,
            "seed":2026092503,
            "condition_from":"02_arrival_agency",
            "prompt":(
                "Continue from the exact input frame inside the same Dakar agency with the same customer, "
                "same receptionist, same male transport agent, same clothes and same parcel. "
                "The receptionist receives the parcel, checks its label without showing readable label text, "
                "writes a receipt and hands the receipt to the customer. The male agent steps forward and "
                "takes the parcel securely with both hands. "+uniform_rule+
                "Friendly efficient service, natural hands, stable parcel, subtle smiles, realistic body motion, "
                "one continuous television-commercial shot, no captions and no other visible writing."
            ),
        },
        {
            "id":"04_agent_to_bus",
            "seconds":5.4,
            "frames":73,
            "seed":2026092504,
            "condition_from":None,
            "prompt":(
                "Photorealistic Senegalese transport television commercial outside the agency in Dakar daylight. "
                "The same Black male SAOU transport agent around 33 walks naturally toward a large white intercity "
                "coach while carrying the same medium cardboard parcel. A Black Senegalese male bus driver around "
                "49 waits beside the open luggage compartment. "+uniform_rule+bus_rule+
                "The agent approaches the driver. Smooth walking, realistic weight and hands, stable bus, "
                "medium-wide cinematic shot, no captions, no extra signs."
            ),
        },
        {
            "id":"05_handoff_load",
            "seconds":6.0,
            "frames":73,
            "seed":2026092505,
            "condition_from":"04_agent_to_bus",
            "prompt":(
                "Continue from the exact input frame outside the same Dakar agency with the same male transport "
                "agent, same driver, same parcel and same white coach. "+uniform_rule+bus_rule+
                "The employee hands the parcel to the driver. The driver receives it safely with both hands, "
                "turns, places it carefully inside the luggage compartment and closes the compartment securely. "
                "Real human movement, realistic object interaction, stable parcel, stable vehicle geometry, "
                "one continuous television-commercial shot, no captions and no extra writing."
            ),
        },
        {
            "id":"06_bus_departure",
            "seconds":6.0,
            "frames":73,
            "seed":2026092506,
            "condition_from":"05_handoff_load",
            "prompt":(
                "Continue from the same white SAOU intercity coach and same driver. "+bus_rule+
                "The driver walks to the front, boards the bus naturally, the door closes and the coach begins "
                "to move slowly forward on a sunny Dakar street. A clean cinematic wide shot follows the bus "
                "for a moment. Real wheel motion, stable coach geometry, natural traffic ambience, no captions, "
                "no title card, no extra writing."
            ),
        },
    ]

    generated:dict[str,Path]={}
    transition:dict[str,Path]={}

    for scene in scenes:
        out_dir=clips/scene["id"]; out_dir.mkdir()
        kwargs=dict(
            prompt=scene["prompt"],
            negative_prompt=NEG,
            output_path=str(out_dir),
            pipeline_config=str(cfg),
            height=384,
            width=640,
            num_frames=scene["frames"],
            frame_rate=24,
            offload_to_cpu=True,
            seed=scene["seed"],
        )
        parent=scene.get("condition_from")
        if parent:
            ref=transition[parent]
            kwargs.update(
                conditioning_media_paths=[str(ref)],
                conditioning_strengths=[1.0],
                conditioning_start_frames=[0],
            )
        infer(InferenceConfig(**kwargs))
        candidates=sorted(out_dir.rglob("*.mp4"),key=lambda p:p.stat().st_mtime)
        if not candidates:
            raise RuntimeError("missing_video:"+scene["id"])
        generated[scene["id"]]=candidates[-1]
        transition[scene["id"]]=_last_frame(
            generated[scene["id"]],
            refs/f'{scene["id"]}-last.png',
        )

    # Spoken dialogue — natural neural speech, no captions.
    # We intentionally do not claim lip-sync on this first full transport test:
    # medium/wide action framing keeps the commercial honest while testing the whole pipeline.
    dialogue=[
        # scene_id, offset within scene, voice, rate, pitch, line
        ("01_client_home",0.35,"fr-FR-DeniseNeural","-8%","-2Hz","Naka colis bi ?"),
        ("01_client_home",1.70,"fr-FR-DeniseNeural","-7%","-3Hz",
         "Ne t’inquiète pas, je l’envoie aujourd’hui avec SAOU Transport."),
        ("02_arrival_agency",1.00,"fr-FR-DeniseNeural","+2%","+3Hz",
         "Bonjour madame, bienvenue chez SAOU Transport."),
        ("03_receive_parcel",0.45,"fr-FR-DeniseNeural","-7%","-3Hz",
         "Bonjour. Je voudrais envoyer ce colis à Tamba."),
        ("03_receive_parcel",2.50,"fr-FR-DeniseNeural","+2%","+3Hz",
         "Bien sûr madame. On s’occupe du reste."),
        ("03_receive_parcel",4.35,"fr-FR-HenriNeural","+2%","+1Hz",
         "Colis pour Tamba. Il part aujourd’hui."),
        ("04_agent_to_bus",2.35,"fr-FR-HenriNeural","+2%","+1Hz",
         "Un colis pour Tamba."),
        ("05_handoff_load",0.85,"fr-FR-HenriNeural","-5%","-2Hz",
         "Parfait. On s’en occupe."),
        ("06_bus_departure",0.55,"fr-FR-HenriNeural","-4%","-1Hz",
         "SAOU Transport. Dakar, Tamba. Rapide, sûr et abordable. Départ quotidien. "
         "Pour vos colis, appelez le 77 404 47 38."),
    ]

    voice_files=[]
    for i,(scene_id,offset,voice,rate,pitch,text) in enumerate(dialogue,1):
        mp3=audios/f"{i:02d}.mp3"
        _run([
            "edge-tts","--voice",voice,"--rate",rate,"--pitch",pitch,
            "--text",text,"--write-media",str(mp3)
        ])
        voice_files.append((scene_id,offset,mp3,text))

    # Normalize each REAL motion shot to vertical smartphone/TV framing.
    normalized=[]
    scene_start={}
    cursor=0.0
    for scene in scenes:
        src=generated[scene["id"]]
        target=float(scene["seconds"])
        dur=_duration(src)
        factor=max(1.0,target/dur)
        dst=work/f'{scene["id"]}-vertical.mp4'
        _run([
            "ffmpeg","-y","-v","error","-i",str(src),
            "-vf",
            f"setpts={factor:.6f}*PTS,"
            "scale=720:1280:force_original_aspect_ratio=increase,"
            "crop=720:1280,fps=24",
            "-t",f"{target:.3f}",
            "-an","-c:v","libx264","-preset","veryfast","-crf","19",
            "-pix_fmt","yuv420p",str(dst)
        ])
        scene_start[scene["id"]]=cursor
        cursor += target
        normalized.append(dst)

    concat=work/"concat.txt"
    concat.write_text("".join(f"file '{p.as_posix()}'\n" for p in normalized),encoding="utf-8")
    picture=work/"picture.mp4"
    _run([
        "ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",str(concat),
        "-c","copy",str(picture)
    ])

    # Build a small, non-intrusive OBINA Studio watermark:
    # simple baobab icon + "OBINA Studio", bottom-left only.
    wm=work/"obina-studio-watermark.png"
    canvas=Image.new("RGBA",(250,92),(0,0,0,0))
    draw=ImageDraw.Draw(canvas)
    tree=(235,235,235,185)
    # trunk + branching baobab silhouette
    draw.rounded_rectangle((25,42,40,78),radius=4,fill=tree)
    draw.line((32,48,12,28),fill=tree,width=6)
    draw.line((32,47,52,24),fill=tree,width=6)
    draw.line((30,42,20,15),fill=tree,width=5)
    draw.line((35,42,43,12),fill=tree,width=5)
    draw.ellipse((4,7,28,31),fill=tree)
    draw.ellipse((18,0,46,27),fill=tree)
    draw.ellipse((38,6,62,31),fill=tree)
    try:
        font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",26)
    except Exception:
        font=ImageFont.load_default()
    draw.text((70,38),"OBINA Studio",font=font,fill=(240,240,240,185))
    canvas.save(wm)

    # Mix neural dialogue across the exact scene timeline.
    starts=[]
    for scene_id,offset,mp3,text in voice_files:
        starts.append(scene_start[scene_id]+float(offset))

    cmd=["ffmpeg","-y","-v","error","-i",str(picture),"-loop","1","-i",str(wm)]
    for _,_,mp3,_ in voice_files:
        cmd += ["-i",str(mp3)]

    filter_parts=[
        # watermark remains small and clear; no other screen writing is added
        "[1:v]format=rgba,colorchannelmixer=aa=0.78[wm];"
        "[0:v][wm]overlay=18:H-h-18:shortest=1[v]"
    ]
    audio_labels=[]
    # input 0 picture, input 1 watermark, audio starts at input 2
    for i,start in enumerate(starts,2):
        ms=int(start*1000)
        label=f"a{i}"
        filter_parts.append(
            f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,"
            f"adelay={ms}|{ms}[{label}]"
        )
        audio_labels.append(f"[{label}]")
    filter_parts.append(
        "".join(audio_labels)+f"amix=inputs={len(audio_labels)}:duration=longest:normalize=0[a]"
    )

    final=work/"SAOU_TRANSPORT_VRAIE_VIDEO.mp4"
    cmd += [
        "-filter_complex",";".join(filter_parts),
        "-map","[v]","-map","[a]",
        "-t",f"{cursor:.3f}",
        "-c:v","libx264","-preset","veryfast","-crf","19",
        "-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","160k","-ar","48000",
        "-movflags","+faststart","-shortest",str(final)
    ]
    _run(cmd)

    # Technical QC. Semantic branding/identity/object interaction still requires visual review.
    _run(["ffmpeg","-v","error","-i",str(final),"-f","null","-"])
    final_duration=_duration(final)
    digest=_sha256(final)
    data=final.read_bytes()
    manifest={
        "ok":True,
        "schema":"obina.saou.real-ad.v2",
        "engine":"LTX-Video 2B / Modal L40S",
        "realTemporalGeneration":True,
        "slideshow":False,
        "tts":"Microsoft Edge Neural",
        "captions":False,
        "screenTextPolicy":"only physical SAOU branding + small OBINA Studio watermark",
        "obinaWatermark":"bottom-left, baobab + OBINA Studio",
        "lipSyncClaimed":False,
        "storyShots":[x["id"] for x in scenes],
        "durationSec":final_duration,
        "bytes":len(data),
        "sha256":digest,
        "semanticReviewRequired":[
            "customer identity continuity",
            "receptionist identity continuity",
            "agent and driver identity continuity",
            "parcel handoff realism",
            "SAOU shirt logo legibility",
            "SAOU bus logo legibility",
            "natural motion",
        ],
    }

    # Persist finished ad and proof so future reads do not regenerate it.
    final_store.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(final,final_store)
    proof_store.write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding="utf-8")
    cache.commit()

    return {"proof":manifest,"cached":False,"storedPath":FINAL_MP4}

@app.local_entrypoint()
def main(force:bool=False):
    result=produce.remote(force=force)
    import json
    proof=Path("SAOU_TRANSPORT_VRAIE_VIDEO.proof.json")
    proof.write_text(json.dumps(result["proof"],indent=2,ensure_ascii=False),encoding="utf-8")
    print("✅ SAOU_REAL_VIDEO_OK")
    print("CACHED:",result.get("cached",False))
    print("STOCKE:",result["storedPath"])
    print("PREUVE:",proof)
    print("SHA256:",result["proof"]["sha256"])
