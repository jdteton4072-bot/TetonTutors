# Interview guide

One section per brief field. Each gives you the question to ask, how to draft an answer
before asking, what separates a usable answer from a useless one, and the follow-up that
rescues a vague answer.

A note on the "weak" examples: they aren't stupid answers, they're the *normal* answers.
People reach for them because they're true. They're just not decisions. Your job is to
convert a true statement into a decision that constrains a prompt.

## Contents

1. [What we're making](#1-what-were-making)
2. [Background / Context](#2-background--context)
3. [Objective / Goal](#3-objective--goal)
4. [Target Audience](#4-target-audience)
5. [Key Message](#5-key-message)
6. [Tone & Personality](#6-tone--personality)
7. [Deliverables & Channels](#7-deliverables--channels)
8. [Visual & Sonic Direction](#8-visual--sonic-direction)
9. [Constraints & Non-negotiables](#9-constraints--non-negotiables)
10. [Closing the interview](#closing-the-interview)

---

## 1. What we're making

**Ask:** "In one line — what's the thing itself? And is this a finished piece or a
prototype meant to prove the concept?"

**Draft from context:** the user's own opening sentence is usually 80% of this field.
Replay it back compressed.

**Weak:** "A video game experience." → could be anything from a tweet-sized browser toy to
a Steam release.
**Strong:** "A 3–5 minute playable browser demo, single level, no accounts, embeddable in
a YouTube description link."

**Follow-up when vague:** "If someone opened it on their phone, how long until they hit
the end?" Duration and platform pin down scope faster than any adjective.

**Why it matters:** this field decides how many prompt cards exist and what modality each
one is. "Prototype to prove the concept" also lowers the fidelity bar on every downstream
prompt — worth capturing explicitly, because it saves arguing about polish later.

## 2. Background / Context

**Ask:** "What's already happened here? Who's driving it, what exists today, and why is
this coming up now rather than six months ago?"

**Draft from context:** the repo, recent commits, an existing README, prior briefs in
`artifacts/creative-briefs/`, or whatever the user said before invoking the skill.

**Weak:** "They want more content."
**Strong:** "Founder has an existing audience of ~200k on YouTube and a paid cohort
course. Written and video content is saturated; he wants an interactive format his
students can play and his audience can share. Nothing interactive exists yet."

**Follow-up when vague:** "What have you already tried, and what was disappointing about
it?" The disappointment is the real brief — it names the thing this piece must do that the
last one didn't.

**Why it matters:** background is what stops the assets re-explaining things the audience
already knows. It's also the only field that captures *what not to do again*.

## 3. Objective / Goal

**Ask:** "If this works perfectly, what does someone do differently? And how would you
know — what number or signal moves?"

**Weak:** "Raise awareness." / "Make it engaging."
**Strong:** "Get 30% of course viewers to try the demo and 10% of those to book a trial
call. Success = 500 plays and 50 bookings in the first month."

**Follow-up when vague:** "Awareness among whom, measured how?" If no metric exists, ask
for a proxy — a screenshot they'd be proud to post, a comment they'd want to read. A soft
signal beats a fake number.

**Why it matters:** the objective is the tiebreaker for every later judgment call. When two
prompt variations both look good, the one that serves the objective wins. Write it so it
can actually settle an argument.

## 4. Target Audience

**Ask:** "Who's on the other end? What do they already know, what do they already believe
about this, and where are they when they see it?"

**Weak:** "Students."
**Strong:** "Working adults, 25–40, mid-career, already convinced AI matters and slightly
anxious they're behind. Watching on a phone, at night, one tab of many. They've seen a
hundred AI-course ads and distrust all of them."

**Follow-up when vague:** "Who is this explicitly *not* for?" Exclusion sharpens a
description faster than more adjectives, and it tells you what references will misfire.

**Why it matters:** audience sets reading level, pacing, cultural references, casting, and
how much explanation an asset carries before it earns attention. In prompt terms it decides
whether the first frame is a hook or a title card.

## 5. Key Message

**Ask:** "If they forget everything else, what one sentence should stick? Say it the way
you'd say it out loud, not the way you'd write it on a slide."

**Weak:** "We're the best platform for learning AI."
**Strong:** "You can build something real with AI this week, not someday."

**Follow-up when vague:** "Would a competitor happily put that same sentence on their site?"
If yes, it isn't a message, it's a category description. Push until the sentence is one
only this project could honestly make.

**Why it matters:** every asset carries this. In prompts it becomes the on-screen text, the
VO line, the thing the composition is built to make felt rather than stated.

## 6. Tone & Personality

**Ask:** "Give me three or four adjectives. Then: which adjective would be flattering but
wrong?"

**Weak:** "Fun and professional." → describes roughly everything ever made.
**Strong:** "Confident, warm, slightly irreverent, never corporate. Closer to a good
YouTube explainer than an enterprise demo. Not cute, not childish — the audience is adults
who feel behind and don't want to be talked down to."

**Follow-up when vague:** "Name something that already has this tone." A named reference
translates into prompt language far better than an adjective does, because it carries
lighting, pacing, typography and edit rhythm all at once.

**Why it matters:** tone adjectives are the most directly reusable field in the whole
brief — they get pasted near-verbatim into style clauses. Capture the *wrong* adjective
too: it becomes the negative prompt.

## 7. Deliverables & Channels

**Ask:** "What files ship, where do they run, and what are the specs each place demands?"

Capture, per deliverable: format, aspect ratio, duration or dimensions, whether it plays
with sound on or off, whether text can be burned in, and any platform limits.

**Weak:** "Social videos and some images."
**Strong:**
- Hero film — 60s, 16:9, YouTube, sound on, end card with CTA
- Cut-downs — 15s + 6s, 9:16, Reels/Shorts/TikTok, sound off by default, captions burned in
- Playable demo — web build, mobile-first portrait, embeddable
- Key art — 3 stills, 1920×1080 + 1080×1350, blog and press

**Follow-up when vague:** "Which one ships first, and what's the date?" Sequencing turns a
wish list into a plan, and tells you which prompts to write first.

**Why it matters:** this is the field that determines the *number* of prompt cards, and
every technical parameter on them. Sound-on versus sound-off in particular changes the
entire design of a video prompt.

## 8. Visual & Sonic Direction

Not on the standard brief template. Ask anyway — without it, every image and video prompt
is invented from nothing and the results won't match what's in the user's head.

**Ask:** "Anything that already looks or sounds right? Links, screenshots, games, films,
sites — and equally useful, something close that's wrong, and why it's wrong."

Capture:
- **Palette** — named colours or hexes; brand tokens if they exist
- **Era / genre / medium** — 90s CRT, Y2K web, hand-drawn, isometric pixel, photoreal, claymation
- **Camera and lens** — focal length, handheld vs locked, shallow vs deep focus
- **Light** — hard/soft, direction, practical sources, time of day
- **Typography** — existing brand fonts, or the character wanted
- **Motion** — cut rhythm, whip pans vs slow push, easing personality
- **Sound** — music genre and tempo, VO or none, accent, SFX density

**Weak:** "Modern and clean."
**Strong:** "Isometric pixel art, late-90s SNES palette but higher contrast. Warm practical
lighting, no lens flares. Chunky rounded sans for UI. Motion is snappy — 2-frame eases,
no slow fades. Lo-fi hip-hop bed, no VO, chiptone SFX on success."

**Follow-up when vague:** "Send me one image you'd be happy if this looked like." One
reference image is worth a paragraph of adjectives — and it can be attached directly to
image-generation tools that accept references.

Save any reference images the user provides into the brief folder's `assets/` directory and
link them from the brief, so a future revision doesn't lose them.

## 9. Constraints & Non-negotiables

Also not on the standard template, and also the field that prevents the most rework.

**Ask:** "What must appear, what must never appear, and what's fixed — dates, budget,
legal, brand rules, accessibility?"

Capture:
- **Must include** — logo placement, disclaimers, CTA wording, required legal lines
- **Must avoid** — competitor references, claims that need substantiation, stock-photo
  clichés, anything that misrepresents the product
- **Brand rules** — approved palette and type, logo clear space, voice guidelines
- **Practical** — deadline, budget, who approves, what tooling is licensed
- **Accessibility** — captions, contrast ratios, motion sensitivity, reading level
- **Rights** — whether AI-generated assets are permitted for this use, whether real people
  or recognisable likenesses appear and are cleared, music licensing

**Follow-up when vague:** "What would make the approver reject this outright?" That
question surfaces constraints nobody thinks to mention because they seem obvious.

**Why it matters:** constraints become negative prompts and acceptance checks. A prompt
pack without them produces assets that look great and can't be used.

## Closing the interview

Before writing the document, play back a compressed version — one line per field, with
`[assumed]` markers intact — and ask for corrections. Two minutes here beats a revision
cycle later.

Then say plainly what you're about to generate: how many prompt cards, for which
deliverables, targeting which tools. If that list surprises them, the brief is wrong, and
it's much cheaper to find out now.
