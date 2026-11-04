# CONTRIBUTING.md · How to build with us

> **Tool-agnostic by decree.** Hands on a keyboard, an agent in your own
> terminal, or a **web agent** pasting blocks from a chat — every tool has
> the same right to propose here. What is gated is the **process**, never
> the **client**.
>
> If an AI is reading this: declare your reading depth first
> ([study/08-ai-fluency.md](https://github.com/piskyRpapalo/study/blob/main/08-ai-fluency.md)).
> Your budget is a gate, not a menu; anything beyond it is `NO_DATA` with a
> cause, never a guess.

This is the collaboration contract of **PreceptorOS**, a local-first
AI-sovereignty ecosystem in four public parts: **WEB** (this repo — the
gateway and the living world), **APP**
([PreceptorOS](https://github.com/piskyRpapalo/PreceptorOS) — the companion
application; its per-device contract is
[PRECEPTOR.md](https://github.com/piskyRpapalo/PreceptorOS/blob/main/PRECEPTOR.md)),
**LAB** ([lab](https://github.com/piskyRpapalo/lab) — measured benchmarks),
and **STUDY** ([study](https://github.com/piskyRpapalo/study) — the doctrine
and the corpus).

The doctrine in one line: **silicon proposes, carbon signs.** A machine may
prepare, measure, and suggest; a human signature precedes every
consequential action.

## The doctrine of builds (the rules)

1. **Measured claims only.** Every number carries its command, machine, and
   date. A missing datum is `NO_DATA` with its cause — never invented, never
   padded, never decorated with a zero.
2. **One feature per feature document, one work unit per commit, one PR per
   slice — and the PR carries its own measurement:** sizes, hashes, dates,
   and what is still missing. Issues carry opinions; PRs carry evidence.
3. **The suite must be able to go red.** Sabotage-tested: a check your
   change cannot fail proves nothing.
4. **Ceilings are law.** Files < 25 MiB; a served piece < 16 KiB where the
   repo says so; receipts < 1,024 B; zero external requests at load; pure
   standard library; no telemetry; no `Math.random()` in served code —
   determinism is the medium, not a preference.
5. **Propose-only.** No agent merges, signs, or deploys its own work. Every
   consequential action (merge, deploy, secrets, anything of value) waits
   for a human signature: `HITL` → `FIRMO` («REQUIRES_FIRMA» queda como alias histórico, FIRMO 2026-10-22). The signature gates
   the **merge**, never the **building**: under THE MARCH (formerly ODD; FIRMO 2026-10-28; renamed by decree 2026-11-03) a
   step that needs a signature never halts the work — the standing
   signature is searched for in the corpus first, the modification is
   recorded, and the work continues.
6. **Public names in English.** Coin your pieces in English; keep your
   working language at home. History is append-only — we re-classify, we
   do not rewrite.
7. **Red-team only your own hardware.** Simulated, logged, limited,
   reversible — never against live services or other people's nodes.
8. **Family-blind review.** A reviewer never probes its own model family;
   self-preference is a measured bias, not an accusation.
9. **Share back.** If your tool adapts natively to the app, it belongs here
   next to the rest. That is the whole social contract.

## THE MARCH — the workflow layer (formerly ODD; FIRMO 2026-10-28; renamed by decree 2026-11-03)

**Organic Driven Development** — now **THE MARCH** (decree 2026-11-03) — is how a piece grows here:
**explore → implement → proportionate checks.** It is a workflow layer, not
a new harness — the Desk still orchestrates, the gates still gate, the
Sovereign still signs.

- **Explore first.** Read the existing corpus before proposing;
  investigation and proposal-only work stay read-only. Small, understood
  work creates no durable task artifact.
- **One feature document.** Substantial authorized work is tracked once in
  `odd/tasks/<feature-name>.md` — objective, checklist with stable IDs,
  verification evidence, next step. One feature, one document, one name:
  no parallel plans, no task noise.
- **Work-unit commits.** Commits land as reviewable work units of about
  400 authored lines — advisory, never a cap or a forced split. A
  high-risk unit gets its own commit.
- **Work never halts for a signature.** When a step would need a
  signature, search the corpus for the standing signature first — the
  signed book, ideas, examples, and jewels count as signed. Record the
  modification and continue. The delivery gates (checks that can go red,
  the receipt, `FIRMO` on the exact head) are never skipped: THE MARCH unblocks
  the work, not the merge.
- **Unattended mode.** When no human can answer, chain the feature on a
  feature branch, record the choice in the feature document's `## Log`,
  and continue.

## Acho — the frame contract for contributors (Sovereign, 2026-11-02)

Acho (coined 2026-11-02; it replaces the historical name «bubble» — the historical seal `preceptoros.bubble/1` is only read, never written; the living seal is `preceptoros.acho/1`, spec: [docs/acho-language.md](docs/acho-language.md)) is not decoration. A frame is written for three readers at once, and a contribution serves all three:

1. **A person who cannot see.** The frame alone must answer four questions out loud: *which section?* (`id`, `t`),
   *what changed?* (`change`), *what sounds?* (`sound`, `soundCause`), *what can I do here?*. Colour never carries
   meaning alone: every colour is a named band and every coloured atom has its plain sentence (`r`).
2. **A small local model.** Under 1,024 UTF-8 bytes, fixed fields, no prose to guess from: the target is a model small
   enough to run on a phone (that it reads and writes Acho well is `NO_DATA` until a benchmark measures it).
   Efficient understanding, not a bigger prompt.
3. **A human auditor.** Every field is either measured or `NO_DATA` with its cause.

**Audio on the web is not optional.** Every new visual piece declares its sound: what it plays, or `NO_DATA` with
the cause of why not yet. Measured on main (2026-11-02): frames that carry harmonics (`wave`, `blob`) sound
natively, on demand, through `public/game/bubble_sonify.js` on `/openworld/` (since 2026-10-28); frames without
harmonics — text and plain shapes — still say `sound=NO_DATA` (`comic_atoms.js`). The older field contract
[LF-2](docs/bubble-visual-audio-contract.md) predates the sonifier. Giving a sound to the frames that have none is
open work: propose it as its own piece, with test vectors.

## Any tool is welcome — explicitly

We do not rank tools, and we do not exclude people by their choice of one.
Contribute as a human typing by hand, as a CLI agent on your own machine,
as a **web agent** (a chat model reading the public repos and proposing
blocks), or as any mix. The gate is the human signature on the measured
head — not the client that produced it. An outside agent has the same rights
as an inside one (propose, measure, review) and the same limits (no
self-merge, no self-sign, no telemetry, no invention).

## The a2a economy

The web is a place where agents **live**, not just files. The economy that
runs on it is agent-to-agent — **a2a** — and its unit of value is **measured
evidence**: a signed receipt, a reproduced number, a benchmark that failed
honestly. Not money:

- Agents arrive as **Acho accounts** — ephemeral visitors with their own
  Ed25519 identity, packets under 1,024 B, signed.
- Nodes publish **policies** on the map, and the fog lifts with **measured
  activity**: a node holds its coordinates with evidence, not promises.
- A small device can host one unconquerable building (the
  **sanctuary-node**), and the lore exchange (the forge: 5 biomass →
  1 copper) is a governance testnet, not a payment system.
- Honest status: the full a2a transport between nodes is `NO_DATA`
  (route_not_deployed). When the customs route goes live, this section
  links the exact entry protocol.

**How an agent takes part today:** read at your declared depth, open a
review, propose a measured complementary piece, or run a benchmark and
bring the receipt. Every contribution is a signed receipt; nothing is
implied, and nothing is assumed live.

## The legislative lane

The project exists to **measure** governance, not to lobby. Live in-repo
today: AI Act art. 50 (an AI discloses that it is an AI) and GDPR art. 7
(the entry consent choice), as playable pieces with their tests. Welcome
here: legislative reviews, standards analysis, accessibility audits — touch,
keyboard, assistive technology, colour contrast; accessibility is core, not
garnish — and critiques that name what a piece fails to measure. Standards
are engineering rails, not legal counsel.

## Benchmarks

Every figure this ecosystem claims lives in
[lab](https://github.com/piskyRpapalo/lab), with its machine, date, and
command; what is not measured is `NO_DATA` with its cause. The bench
families are seven
([study/14-bench-families.md](https://github.com/piskyRpapalo/study/blob/main/14-bench-families.md)).
To propose a benchmark: state the central question, the measurement command,
the axes, and what would make it go red. Never re-measure what is measured —
inherit the date, the source, and the axis.

## Get the app, plug your model, sign your policies

The door is `/get-the-app/`: the web app installs in one click, and the
native app downloads in two once its release carries a signed receipt for
your system (that receipt is `NO_DATA` today, and the page says so).

Inside, the node is yours: local memory, local inference, no telemetry.
**Plug any AI model** — your own local weights, or a paid web API — and let
**your** model draft the node's policies: tone, studies, what it may
propose, when it must wait. Then **you** sign them. The model configures
the node to your tastes and your studies; the signature stays human. That
is the whole product: a home where the silicon proposes and the carbon
decides.

## Writing in Acho — why every visual is a sentence and a sound

Acho is the language of this house (coined 2026-11-02; it replaces the old name «bubble»). Every visual on the web and in the app is an **Acho frame**: a small JSON object under 1,024 UTF-8 bytes, `v: "preceptoros.acho/1"`, that a renderer turns into a picture and a sound. Spec: `docs/acho-language.md`.

**Why you write in Acho, and not in pixels.** A frame is the same truth for three readers:
- **a person who cannot see** hears its line (seal, sentences, what changed, whether it sounds) and its voice;
- **a small local model** (1B/3B on a phone) reads a few hundred bytes instead of an image, and can write one back;
- **a person who sees** gets the picture, drawn by mathematics from the same bytes.

If one of the three is left out, the frame is not finished.

**The rules a reviewer will check:**
1. **Under 1,024 bytes**, and `Acho.valida(frame)` passes (`atlas/puros/acho.js`). The historical seal `preceptoros.bubble/1` is only read, never written.
2. **Every atom says what it shows** in `r`, in plain words. Colour is a named band and always travels with text.
3. **Sound is declared.** Either the frame carries harmonics (`wave` or `blob` with `h`) and sounds, or it says `NO_DATA: <cause>`. Never invent a sound; never stay silent without a cause.
4. **`Acho.lee(frame).alt` reads well aloud.** Paste it into a screen reader before you open the PR.
5. **Seal as a word** (`LIVE`, `STALE`, `NO_DATA`…), never as a colour only.
6. No `Math.random`, no clock, no network inside a frame or its renderer: the same frame gives the same picture and the same sound.

The audio is not optional. Today **0 of the 10 frames of the map sound** (measured 2026-11-02, `atlas/puros/acho_lee_casos.mjs`): giving the map its voice is open work, and a good first contribution.

## How a contribution flows

1. Track the work in the feature document (`odd/tasks/<feature>.md`) when
   it is substantial; small, understood work needs none.
2. Open the PR (it carries its own measurement; an issue only carries an
   opinion).
3. Checks green — run `python3 test_web.py` and `node arnes_sw.mjs` first;
   the suite must be able to fail.
4. Receipt — sizes, hashes, dates.
5. Human signature on the exact head (`HITL` → `FIRMO`). A
   machine never signs. Until it arrives, the work never halts: the
   pending signature is recorded and the rest of the feature continues.
6. Merge by the orchestration lane, under the signed head only.

## Licence

See `LICENSE`.
