#!/usr/bin/env python3
"""Single-entry launcher for the validated SAOU Transport OBINA pipeline.

This file is intentionally tiny. It fetches the producer/viewer from one
pinned Git commit, compiles them locally, runs production, deploys the viewer,
and prints one final URL.

It never edits the downloaded pipeline.
"""
from __future__ import annotations

import re
import subprocess
import sys
import urllib.request
from pathlib import Path

BASE = (
    "https://raw.githubusercontent.com/usine-zero/copilote-fiama/"
    "640ea5bab4ed2c5b5ba48d627f67d56504db8c6f/obina-bootstrap/saou-transport/"
)
WORK = Path("/tmp/obina-saou-launcher")
WORK.mkdir(parents=True, exist_ok=True)

files = {
    "producer": ("modal_saou_transport_ad.py", WORK / "producer.py"),
    "viewer": ("modal_saou_transport_viewer.py", WORK / "viewer.py"),
}

def run(cmd, *, capture=False):
    p = subprocess.run(cmd, capture_output=capture, text=True)
    if p.returncode:
        if capture:
            sys.stderr.write((p.stdout or "") + (p.stderr or ""))
        raise SystemExit(p.returncode)
    return p

print("SAOU 1/5 — récupération version validée")
for name, (remote, local) in files.items():
    with urllib.request.urlopen(BASE + remote, timeout=60) as response:
        data = response.read()
    local.write_bytes(data)
    print(f"  {name}: {len(data)} octets")

print("SAOU 2/5 — validation locale")
for _name, (_remote, local) in files.items():
    run([sys.executable, "-m", "py_compile", str(local)])
print("  CODE_OK")

print("SAOU 3/5 — production réelle")
run(["modal", "run", str(files["producer"][1])])
print("  VIDEO_OK")

print("SAOU 4/5 — déploiement lecteur")
deploy = run(["modal", "deploy", str(files["viewer"][1])], capture=True)
output = (deploy.stdout or "") + "\n" + (deploy.stderr or "")
print(output)

urls = re.findall(r"https://[^\s]+modal\.run", output)
if not urls:
    raise SystemExit("Viewer déployé mais URL modal.run introuvable.")

print("SAOU 5/5 — terminé")
print("LIEN_VIDEO:", urls[-1])
