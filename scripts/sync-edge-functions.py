#!/usr/bin/env python3
"""Re-download all Edge Functions from INTERNAL-APPLICATION via Supabase CLI."""

from __future__ import annotations

import os
import subprocess
import sys

PROJECT_REF = "ocisdaeugliixyhcjnkv"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def main() -> int:
    cmd = [
        "npx",
        "supabase@latest",
        "functions",
        "download",
        f"--project-ref={PROJECT_REF}",
        "--use-api",
        "--yes",
    ]
    print("Running:", " ".join(cmd))
    return subprocess.call(cmd, cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
