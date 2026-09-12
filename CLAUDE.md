# TetonTutors

Tutor application for students and mentors.

## Conventions

**Creative work starts with a brief.** Before generating images, video, game assets, or
launch copy, check `artifacts/creative-briefs/` for an existing brief and use the
`creative-brief` skill (`.claude/skills/creative-brief/`) to write one if there isn't. The
brief's prompt pack is where generation prompts live, so they stay traceable to the
decisions behind them instead of being re-improvised per session.

**Briefs and the project stay in sync.** If you notice the work has moved past what a brief
says — shipped assets that don't match its specs, copy that contradicts its key message —
say so once and offer to revise it. See `.claude/skills/creative-brief/references/project-sync.md`.

**Durable documents live in `artifacts/`.** See [`artifacts/README.md`](./artifacts/README.md)
for what belongs there and what doesn't.
