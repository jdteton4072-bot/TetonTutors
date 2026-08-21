# Teton Tutors Build Spec

**Product architecture & assessment-engine specification — 90-day MVP**

| | |
|---|---|
| Doc | TT-SPEC-001 · v0.1 draft |
| Date | 2026-08-21 |
| Owners | TPM (platform/data) · Eng-tutor (engine/content) |
| Scope | Digital SAT (full) · ACT (engine only) · AP Calc AB FRQ (pilot) |
| Status | Awaiting founder review + psychometric consult on flagged items |

> **Basis note.** The Prompt-1 executive report was not attached when this spec was drafted, so it proceeds from established context: two founders, bootstrapped, first release in 90 days; SAT/ACT/AP test-prep marketplace; tutors are college students and HS teachers with uneven training. If the executive report contradicts an assumption here, the report wins — re-run the affected section.

Written for the two people building it. Every call in this document is a decision, not an option.

---

## 1. System architecture: components and data flow

> **DECIDED — stack.** ASP.NET Core 8 **modular monolith**, PostgreSQL 16, React + TypeScript (Vite) frontend, KaTeX for math rendering. Hosted on Azure App Service (B-tier) + Azure Database for PostgreSQL Flexible Server, one region, ~$80–120/mo. Nightly jobs via Hangfire in-process — no queues, no microservices, no second database.
>
> Rationale: the TPM writes C#; a monolith is the only architecture two people can operate. React over Blazor for one reason — the test player (timers, module transitions, math entry, mobile) lives or dies on frontend ecosystem, and future hires will be React hires. Everything else is the most boring possible choice, on purpose.

### Modules (in one deployable)

- **Marketplace** — accounts (ASP.NET Identity), student–tutor pairing (manual concierge via admin screen — no matching algorithm), Stripe Connect Express for payments and tutor payouts, Cal.com hosted for scheduling, Zoom links for video. All four are buys; none is differentiating.
- **Item Bank** — authoring pipeline (LLM draft → human review queue → pretest pool → operational), item versioning, exposure counters. The review UI is a first-class product surface, not an admin afterthought: it is where item quality is actually made.
- **Assessment Runner** — serves drills, sections, and full-length multistage tests; owns timing, module routing, and response capture.
- **Calibration Job** — nightly Hangfire job that re-estimates item difficulty and student ability from the response log and writes updated parameters. It is a batch job, not a service.
- **Copilot Service** — single LLM gateway module. Every model call in the product goes through it: one place for prompt templates, retries, cost metering, and full request/response logging.
- **Event Log** — one append-only `events` table (JSONB payloads, typed `event_kind`). This is the spine of the system and the entire efficacy story (§5). Nothing writes analytics anywhere else.

### Data flow

```
AUTHOR   llm draft ──► human review ──► pretest pool ──► operational bank
PRACTICE bank ──► assessment runner ──► response events ──► nightly
         calibration ──► updated b-params ──► routing + score prediction
COPILOT  student model (θ by domain + miss log) ──► session brief /
         in-session moves / parent report draft ──► tutor approves
ALL      every arrow above emits to the append-only event log
```

Item content is structured JSON in Postgres JSONB (stem, choices, LaTeX strings, figures as stored SVG/PNG). No CMS. No document store. One database backs product, calibration, and (via a read replica later, same DB for now) the Metabase analytics dashboard.

## 2. AI capability stack

Rule applied throughout: **buy every model, build every harness.** In 90 days you fine-tune nothing and train nothing — there is no data to train on and no time to validate it. The defensible asset is not a model; it is the reviewed, calibrated item bank and the response log.

| Capability | Build/Buy | Model / Service | What breaks if it's wrong — and the mitigation |
|---|---|---|---|
| Item drafting (stem, key, distractors, rationales, tags) | BUY | `claude-opus-5` via Batch API (50% off) | Plausible-but-flawed items poison the bank and every score downstream. Mitigation: *nothing* reaches students without human review, and nothing counts toward a score until calibrated (§3). Budget for a 25–35% rejection rate at review. |
| Difficulty pre-estimation (cold-start prior) | BUY | `claude-sonnet-5`, 5-vote ensemble | Systematic bias skews module routing for early students. Mitigation: LLM rating is one of two raters (§3.2), enters only as a Bayesian prior, and its weight decays to zero as real responses arrive. |
| Diagnostic skill tagging | BUY | `claude-sonnet-5`, fixed taxonomy enum | Wrong tag → wrong practice assignment → student drills the wrong skill. Mitigation: tags reviewed in the same human pass as the item; tutors can retag in one click; every retag is logged and feeds taxonomy fixes. |
| AP Calc AB free-response scoring (pilot) | BUY | `claude-opus-5`, rubric-anchored, 3-pass median | Lenient drift silently inflates predicted AP scores — the worst trust failure available to us. Mitigation: score displayed as a provisional band, never a point value; the tutor confirms or corrects every FRQ score at the next session; disagreements are logged and become the grader's validation set. |
| Handwritten work capture (photo → transcript) | BUY | `claude-sonnet-5` (vision) | A mistranscribed exponent grades correct work wrong. Mitigation: student sees and confirms the transcript before anything is scored; confirmation is a logged event. |
| Tutor copilot (brief, in-session moves, parent report) | BUY | `claude-sonnet-5`, streaming | A hallucinated claim in a parent email is a churn event and possibly worse. Mitigation: every number in a parent report is injected from the database, never generated; the LLM writes narrative glue only; a tutor must approve before send — hard gate, no bypass (§4). |
| Score prediction | **BUILD** | ~300 lines: Rasch θ → scaled-score map | A bad single-number prediction destroys credibility with parents. Mitigation: it is statistics, not an LLM — predictions ship only as ranges anchored to an official practice test (§3.4). Never show a point score. |
| Near-duplicate item detection | BUY | Voyage AI embeddings + cosine threshold (Anthropic has no embeddings product) | Near-dupes leak across a student's sessions and corrupt calibration (second exposure ≠ independent response). Mitigation: dedupe check at authoring time plus per-student exposure control at serve time; the latter limits damage even when the former misses. |

**Cost reality check** (bootstrapped, so it matters): item drafting through the Batch API runs roughly $0.05/item — the entire launch bank drafts for under $150. FRQ scoring ≈ $0.15/response at three passes. Copilot calls are cents per session on Sonnet 5. Total model spend through launch should stay under $300/mo; if it doesn't, the meter in the Copilot Service gateway tells you exactly which template to fix.

## 3. Assessment engine

### 3.1 The item

An item is one row, and it is not done until every field is filled: stem; choices; key; format (`MC4` | `SPR` student-produced response | `FRQ`); difficulty parameter *b* with standard error and status (`draft → review → pretest → operational → retired`); content domain from the College Board's published taxonomy; one to three skill tags from our ~70-node skill tree; a written **distractor rationale per wrong answer** naming the specific student error that produces it (e.g. "sign error distributing the negative"); author/source; exposure count; rolling classical stats (p-value, point-biserial).

The distractor rationale is load-bearing, not documentation: it is what turns a wrong answer into a targeted assignment (§4) and it is the first thing the human reviewer rejects an item over. An AI-drafted rationale that doesn't name a real misconception means the distractor is decorative and the item goes back.

**Legal boundary, decided now:** no College Board or ACT items ever enter the bank — not "adapted," not paraphrased from memory of real tests. Official released practice tests are used only as external anchors, taken by students in Bluebook, with results entered into our system (§3.4). This keeps the bank clean and the company un-suable.

### 3.2 Calibration and the cold start

> **DECIDED — measurement model.** Rasch (1PL), not 2PL/3PL. Discrimination and guessing parameters need 500–1,000+ responses per item to estimate stably; Rasch is usable at 150–200. With our volumes, a 3PL is a fiction with extra decimal places. Guessing on 4-choice items is handled by not over-interpreting low-θ responses, not by modeling *c*.

Before any student data exists, every item gets a difficulty *prior* from two independent raters: (1) the human reviewer estimates the percent of a defined reference group (a mid-pack junior scoring ~1050) who would answer correctly — a lightweight Angoff-style judgment; (2) the LLM ensemble produces the same estimate. The two are averaged, mapped to a provisional *b*, and weighted as ~30 pseudo-responses in the Bayesian update. The nightly job then re-estimates *b* (EAP) as real responses accumulate; the prior's influence decays automatically.

Lifecycle: every item enters as **pretest** — served inside drills and mixed into practice sets, but never counted in any displayed score. Promotion to **operational** requires ≥150 responses and infit/outfit inside 0.8–1.2. For the first 4–6 weeks essentially the whole bank is pretest, so every score shown is labeled *provisional estimate* in the UI. That label is honest and it is temporary; do not ship without it.

> ⚠ **PSYCHOMETRIC REVIEW REQUIRED BEFORE LAUNCH.** Four assumptions here need a credentialed psychometrician (budget ~10 consulting hours, ~$2K): (1) Rasch over 2PL at our sample sizes; (2) the 30-pseudo-response prior weight; (3) the n≥150 / infit–outfit promotion thresholds; (4) treating tutor-supervised and homework responses as exchangeable for calibration — they likely aren't, and the fix may be a context covariate or homework-only calibration.

### 3.3 Adaptivity

> **DECIDED — module-level MST, and here is the argument.** Two-stage multistage testing exactly as the digital SAT implements it: a mixed-difficulty routing module, then an easier or harder second module chosen by raw-score threshold on module 1. We route on **raw score**, as the College Board does — not on θ — because raw-score routing is robust to the noisy provisional *b*-parameters we will have for months. Per-question CAT would be *worse* for us, not just harder: it needs precise item parameters we don't have, complicates exposure control against a small bank, and practices a test experience the student will never sit. Face validity is pedagogy here — students must rehearse the real format, including the feeling of module 2 getting harder.

Structure mirrors the real dSAT: Reading & Writing 27 questions/module, Math 22/module. One full-length form consumes three modules per section (router + easy + hard variants), assembled to the content-domain blueprint. Drills are separate: an Elo-style picker serves the next item near the student's skill-level θ — unscored, so provisional parameters are fine, and it doubles as the pretest data pump. ACT is a linear form — the runner treats it as an MST with one stage and no routing, so the engine supports it on day one even though ACT *content* is deferred (§6).

> ⚠ **PSYCHOMETRIC REVIEW REQUIRED.** Initial module-routing cut scores will be set by expert judgment and tuned from early response data. A reviewer should bless the cut-setting procedure and the module assembly targets (mean/spread of *b* per module) before we advertise the full-length test as "adaptive like the real SAT."

### 3.4 Score prediction

Section θ from the Rasch model maps to a scaled-score range via anchoring: every student takes one official full-length practice test in Bluebook at intake (non-negotiable onboarding step — it is also the efficacy baseline, §5), and the mapping is fit from (our θ, their official score) pairs, seeded before data exists by the founders and early beta students taking both. Predictions display as a range — "640–690" — roughly ±1 SEM, never a point value. Small-N honesty: until ~30 anchor pairs exist per section, the range widens and the UI says so.

> ⚠ **PSYCHOMETRIC REVIEW REQUIRED.** Mapping a proprietary θ to the College Board scale from small-N anchor pairs is the weakest link in the engine. A reviewer must approve the method (likely linear-then-equipercentile as N grows) and the minimum N before predicted ranges are shown to parents at all.

### 3.5 Bank targets and the review bottleneck

Day-90 target: **900 reviewed items** — 450 Math, 450 R&W. That supports three distinct full-length forms per section (3 forms × ~147 items) plus drill depth in the highest-traffic skills. Drafting is not the constraint; review is. At 8–12 fully-reviewed items/hour (including rationale and tag checks), 900 items is ~85–110 review hours over ten weeks. The engineer-tutor reviews all Math. **Decided:** contract an ELA reviewer (HS English teacher, ~10 hrs/week, ~$3–4K total) for R&W — this is one of only two outside spends in the MVP, and it is not optional; the alternative is an uncalibrated verbal bank reviewed by two math people.

## 4. Tutor copilot

Design principle: the copilot's job is to make the median session look like a good tutor's session — **protocol plus data**, not chat. Tutors with uneven training don't need a brainstorming partner; they need the student's actual data pre-digested and a structure that's hard to do badly. Every copilot output carries accept / edit / reject controls, and every one of those choices is logged (§5) — it is both a quality signal and the measure of whether the copilot is actually lifting the floor.

### 4.1 Pre-session brief

Generated automatically before each session from the response log: θ trend by content domain; the top three misconception clusters, pulled from the distractor rationales of recent misses ("has missed 4 items on sign errors when distributing"); and a three-block session plan — review recent misses, teach one target skill, timed set — with the items already queued. The tutor reads it in two minutes and can swap any block.

### 4.2 In-session moves

The student works the assigned set in-platform during the session; the tutor sees a live console. On a miss, the console surfaces three things: the distractor rationale for the answer the student chose, one Socratic prompt aimed at that misconception ("ask her what happens to the inequality when she divides by a negative"), and a queued parallel item to confirm the fix. **Decided: no audio capture in the MVP.** An ambient copilot that listens to the session is a real product idea and a real consent, privacy, and latency project — it is deferred, and the item-event-driven console above delivers 80% of the mid-session value at 5% of the build.

### 4.3 Post-session parent report

The tutor fills three fields at session end — what we covered beyond the platform, one win, next focus (two minutes, enforced before the session closes out). The system merges those with logged data (items attempted, accuracy by skill, drill completion since last session) into a drafted parent email. Hard rule stated once more because it is the one that matters: **numbers come only from the database; the model writes connective prose; the tutor approves before anything sends.** Tutor edits to drafts are logged and diffed — a rising edit rate on one template is a prompt bug, and a falling one is the copilot learning its job.

## 5. Efficacy measurement plan

The platform must be able to answer "does this work?" from its own logs, from day one — not because a bootstrapped startup will run an RCT, but because the moment a parent or a school asks, the answer must be data, not testimonials.

### Logged from day one (append-only, no exceptions)

- **Item response** — item id, student, chosen answer, correct/incorrect, latency, context (drill | homework | full-length | in-session), θ-before-response, item status (pretest/operational).
- **Session** — start/end, attendance, tutor, plan blocks completed vs. planned.
- **Assignment** — created (by copilot or tutor), completed, days-to-completion.
- **Copilot artifact** — type, accepted/edited/rejected, edit distance on parent reports.
- **Anchor test** — official Bluebook full-length results, entered at intake and at ~week 7.
- **Prediction** — every score range shown, so predictions can later be graded against outcomes.
- **Item health** — rolling p-value, point-biserial, drift alarms, exposure counts (nightly job output).

### Baseline and the metric

The baseline is each student's intake official practice test. The north-star metric is **scaled-score gain per ten tutoring hours**, measured provisionally by the predicted range and validated by the second official test around week 7–8. Secondary: skill-θ movement, assignment completion rate, and copilot edit-rate trend split by tutor experience — that last one is the direct test of "lifts the floor": if novice tutors' student outcomes converge toward experienced tutors' faster than their edit rates alone would predict, the copilot is working.

> ⚠ **CLAIMS DISCIPLINE.** With no comparison group, nothing here supports a causal marketing claim ("students gain X points because of us") — students retest higher on average anyway. Internally, benchmark gains against published average retest improvements; externally, publish nothing beyond descriptive results until N and design justify it. A credentialed reviewer should sign off on any public efficacy statement.

## 6. 90-day cut line

### Ships day 90

- SAT end-to-end: adaptive drills, section practice, three full-length MST forms per section, 900-item reviewed bank, provisional-then-calibrated scoring, predicted score ranges.
- Authoring pipeline with the review UI, dedupe check, and pretest→operational lifecycle.
- Nightly Rasch calibration job and item-health monitors.
- Tutor copilot v1: pre-session brief, in-session console, gated parent reports.
- AP Calc AB FRQ pilot: ~20 in-house FRQs, photo capture, rubric-anchored grading with tutor confirmation. A pilot means: offered to existing students, labeled beta, building the grader's validation set.
- Marketplace-lite: Stripe Connect payments/payouts, Cal.com scheduling, Zoom links, concierge matching, ~10–15 hand-recruited tutors.
- Full event log plus a Metabase dashboard over it.

### Deferred, with the reason

| Deferred | Why |
|---|---|
| ACT content | The engine supports linear forms on day one; authoring ACT items would split the one review pipeline that must produce a credible SAT bank first. Days 91–150. |
| AP subjects beyond Calc AB | Each subject is a new rubric-validation effort. Calc AB is where the in-house expertise is; prove the grader there. |
| Per-question CAT | Argued against on the merits in §3.3, not merely deferred — module-level MST is the right call at our calibration maturity, possibly permanently. |
| Ambient audio copilot | Consent, privacy, and latency project; the in-session console covers the core value (§4.2). |
| Automated tutor matching | Concierge matching is better product research than any cold-start algorithm, and at MVP volume it costs minutes a day. |
| Mobile apps | Responsive web. Two people. |
| In-app video, group classes, essay feedback, gamification | None moves score gains in the next 90 days. |
| Public efficacy claims | Gated on N and reviewer sign-off (§5). |

### Sequence

- **Weeks 1–3** — schema + event log, auth, Stripe/Cal.com wiring, authoring pipeline generating drafts. Contract the ELA reviewer and book the psychometric consult *now*; both have lead time.
- **Weeks 4–6** — review UI live, bank building daily, drill runner with Elo picker shipping to first beta students (pretest data starts flowing).
- **Weeks 7–9** — MST runner, calibration job, score-range prediction, anchor-test intake flow.
- **Weeks 10–12** — copilot (brief → console → parent reports, in that order), AP pilot, Metabase dashboard.
- **Week 13** — buffer; closed beta of 5–10 paying students with the founders tutoring some sessions themselves.

Ownership split: the TPM owns marketplace, data layer, event log, and calibration job; the engineer-tutor owns the assessment runner, item pipeline and Math review, copilot prompts, and the AP pilot. The two outside spends — ELA reviewer (~$3–4K) and psychometric consult (~$2K) — are in scope and already assigned above.

---

*Open items for founder review: (a) confirm the assumptions in the basis note against the Prompt-1 executive report; (b) approve the two contractor spends; (c) schedule the psychometric consult against the four flagged items in §3 and the claims-discipline flag in §5.*
