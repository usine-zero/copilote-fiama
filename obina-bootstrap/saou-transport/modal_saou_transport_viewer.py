"""Lightweight public viewer for the already-produced SAOU Transport v2 ad.

Deploy only after the GPU producer has stored:
  /cache/saou-transport-v2/SAOU_TRANSPORT_VRAIE_VIDEO.mp4

Command:
  modal deploy deploy/modal_saou_transport_viewer.py
"""
from __future__ import annotations
import modal

APP="obina-saou-transport-viewer"
CACHE="/cache"
VIDEO=f"{CACHE}/saou-transport-v2/SAOU_TRANSPORT_VRAIE_VIDEO.mp4"
PROOF=f"{CACHE}/saou-transport-v2/proof.json"

app=modal.App(APP)
cache=modal.Volume.from_name("obina-saou-ltx-cache", create_if_missing=True)
image=modal.Image.debian_slim(python_version="3.11").pip_install("fastapi>=0.116,<1")

@app.function(image=image, volumes={CACHE:cache}, timeout=60)
@modal.fastapi_endpoint(method="GET")
def watch():
    import json
    from pathlib import Path
    from fastapi import Response
    video=Path(VIDEO)
    proof=Path(PROOF)
    if not video.is_file():
        return Response(
            content=b"SAOU video not produced yet",
            media_type="text/plain",
            status_code=404,
        )
    sha=""
    if proof.is_file():
        try:
            sha=str(json.loads(proof.read_text(encoding="utf-8")).get("sha256") or "")
        except Exception:
            sha=""
    return Response(
        content=video.read_bytes(),
        media_type="video/mp4",
        headers={
            "Content-Disposition":'inline; filename="SAOU_TRANSPORT_VRAIE_VIDEO.mp4"',
            "Cache-Control":"public, max-age=3600",
            "X-OBINA-SHA256":sha,
        },
    )

@app.function(image=image, volumes={CACHE:cache}, timeout=30)
@modal.fastapi_endpoint(method="GET")
def health():
    from pathlib import Path
    return {
        "ok":True,
        "videoReady":Path(VIDEO).is_file(),
        "service":"OBINA Studio SAOU viewer",
    }
