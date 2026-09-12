# Creative briefs

One folder per brief, created by the [`creative-brief`](../../.claude/skills/creative-brief/SKILL.md)
skill. Run it with `/creative-brief`, or just describe something you want to make — a
video, a trailer, a game experience, a launch campaign — and it should pick itself up.

Each folder contains:

| File | What it is |
|---|---|
| `brief.md` | The decisions — what, why, who for, what it must feel like. The source of truth. |
| `prompts.md` | Generation prompts derived from those decisions, one card per deliverable. |
| `CHANGELOG.md` | What changed, when, and why. |
| `assets/` | Reference images and inputs. |

## How to use one

- **Starting something new?** Run the skill. It interviews you, writes both files, and
  tells you which prompts an agent can run here versus which you paste into an image or
  video tool.
- **Picking up someone else's brief?** Read `brief.md` top to bottom, then skim the
  **Open questions** table — that's where the unresolved decisions are parked.
- **Something changed?** Don't edit prompts in isolation. Edit `brief.md`, then ask the
  skill to revise: it finds the prompt cards whose `Derives from:` names the changed field,
  regenerates those, and proposes what else in the project needs to catch up.

Folder naming is `YYYY-MM-DD-slug`, set at creation and never changed — links and tickets
point at it.

<!-- BRIEF-INDEX:START -->
| Brief | Created | Status | What it covers |
|---|---|---|---|
| [Example — Mentor Match Launch Film](./2026-09-12-example-mentor-match-launch/brief.md) | 2026-09-12 | Example | Worked example: launch film, key art, verticals, in-app banner |
<!-- BRIEF-INDEX:END -->

New rows are added automatically by `scripts/new_brief.py`; fill in the "What it covers"
cell yourself and keep the status current (`Draft` → `Approved` → `Shipped` → `Archived`).
