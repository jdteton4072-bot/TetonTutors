# Keeping the brief and the project in sync

A brief goes stale the moment the project moves and nobody edits it. The failure is quiet:
people keep quoting the document, the document no longer describes the thing, and the
disagreement only surfaces at review. This file describes how to revise a brief and what to
propose updating elsewhere when it changes.

## Contents

1. [Revision procedure](#revision-procedure)
2. [Finding stale prompt cards](#finding-stale-prompt-cards)
3. [What to propose updating elsewhere](#what-to-propose-updating-elsewhere)
4. [Field-by-field ripple table](#field-by-field-ripple-table)
5. [Drift detection: when nobody asked](#drift-detection-when-nobody-asked)
6. [Proposing, not performing](#proposing-not-performing)

---

## Revision procedure

When someone changes a decision — or the work reveals the original decision was wrong:

1. **Edit `brief.md` in place.** The brief describes the current intent, not its history.
   Don't accumulate strikethroughs; that's what the changelog is for.
2. **Bump the header.** `Version: 1.2` and `Last updated: YYYY-MM-DD`.
3. **Append to `CHANGELOG.md`** — what changed, and *why*. The why is the part that has
   value in three months; "changed tone to warmer" is worthless next to "changed tone to
   warmer after the first cut tested as cold with the student audience".
4. **Re-check the Open questions section.** Turn resolved `[assumed]` fields into
   `[confirmed]`, and add any new assumption the revision introduced.
5. **Mark and regenerate stale prompt cards** (next section).
6. **Propose downstream project updates** (the section after that).

If a change is large enough that most fields move — a new audience, a new objective — it's
a new brief, not a revision. Create a new folder and add `Supersedes:
2026-03-04-old-brief` to its header and `Superseded by:` to the old one's. Keeping the old
brief readable matters: someone will find the old assets and need to know why they exist.

## Finding stale prompt cards

Each card ends with `Derives from:` naming the brief fields behind it. To find what a change
to, say, Tone affects:

```bash
grep -n "Derives from:.*Tone" artifacts/creative-briefs/<brief>/prompts.md
```

For every match:

- Prefix the card heading with `⚠️ stale —` and a one-line note about what changed.
- Rewrite the prompt.
- Drop the locked seed if the change is meant to alter the look — a locked seed will fight
  the new prompt and you'll conclude the prompt didn't work.
- Note in `CHANGELOG.md` which card IDs were regenerated.

Cards whose `Derives from:` doesn't name the changed field are untouched, and saying so
explicitly is useful — it tells the user what they *don't* have to re-review.

If assets were already produced from a now-stale card, say which ones and whether they need
re-rendering. An asset that's already shipped somewhere is a separate conversation; flag it
rather than quietly regenerating.

## What to propose updating elsewhere

A creative brief has reach beyond its own folder. After a revision, check these and propose
the ones that actually apply — a checklist of eight items where two are relevant is more
useful than a generic list of thirty.

**Documentation**
- `README.md` — if the brief changed what the project *is* or who it's for, the README's
  first paragraph is usually now wrong.
- `CLAUDE.md` / agent instructions — if tone, voice, or naming conventions changed, the
  instructions that tell an agent how to write copy need the same change, or every future
  generation drifts back to the old tone.
- Product or design docs quoting the objective, audience, or key message.

**Code and content**
- User-facing copy strings that carry the key message or CTA wording.
- Design tokens — palette or type changes in the Visual Direction field belong in the
  theme/token file, not only in prompts.
- Asset filenames and directories that encode a name the brief just changed.
- Tests or snapshots asserting on copy that changed. These fail loudly and confusingly if
  missed; worth listing first.

**Planning**
- Issue and ticket titles describing deliverables that were renamed, added, or dropped.
- Milestones, if the deliverable list or dates moved.
- Any downstream brief that references this one.

**The brief folder itself**
- `assets/` — remove or re-file reference images that no longer represent the direction.
- The index row in `artifacts/creative-briefs/README.md` — status and date.

## Field-by-field ripple table

| Changed field | Almost always affects | Worth checking |
|---|---|---|
| What we're making | Whole prompt pack, deliverable list, milestones | Whether this is a new brief |
| Background / Context | Framing lines in copy, what assets must explain | README, onboarding docs |
| Objective / Goal | Acceptance checks, CTA, success metrics | Analytics events, dashboards |
| Target Audience | Casting, reading level, references, all copy | Persona docs, accessibility bar |
| Key Message | Headlines, VO scripts, on-screen text, copy tests | Landing page, store listing |
| Tone & Personality | Every style clause, every negative prompt | `CLAUDE.md` voice rules, UI microcopy |
| Deliverables & Channels | Card count, aspect ratios, durations, specs | Export pipeline, filenames, milestones |
| Visual & Sonic Direction | Style frame, palette, type, motion in every card | Design tokens, theme files, brand docs |
| Constraints | Negative prompts, acceptance checks, legal lines | Licence notes, disclaimers, review gates |

## Drift detection: when nobody asked

The most valuable sync is the one nobody requested. When you're working in a project that
has briefs and you notice the work has moved past the document, say so once, briefly, and
offer to update it:

> "Heads up — the brief still says the demo is portrait-only, but we built it responsive
> and the last two prompts assume landscape. Want me to revise field 7 and mark P-04 and
> P-07 stale?"

One sentence, a concrete discrepancy, a specific offer. Don't editorialise about process,
don't raise it twice, and don't block the work you were actually asked to do. If they say
no, note it in Open questions and move on.

Signals worth noticing:
- Shipped assets whose specs don't match field 7.
- Copy in the codebase that contradicts the key message.
- A design token palette that no longer matches the Visual Direction.
- Prompt cards nobody ran, which usually means the deliverable quietly died.
- A brief with no changelog entries in months while the project moved fast.

## Proposing, not performing

Propose downstream edits as a numbered checklist with file paths and a one-line reason
each, then do the approved ones. Two reasons this matters more than it might seem:

A brief is a statement of intent held by a person, and the ripple from changing it often
reaches copy, design, and planning that other people own. Editing those directly on the
strength of an inferred implication is how an agent quietly rewrites someone else's
decision. And the checklist itself is useful output: it shows the user the blast radius of
a change they may have thought was small, and sometimes that makes them reconsider the
change.

The brief folder is the exception — `brief.md`, `prompts.md`, and `CHANGELOG.md` are the
skill's own working files, and keeping them consistent is the job, not a proposal.
