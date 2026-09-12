---
name: creative-brief
description: >-
  Run a structured creative-brief interview (what we're making, background, objective,
  audience, key message, tone, deliverables, visual direction, constraints), capture the
  answers into a versioned brief document under artifacts/creative-briefs/, and derive a
  pack of ready-to-run generation prompts for images, video, audio, and playable
  prototypes that can be handed straight to Claude Code, Midjourney, Veo, Sora, Runway,
  Firefly, or any other generative tool. Use this whenever someone mentions a creative
  brief, creative direction, a campaign/concept/product brief, or says "brief me on this";
  whenever they are kicking off a new video, trailer, ad, explainer, game experience,
  landing page, illustration set, or marketing asset; whenever they ask for prompts for an
  AI image or video generator; and whenever an existing brief needs to be revised or the
  project needs to catch up to a brief that changed. Reach for it even when the word
  "brief" is never spoken — a request like "we want to make a video game experience for
  X" or "I need a launch video for this feature" is a brief waiting to happen.
---

# Creative Brief

Turn a loose creative idea into two things that survive contact with production:

1. **`brief.md`** — the decisions, written down, that everyone can point at.
2. **`prompts.md`** — a numbered pack of generation prompts derived from those decisions,
   each one runnable as-is by Claude Code or a generative image/video/audio tool.

The gap between *"we want a video game experience for Outskill"* and a prompt that yields
usable footage is a pile of unmade decisions: who it's for, what it must say, what it must
feel like, what shape it ships in. This skill's job is to surface those decisions cheaply,
record them once, and keep every downstream prompt traceable back to them — so when a
decision changes, it's obvious what has to be regenerated.

## Workflow

Step 0 → Step 6. Skip nothing silently; if you skip, say why.

### Step 0 — Check whether this brief already exists

```bash
ls artifacts/creative-briefs/ 2>/dev/null
```

If a brief for this work already exists, read it and go to **Step 6 (Revise)** instead of
starting a fresh interview. Re-interviewing someone on decisions they already made is the
fastest way to make a brief feel like paperwork. If it exists but is thin, read it, then
interview only on the gaps.

### Step 1 — Frame it in one line before asking anything

Say back what you understand is being made, in one sentence, and propose a name:

> "Sounds like: a short playable web demo that teaches Outskill's course-picking flow,
> aimed at their existing YouTube audience. I'll call it `outskill-playable-demo`.
> Right so far?"

This costs one line and catches the "we were talking about completely different things"
failure before it becomes an hour of wasted interview. Slug rules: lowercase, hyphens, 2–4
words, no dates in the slug (the folder carries the date).

### Step 2 — Interview

Nine fields. The first seven are the standard brief; the last two are omitted from most
templates but no image or video prompt can be written without them.

| # | Field | What it decides downstream |
|---|-------|---------------------------|
| 1 | What we're making | The deliverable list, and therefore how many prompts |
| 2 | Background / Context | Why now, what already exists, what not to re-explain |
| 3 | Objective / Goal | The one behavior change that makes this a success |
| 4 | Target Audience | Reading level, references that land, what to assume |
| 5 | Key Message | The single sentence every asset must carry |
| 6 | Tone & Personality | Adjectives that become style terms in prompts |
| 7 | Deliverables & Channels | Aspect ratios, durations, file specs, cut-downs |
| 8 | Visual & Sonic Direction | Palette, era, lens, type, motion, music — prompt fuel |
| 9 | Constraints & Non-negotiables | Must-include, must-avoid, brand, legal, budget, dates |

Read `references/interview-guide.md` for the phrasing of each question, what a weak answer
looks like next to a strong one, the follow-up that rescues a vague answer, and how to
infer a reasonable draft from context.

**How to run the interview so it doesn't feel like a form:**

- **Draft first, then ask.** Propose an answer from what you already know and ask them to
  correct it. Editing is faster than composing, and a wrong draft provokes a sharper
  correction than a blank field ever will.
- **Batch two or three questions at a time.** One at a time is an interrogation; all nine
  at once is a form nobody fills in.
- **Let them punt.** "You pick" and "don't care" are legitimate answers — take the
  decision, mark it `[assumed]`, and move on.
- **Tag every field** `[confirmed]` or `[assumed]` as you capture it. Assumptions are fine;
  silent assumptions are what wreck a project three weeks later. Every `[assumed]` field
  is copied into the brief's **Open questions** section.
- **Stop at good enough.** A brief with seven solid fields and two flagged assumptions
  beats a stalled interview. You can always revise (Step 6).

### Step 3 — Write the brief document

Scaffold the folder, then fill it in:

```bash
python3 .claude/skills/creative-brief/scripts/new_brief.py "Outskill Playable Demo"
```

This creates `artifacts/creative-briefs/<YYYY-MM-DD>-<slug>/` containing `brief.md`,
`prompts.md`, and `CHANGELOG.md` from the templates in `assets/`, and adds a row to the
index in `artifacts/creative-briefs/README.md`.

Write the interview answers into `brief.md`. Keep the template's headings — the sync step
and the prompt recipes both key off them.

**Where briefs live.** Default to the repo-level `artifacts/creative-briefs/` folder, so
briefs for different workstreams sit together and the index is one place to look. Pass
`--root <dir>` when a brief belongs to a self-contained sub-project that should carry its
own creative direction (e.g. `--root packages/mobile/artifacts/creative-briefs`). Ask only
if it's genuinely ambiguous; otherwise take the default and mention it in one clause.

### Step 4 — Derive the prompt pack

This is the step that makes the brief worth writing. Read
`references/prompt-recipes.md` for the anatomy of a prompt card, the per-modality recipes
(still image, video shot, character/asset sheet, UI or game screen, audio and voice), and
the tool-specific notes for Claude Code, Midjourney, Veo, Sora, Runway, Firefly, and
image-editing models.

Two rules carry most of the value:

- **Coverage:** every deliverable named in field 7 gets at least one prompt card. If a
  deliverable has no prompt, either write one or say in `prompts.md` why it's out of scope
  (live action, licensed footage, a human designer's job).
- **Traceability:** every prompt card ends with a `Derives from:` line naming the brief
  fields it was built from. That single line is what makes Step 6 cheap — change the tone
  field and you can immediately list which prompts are now stale, instead of re-reading the
  whole pack and guessing.

### Step 5 — Hand off

Tell the user what they have and what to do with it, concretely:

- Which prompts can be run right now by Claude Code (asset scripts, playable prototypes,
  HTML/canvas mockups) versus which need an external generator and a human to paste them.
- The order to run them in, when one output feeds another (style frame → animatic → shot).
- Offer to publish `brief.md` as an Artifact web page when someone outside the repo needs
  to read or comment on it. The markdown file stays the source of truth — a published page
  is a view of it, and re-publishing after an edit is how it stays honest.

### Step 6 — Keep the brief and the project in sync

A brief that stops matching the project is worse than no brief, because people still quote
it. Read `references/project-sync.md` for the revision procedure and the checklist of what
to propose updating elsewhere in the project when a field changes.

The short version, on every revision:

1. Bump the version and date in `brief.md`; append a dated entry to `CHANGELOG.md` saying
   what changed and **why**.
2. Grep the prompt pack for cards whose `Derives from:` names a changed field, mark them
   `⚠️ stale`, and regenerate them.
3. Propose — don't silently perform — the downstream project updates the change implies
   (README, docs, issue titles, asset filenames, copy strings, tests that assert on copy).
   Present them as a short checklist the user can approve, then do the approved ones.

## Working style

Keep the interview in chat and the record on disk. The brief is a working document, not a
deliverable to admire: short declarative lines, no filler, no restating the question inside
the answer. If a field is genuinely undecided, write `TBD — blocked on <who/what>` rather
than prose that pretends a decision was made.
