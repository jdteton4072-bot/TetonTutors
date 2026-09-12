# Prompt Pack — Example: Mentor Match Launch Film

> **Worked example.** Shows the card format and how brief fields turn into prompt language.

Derived from [`brief.md`](./brief.md) v1.0 (2026-09-12).

Each card is self-contained: copy the fenced block into the named tool and nothing else is
needed. `Runs on` says who does the work — **Claude Code** means an agent can execute it in
this repo; **external generator** means a person pastes it into an image, video, or audio tool.

**Run order:** P-01 (style frame, approve first) → P-02/P-03 (key art set) → P-04 (verticals)
→ P-05 (captions) → P-06 (in-app banner). P-05 can run in parallel with the visuals.

## Cast & assets

```
LOCATION — STUDY CORNER (paste verbatim into every card using it):
A corner of a small bedroom at dusk. Desk against a window with half-open blinds,
a warm desk lamp, a laptop, a stack of dog-eared paperbacks, one mug. Lived-in,
slightly messy, nothing styled. Deep navy shadows, warm amber lamplight.
```

## Prompts

### P-01 — Style frame (approve before anything else runs)

**Deliverable:** Key art (sets the look for the whole set)
**Tool:** Midjourney / Firefly / Imagen-class
**Runs on:** external generator

```
A 17-year-old student sitting sideways in a desk chair, phone in hand, looking up
and slightly off-camera with a small real smile — the expression of someone who
just got a good reply. A corner of a small bedroom at dusk. Desk against a window
with half-open blinds, a warm desk lamp, a laptop, a stack of dog-eared
paperbacks, one mug. Lived-in, slightly messy, nothing styled. Shot on 35mm,
handheld feel, shallow depth of field, subject right-of-centre with negative space
left for a headline. Practical light only: warm desk lamp plus cool phone glow, no
overheads. Photographic, natural grain, unretouched skin. Deep navy shadows, warm
amber highlights, off-white midtones. 1920x1080.
```

**Negative / avoid:** classroom staging, stock-photo thumbs-up, laughing at nothing,
overhead fluorescents, lens flares, visible branding, anyone who reads as under 16
**Parameters:** 16:9 · lock the seed once approved and reuse it for P-02 and P-03
**Acceptance:** reads as a candid moment, not a posed photo; face legible at 1/4 screen on
mobile; left third clean enough to carry a headline; palette matches the brief's three
colours without looking graded
**Derives from:** Audience, Key Message, Tone, Visual Direction, Constraints

### P-02 — Key art, the "before" beat

**Deliverable:** Key art still 2 of 3 (1080×1350)
**Tool:** same as P-01, same seed
**Runs on:** external generator

```
Same student, same room, earlier in the evening. Scrolling a long list on a laptop,
chin on hand, mild boredom — not distress. <LOCATION — STUDY CORNER>. 50mm, shallow
focus, subject centred, screen glow as the dominant light source. Photographic,
natural grain. Deep navy, warm amber, off-white. 1080x1350.
```

**Negative / avoid:** despair, head in hands, dramatic lighting, anything that reads as a
problem-agitation ad
**Parameters:** 4:5 · same seed as P-01
**Acceptance:** boredom not misery — this beat must stay affectionate toward the viewer;
same person and room as P-01 at a glance
**Derives from:** Key Message, Tone, Visual Direction

### P-03 — Key art, the "after" beat

**Deliverable:** Key art still 3 of 3 (1920×1080)
**Tool:** same as P-01, same seed
**Runs on:** external generator

```
Two people on a video call, seen over the student's shoulder: the student in
foreground silhouette, a mentor in their late 20s on the laptop screen mid-
sentence, gesturing, clearly explaining something. <LOCATION — STUDY CORNER>.
35mm, shallow focus on the screen, foreground soft. Screen light plus warm desk
lamp. Photographic, natural grain. Deep navy, warm amber, off-white. 1920x1080.
```

**Negative / avoid:** applause, celebration, graduation imagery, whiteboards, anything
implying a grade outcome
**Parameters:** 16:9 · same seed as P-01
**Acceptance:** the mentor reads as a real person mid-explanation, not a smiling headshot;
no legible UI on the laptop screen (it would date instantly)
**Derives from:** Objective, Key Message, Tone, Constraints

### P-04 — Vertical cut-down frames

**Deliverable:** 15s + 6s verticals (9:16)
**Tool:** image-edit model (Nano Banana / Flux Kontext-class)
**Runs on:** external generator

```
Reframe the attached image to 9:16 vertical. Keep the subject, lighting, grain and
colour identical — recompose only. Subject occupies the lower two-thirds; leave the
top third clean for a headline and the bottom 15% clear for burned-in captions.
Extend the room naturally where the frame widens vertically. Change nothing else.
```

**Negative / avoid:** re-rendering the subject's face, colour shifts, added objects
**Parameters:** 9:16 · 1080×1920 · run once per approved still from P-01–P-03
**Acceptance:** side-by-side with the source, the subject is recognisably the same person;
caption zone genuinely empty
**Derives from:** Deliverables & Channels, Visual Direction

### P-05 — Caption copy for the verticals

**Deliverable:** Burned-in captions, 15s and 6s cuts
**Tool:** Claude Code (or any LLM)
**Runs on:** Claude Code

```
Write 5 variants of burned-in caption copy for a 15-second vertical video, and 5 for
a 6-second cut.

Key message, verbatim: "The right mentor, first try — not the fourth."
Audience: existing TetonTutors students, 16-22, on mobile, at night, sceptical of
anything that sounds like an ad for their own school.
Tone: warm, plainspoken, quietly confident, a little funny. Never inspirational.

Constraints:
- 15s version: max 4 caption cards, max 7 words each
- 6s version: max 2 caption cards, max 6 words each
- Both end on the CTA "Find your mentor" exactly
- No rhetorical questions, no "imagine if", no statistics, no claims about grades
- Must read correctly with sound off
```

**Negative / avoid:** exclamation marks, second-person imperatives stacked back to back
**Parameters:** plain text output, grouped by cut length
**Acceptance:** every variant readable in under 2 seconds; none would embarrass a
16-year-old who reposted it
**Derives from:** Key Message, Audience, Tone, Deliverables & Channels, Constraints

### P-06 — In-app launch banner

**Deliverable:** In-app banner
**Tool:** Claude Code
**Runs on:** Claude Code

```
Build a single-file HTML prototype of the in-app launch banner.
- Headline "The right mentor, first try", CTA button "Find your mentor"
- Palette #0F172A background, #F59E0B CTA, #F8FAFC text; product sans; 8px radius
- Image slot on the right at 16:9, empty placeholder with a dashed outline
- Dismissible; dismissal persists in localStorage
- Responsive 360px to 1440px, no horizontal scroll at any width
- Keyboard reachable, visible focus ring, AA contrast on every text pair
- No build step, no external assets beyond the product font
Acceptance: usable with keyboard alone; the CTA is unmistakably the primary action;
contrast passes AA at 360px and 1440px.
```

**Parameters:** single self-contained `.html` file
**Acceptance:** as stated in the prompt — all four checks verifiable in a browser
**Derives from:** Key Message, Visual Direction, Constraints, Deliverables & Channels

## Not covered

- **Hero film (60s live action)** — no prompt card. The Rights constraint requires releases
  for recognisable faces in shipped video, so this is a live-action shoot, not a
  generation. The key art set (P-01–P-03) doubles as the look book for that shoot.
- **Music bed** — deferred until the edit is locked; scoring to picture beats scoring to a
  brief. Write the card then, using the audio recipe.
