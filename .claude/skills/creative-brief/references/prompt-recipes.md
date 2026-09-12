# Prompt recipes

How to convert a filled-in brief into prompt cards that produce usable assets on the first
or second run.

## Contents

1. [The prompt card format](#the-prompt-card-format)
2. [Mapping brief fields into a prompt](#mapping-brief-fields-into-a-prompt)
3. [Recipe: still image / key art](#recipe-still-image--key-art)
4. [Recipe: video shot](#recipe-video-shot)
5. [Recipe: character, prop and asset sheets](#recipe-character-prop-and-asset-sheets)
6. [Recipe: UI, game screen and playable prototype](#recipe-ui-game-screen-and-playable-prototype)
7. [Recipe: audio, music and voice](#recipe-audio-music-and-voice)
8. [Recipe: copy and script](#recipe-copy-and-script)
9. [Tool notes](#tool-notes)
10. [Sequencing the pack](#sequencing-the-pack)
11. [Quality checks before handing off](#quality-checks-before-handing-off)

---

## The prompt card format

Every card in `prompts.md` uses this shape. It's designed so a person can copy the fenced
block and nothing else, and so a future revision can tell at a glance whether the card is
stale.

````markdown
### P-03 — Hero film, opening shot

**Deliverable:** Hero film (60s, 16:9, YouTube)
**Tool:** Veo / Sora / Runway — text-to-video
**Runs on:** external generator (paste manually)

```
<the prompt, verbatim and self-contained>
```

**Negative / avoid:** corporate stock-footage handshake energy, lens flares, text overlays
**Parameters:** 16:9 · 8s · 24fps · seed 4417 (lock once approved)
**Acceptance:** reads as a single continuous take; subject legible at 1/4 screen on mobile;
no on-screen text (added in edit)
**Derives from:** Objective, Audience, Tone, Visual Direction, Constraints
````

Field notes:

- **ID** — `P-01`, `P-02`, … Stable forever. Never renumber; retire a card by marking it
  `(retired)` and leave the number burnt. Comments and tickets reference these IDs.
- **Runs on** — `Claude Code` (an agent can execute it here), or `external generator`
  (a human pastes it somewhere). This is the single most useful line for the person
  receiving the pack, because it tells them what they personally have to do.
- **Prompt block** — self-contained. Someone pasting it into a tool has no access to the
  brief, so no "as described above", no pronouns pointing at the brief.
- **Acceptance** — how to tell a good output from a bad one without re-reading the brief.
  Write it as something checkable, not "looks good".
- **Derives from** — the brief fields used. Step 6 of the skill greps this line to find
  stale cards when a field changes. Be accurate rather than generous; listing every field
  on every card makes the whole pack look stale on any edit and destroys the signal.

## Mapping brief fields into a prompt

A good generative prompt is roughly: **subject + action + setting + style + light + camera +
composition + technical**. The brief supplies most of it.

| Brief field | Becomes |
|---|---|
| What we're making | Which modality, how many cards |
| Background / Context | What the asset can assume and need not explain |
| Objective / Goal | The tiebreaker between two good variants; what the frame must make the viewer feel or do |
| Target Audience | Casting, setting, references, reading level, first-second hook |
| Key Message | Subject and action — the thing shown that makes the message felt |
| Tone & Personality | Style clauses, light quality, colour temperature, edit rhythm |
| Deliverables & Channels | Aspect ratio, duration, safe areas, text-burn-in, sound-on/off |
| Visual & Sonic Direction | Medium, era, palette, lens, typography, motion, music |
| Constraints | Negative prompts, must-include elements, acceptance checks |

Two failure modes to avoid:

- **Pasting the brief into the prompt.** Generators respond to concrete nouns and verbs,
  not to strategy. "Empowering and aspirational" produces nothing; "low afternoon sun
  through a window, subject looking up from a laptop, small genuine smile" produces the
  thing the strategist meant.
- **Dropping the brief entirely** and writing a generically pretty prompt. If the card
  can't name the brief fields it came from, it isn't serving this project.

## Recipe: still image / key art

Order the clauses: **subject → action/expression → setting → composition → light → medium
and style → colour → technical**. Front-load the subject; most models weight early tokens
more heavily.

```
A mid-30s woman at a kitchen table at night, laptop open, mid-laugh at something
on screen. Handwritten notes and a cold coffee beside her. Shot from slightly
below eye level, 35mm, shallow depth of field, subject left-of-centre with
negative space right for headline. Single warm practical lamp plus cool laptop
spill. Photographic, natural grain, unretouched skin. Muted teal and amber.
1920x1080.
```

- Leave deliberate negative space where headlines or logos will be placed — check field 7
  for where text lands, and say so in the prompt.
- Generate a style frame first and approve it before producing the rest of the set;
  everything after inherits its palette and light.
- For a consistent set, lock the seed and vary only the subject clause.
- Describe what should be in frame, not what shouldn't — put exclusions in the negative
  field where the tool supports one.

## Recipe: video shot

Write one card per shot, not one card per film. Current video models hold roughly 5–10
seconds of coherent action; a 60-second film is an edit of many generations.

Clause order: **shot size and camera move → subject and action → setting → light → style →
duration and format**.

```
Slow push in, medium close-up. A teenager's hands place the last block on a
wobbling tower; the tower holds. Cluttered bedroom desk, late afternoon light
through blinds. Warm practical lamp, soft shadows. Photoreal, 50mm, shallow
focus, subtle handheld. 8 seconds, 16:9, 24fps.
```

- **One action per shot.** Two sequential actions in one prompt is the most common cause of
  morphing and dropped frames — split them into two cards.
- **Name the camera move explicitly** (locked, slow push, handheld follow, orbit) or the
  model will choose one, and it will choose a drifting orbit.
- **No on-screen text in video prompts.** Generators render text badly; burn it in during
  the edit. Note the intended text in the card's acceptance line instead.
- **Sound-off channels first.** If field 7 says captions burned in, the shot must read
  without audio — say "composition reads without sound; lower third kept clear for
  captions" in the acceptance check.
- For image-to-video, generate the first frame as a still card (P-0x) and reference it:
  `Animate P-02: <motion only>`. Note the dependency in the card so the order is obvious.

## Recipe: character, prop and asset sheets

Repeatable assets need a *canonical description block* written once and pasted verbatim
into every card that uses the character. Paraphrasing a character between prompts is what
makes their face change between shots.

```
CHARACTER — MAYA (paste verbatim into every Maya prompt):
Mid-20s, warm brown skin, short curly black hair with a faded undercut, round
tortoiseshell glasses, mustard hoodie over a white tee, small silver nose stud.
Friendly, slightly tired, quick to smile.
```

Then per card: `<CHARACTER — MAYA> Three-quarter view, neutral expression, flat vector
illustration, 4-colour palette (#0F172A #F59E0B #FFFFFF #64748B), plain background.`

- Put canonical blocks in a **Cast & assets** section at the top of `prompts.md` so they're
  edited in exactly one place.
- Sprite and asset sheets: state grid layout, cell size, background transparency, and
  padding, or you'll get a collage instead of a sheet.
- Game/UI assets: name the pixel grid and whether anti-aliasing is wanted. "32×32 pixel
  art, no anti-aliasing, transparent background" is a different world from "32px icon".

## Recipe: UI, game screen and playable prototype

These frequently run *inside Claude Code* rather than in an image tool, and that's usually
the better answer: a coded prototype is interactive, editable, and version-controlled,
where a generated mockup is a picture of a product that doesn't exist.

Mark the card `**Runs on:** Claude Code` and write it as a build instruction with explicit
acceptance criteria:

```
Build a single-file HTML prototype of the level-select screen.
- Isometric grid, 5 nodes, 3 unlocked / 2 locked with a padlock badge
- Palette #0F172A / #F59E0B / #FFFFFF; chunky rounded sans; 8px corner radius
- Snappy motion: 120ms ease-out on hover, no fades
- Portrait-first (390x844), scales to desktop without horizontal scroll
- Keyboard navigable, visible focus rings, AA contrast
- No backend, no build step, no external assets beyond a Google Font
Acceptance: playable with keyboard alone; locked nodes are unmistakably locked
at a glance; works at 390px and 1440px.
```

- Prefer one self-contained file for a prototype — it's the difference between "open it"
  and "set up an environment first".
- Spell out the state the screen is in (3 unlocked, 2 locked). Unstated state gets
  invented, and the invented version is always the empty one.
- If the prototype's look must match generated art, generate the style frame first and pass
  it in as a reference.

## Recipe: audio, music and voice

```
Instrumental bed, lo-fi hip-hop, 82 BPM, warm Rhodes, soft vinyl crackle, brushed
kit, no vocals. Confident and unhurried, never melancholy. Clean 4-bar loop point
at 0:00 and 0:12. 30 seconds, -16 LUFS, WAV.
```

- Name BPM, instrumentation, mood, and loop points. "Upbeat corporate" is how you get
  upbeat corporate.
- Voice: give age range, accent, pace, and a delivery note (`dry, conversational, as if
  explaining to one friend`), plus pronunciation for product names.
- Always state the loudness target and file format — an asset that has to be re-rendered
  for spec is a wasted generation.

## Recipe: copy and script

Card format is the same; the prompt asks for words rather than pixels. Always include:
the exact character or word limit, the key message verbatim, the tone adjectives, the
audience line from field 4, the CTA wording from field 9, and how many variants.

```
Write 5 variants of a 15-second VO script. Key message: "You can build something
real with AI this week, not someday." Audience: working adults 25-40 who feel
behind on AI and distrust course ads. Tone: confident, warm, slightly irreverent,
never corporate. Max 38 words each. End on the CTA "Try the demo" exactly.
No rhetorical questions, no "imagine if", no statistics.
```

The banned-phrase list is doing real work there. Add to it whatever the brief's "must
avoid" constraint named.

## Tool notes

Model names and features move fast. Treat these as defaults to sanity-check rather than
gospel, and prefer whatever the user already has licensed — a prompt for a tool they can't
access is worth nothing.

- **Claude Code** — best for anything that should end up as code, data, or a file in the
  repo: playable prototypes, SVG/canvas graphics, asset pipelines, batch renaming and
  resizing, copy variants, and running the rest of the pack. Cards say what to build and
  how to verify it, not how to think.
- **Midjourney / Firefly / Imagen-class stills** — strong on style; give them style,
  light, and lens language. Midjourney takes `--ar`, `--style`, `--seed` and reference
  images; Firefly is the safer default when commercial-rights cleanliness is a stated
  constraint.
- **Nano Banana / Flux Kontext / image-edit models** — best for *editing* an existing
  image: pass the source and describe only the change ("keep everything else identical").
  Ideal for producing channel variants of one approved key art.
- **Veo / Sora / Runway / Kling** — text-to-video and image-to-video. Short coherent
  clips, explicit camera language, no on-screen text. Image-to-video gives far more
  control over composition; prefer it when the composition matters.
- **ElevenLabs-class voice, Suno/Udio-class music** — follow the audio recipe; state
  loudness and format.

When the user hasn't named a tool, write the prompt in plain, tool-neutral language and put
tool-specific switches (`--ar 16:9`) in the **Parameters** line, not inside the prompt
block. That way the block stays pasteable anywhere.

## Sequencing the pack

Order cards by dependency, not by deliverable importance, and say so at the top of
`prompts.md`:

1. **Style frame** — one still that establishes palette, light, and medium. Approve before
   anything else runs; it's the cheapest possible place to discover a disagreement.
2. **Cast & asset sheets** — anything reused across shots.
3. **Hero deliverable** — shots or screens for the primary channel.
4. **Derivatives** — cut-downs, aspect variants, localisations. Usually edits of approved
   assets rather than fresh generations.
5. **Audio and copy** — parallel with 3, since they don't depend on the visuals.

## Quality checks before handing off

Read the pack once with fresh eyes:

- Does every deliverable in brief field 7 have at least one card, or a stated reason it
  doesn't?
- Can each prompt block be pasted with zero surrounding context and still make sense?
- Does each card's `Runs on:` correctly say who does the work?
- Would two different people reading the acceptance line agree on pass/fail?
- Does anything in the pack contradict the Constraints field? Constraints win.
- Are the tone adjectives visible in the actual prompt language, not just implied?
