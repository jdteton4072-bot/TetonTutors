#!/usr/bin/env python3
"""Scaffold a new creative brief folder from the skill's templates.

Creates <root>/<YYYY-MM-DD>-<slug>/ containing brief.md, prompts.md, CHANGELOG.md and an
empty assets/ directory, then adds a row to the index table in <root>/README.md.

Usage:
    python3 .claude/skills/creative-brief/scripts/new_brief.py "Outskill Playable Demo"
    python3 .../new_brief.py "Launch Film" --slug launch-film --root packages/app/artifacts/creative-briefs

Stdlib only, no dependencies.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
ASSETS = SKILL_DIR / "assets"
DEFAULT_ROOT = "artifacts/creative-briefs"

INDEX_START = "<!-- BRIEF-INDEX:START -->"
INDEX_END = "<!-- BRIEF-INDEX:END -->"
INDEX_HEADER = "| Brief | Created | Status | What it covers |\n|---|---|---|---|"

FILES = [
    ("brief-template.md", "brief.md"),
    ("prompts-template.md", "prompts.md"),
    ("changelog-template.md", "CHANGELOG.md"),
]


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return re.sub(r"-{2,}", "-", slug)


def render(template: Path, **values: str) -> str:
    text = template.read_text(encoding="utf-8")
    for key, value in values.items():
        text = text.replace("{{%s}}" % key, value)
    return text


def update_index(root: Path, folder_name: str, title: str, date: str) -> None:
    """Insert a row for the new brief into root/README.md, creating it if absent."""
    readme = root / "README.md"
    row = f"| [{title}](./{folder_name}/brief.md) | {date} | Draft | _TBD_ |"

    if not readme.exists():
        readme.write_text(
            "# Creative briefs\n\n"
            "One folder per brief, created by the `creative-brief` skill.\n"
            "Each contains `brief.md` (the decisions), `prompts.md` (generation prompts\n"
            "derived from them), `CHANGELOG.md`, and an `assets/` folder for references.\n\n"
            f"{INDEX_START}\n{INDEX_HEADER}\n{INDEX_END}\n",
            encoding="utf-8",
        )

    text = readme.read_text(encoding="utf-8")
    if INDEX_START not in text or INDEX_END not in text:
        text = text.rstrip("\n") + f"\n\n{INDEX_START}\n{INDEX_HEADER}\n{INDEX_END}\n"

    head, rest = text.split(INDEX_START, 1)
    body, tail = rest.split(INDEX_END, 1)
    body = body.rstrip("\n") + "\n" + row + "\n"
    readme.write_text(f"{head}{INDEX_START}{body}{INDEX_END}{tail}", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold a creative brief folder.")
    parser.add_argument("title", help="Human-readable brief title, e.g. 'Launch Film'")
    parser.add_argument("--slug", help="Folder slug (default: slugified title)")
    parser.add_argument("--date", help="Creation date YYYY-MM-DD (default: today)")
    parser.add_argument(
        "--root",
        default=DEFAULT_ROOT,
        help=f"Directory to create the brief in (default: {DEFAULT_ROOT})",
    )
    args = parser.parse_args()

    date = args.date or dt.date.today().isoformat()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        parser.error("--date must be YYYY-MM-DD")

    slug = slugify(args.slug or args.title)
    if not slug:
        parser.error("title produced an empty slug; pass --slug explicitly")

    root = Path(args.root)
    folder_name = f"{date}-{slug}"
    brief_dir = root / folder_name

    if brief_dir.exists():
        print(f"error: {brief_dir} already exists — edit it, or pass a different --slug",
              file=sys.stderr)
        return 1

    (brief_dir / "assets").mkdir(parents=True)
    (brief_dir / "assets" / ".gitkeep").touch()

    for template_name, out_name in FILES:
        template = ASSETS / template_name
        if not template.exists():
            print(f"error: missing template {template}", file=sys.stderr)
            return 1
        (brief_dir / out_name).write_text(
            render(template, TITLE=args.title, SLUG=slug, DATE=date), encoding="utf-8"
        )

    update_index(root, folder_name, args.title, date)

    print(f"Created {brief_dir}/")
    for _, out_name in FILES:
        print(f"  {brief_dir / out_name}")
    print(f"  {brief_dir / 'assets'}/")
    print(f"Indexed in {root / 'README.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
