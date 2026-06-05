#!/usr/bin/env python3
"""Write a Supabase Edge Function from a get_edge_function JSON export."""

from __future__ import annotations

import json
import os
import sys


def normalize_path(name: str, slug: str) -> str:
    for prefix in (f"supabase/functions/{slug}/", f"{slug}/"):
        if name.startswith(prefix):
            return name[len(prefix) :]
    return name


def write_function(data: dict, root: str) -> tuple[str, int]:
    slug = data["slug"]
    functions_dir = os.path.join(root, "supabase", "functions")
    func_dir = os.path.join(functions_dir, slug)
    os.makedirs(func_dir, exist_ok=True)

    count = 0
    for file_entry in data.get("files", []):
        rel = normalize_path(file_entry["name"], slug)
        out_path = os.path.join(func_dir, rel)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(file_entry["content"])
        count += 1

    return slug, count


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: write-edge-function.py <export.json> [export.json ...]", file=sys.stderr)
        return 1

    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    total = 0

    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        slug, count = write_function(data, root)
        print(f"{slug}: {count} files")
        total += count

    print(f"Wrote {total} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
