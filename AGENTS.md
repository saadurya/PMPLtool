# AGENTS.md

## What this is

PMPLtool is a vanilla JS single-page app that teaches PM thinking by guiding a user through a product problem. No framework, no bundler, no build system. Pure HTML + CSS + ES modules.

Product principle: **the problem determines the roadmap.** The user enters ONLY a problem statement; everything after that is click-based (READ → THINK → SELECT → LEARN → CONTINUE). The user should never be made to type repeated evidence/metrics/hypotheses.

## How to run

Requires a local HTTP server (ES modules block `file://` URLs due to CORS):

```
npx serve .
```

Then open `http://localhost:3000`. No install, no build step. No npm package exists; do not introduce one unless asked.

## Phase 2 user flow

```
Problem → Clarify (2 rounds) → Know/Don't Know → Investigation Path →
Possible Scenarios → So What? → Hypotheses → Prioritization → Complete
```

`session.step` values: `"problem" | "clarify" | "investigate" | "hypotheses" | "complete"`.
Within the investigate step, `investigation.stage` drives the screens:
`"knowledge" | "paths" | "scenarios" | "sowhat"`. `renderInvestigate()` in screens.js is a stage dispatcher.

## Architecture

```
index.html              — shell; renders all screens into .hero (static, no form markup)
app.js                  — entry point; calls init() from screens.js
js/state.js             — localStorage persistence (key: "pmpltool-investigation") + session model
js/classifier.js        — pure reasoning: classifies problem text (ambiguity, type, entities)
js/clarification.js     — pure reasoning: generates clickable clarification questions + follow-ups
js/investigation.js     — pure reasoning: builds per-type investigation paths + their SCENARIOS (content only)
js/knowledge.js         — pure reasoning: what we know / don't know from clarification answers
js/scenarios.js         — pure reasoning: expands scenarios + synthesizes the "So what?" learning layer
js/hypotheses.js        — pure reasoning: competing hypothesis generation, validation recommendation, prioritization
js/screens.js           — all DOM rendering + click-based navigation (the UI layer)
style.css               — all styles; responsive with media queries
docs/                   — product vision, problem definition, decision log (not code)
```

## Core split: reasoning vs UI

- **Reasoning is pure logic.** `classifier.js`, `clarification.js`, `investigation.js`, `knowledge.js`, `scenarios.js` and `hypotheses.js` never touch the DOM or localStorage. They accept plain structured inputs and return plain structured outputs.
- **`screens.js` is the only UI layer.** It imports reasoning modules, reads/writes state, renders `document.querySelector(".hero").innerHTML`, and wires event listeners after each render.
- **Derived content is recomputed, never stored.** State holds only user selections (path id, scenario ids, method choices). Knowledge synthesis, "So what?", hypotheses and priority order are recomputed on every render by pure functions.
- Keeping reasoning separate is a deliberate invariant: you must be able to change reasoning logic without rewriting screens (and add a web-research evidence layer later without entangling it in reasoning).

## Scenarios != findings (epistemic discipline)

- A **scenario** is a plausible explanation worth CHECKING. It is never evidence, never a fact. Every scenario in the UI is labelled **HYPOTHETICAL — NOT VERIFIED**, and "So what?" / hypotheses use only conditional language ("If this were true…", "This could lead to…", "We still don't know…").
- Research/evidence is out of scope for now. The seam is reserved: scenario and hypothesis objects carry `evidenceStatus` and can later accept an `evidence` attachment from a future `js/research.js` layer to become **VERIFIED EXTERNAL INFORMATION** / a real finding — without changing the UI.
- Content (scenarios in `investigation.js`, unknowns in `knowledge.js`) is deterministic Phase 2 teaching content. Keep it as DATA, never as logic, so a future AI/research layer can replace or enrich it through the same pure-function interfaces.

Epistemic status codes used in the UI: `user-statement`, `statement`, `refined-interpretation`, `refined`, `assumption`, `unknown`, `hypothetical-scenario`, `hypothesis`, `inference`, `finding`, `verified-external`. Never present an assumption, scenario or hypothesis as a fact.

## Data model

The investigation state (in `state.js`) holds:
- `problem` — `{ text, classified, status: "statement" }`; `classified` is the output of `classifier.classifyProblem()`
- `clarification` — `{ round, answers: { [questionKey]: selectedOptionValue }, refined }`; `refined` is set by `synthesizeClarifiedProblem()` once clarification completes
- `investigation` — `{ stage: "knowledge" | "paths" | "scenarios" | "sowhat", selectedPathId: "<type>.<n>", selectedScenarios: { "<type>.<n>": ["...s<k>"] } }`
- `hypotheses` — `{ selected: ["hyp-primary" | "hyp-competing" | "hyp-alternative"], methodChoices: { "<id>": "logs" | "interview" | "experiment" } }`
- `session` — `{ step: "problem" | "clarify" | "investigate" | "hypotheses" | "complete", history }`

## If you're adding a new screen

1. Add a render function in `screens.js` that sets `hero.innerHTML`.
2. Wire event listeners AFTER the HTML is inserted (this is how all screens work).
3. Update state via `updateInvestigation()` / `patchSection()` from `state.js`.
4. Add matching classes in `style.css` (class names are explicit, not generated).
5. If the flow order changes, update `renderProgress()` in `screens.js` and the `session.step` values in `state.js`.

## If you're adding a problem type to the reasoning

1. Add a keyword rule in `classifier.js` (see `ruleSet` in `classifyProblem()`).
2. Add a `buildXxxClarification()` function + follow-up in `clarification.js` (see the case selector in `buildFirstRound()`/`buildFollowup()`).
3. Add investigation paths + 3 scenarios per path in `buildInvestigationPaths()` in `js/investigation.js` under the matching type key. Use the `withPath(type, n, scenarios)` helper so every scenario gets a stable `id`/`path` and the required fields (`scenario, meaning, whyPMCare, userBehaviour, businessConsequence, unknown, nextQuestion, theme`).
4. Add open questions in `buildKnowns()` / `TYPE_UNKNOWNS` in `js/knowledge.js`, and implication/counter-hypothesis lines in `scenarios.js` / `hypotheses.js` if needed.

The competitive clarification uses detected entities from the classifier (e.g. "What is the user doing on PhonePe that they cannot or will not do on GPay?") — entity placeholders must be resolved at build time, never left as literals.

## Hypotheses & prioritization

- `generateHypotheses()` always returns a small set of competing hypotheses: a **primary** (converged from the dominant scenario theme), a **competing** explanation, and an explicit **alternative** ("the assumed explanation may be wrong") to avoid confirmation bias.
- Validation methods are **recommended by the system** and shown alongside educational alternatives. Choosing an alternative (`methodChoices`) is optional and only refines prioritization rationale.
- `prioritizeHypotheses()` orders by qualitative concepts (potential impact, uncertainty, strength of support, ease/speed of validation, learning value). It must never present a fake numeric score as the answer.

## Gotchas

- **Answer-clobber bug pattern:** when wiring option-selection handlers, read the LATEST state via `getInvestigation()` inside the handler, NOT a closure snapshot from render time. Multiple clicked options on one screen must merge onto live state or earlier answers get overwritten. Use `patchSection("investigation" | "hypotheses", ...)` for nested sections.
- **Back navigation:** `renderClarify()` deliberately does NOT auto-redirect when `refined` is set — users return there from the investigate screen to review choices. Continue re-synthesizes and moves forward, and resets `investigation` (stale path/scenario selections are invalidated). Every Phase 2 stage has an explicit Back button; the dispatcher routes by `investigation.stage`, never by URL.
- **`--dump-dom` does not wait for `type="module"` scripts.** For browser verification, drive the page over the DevTools Protocol (Edge headless with `--remote-debugging-port`) instead.
- The app has no backend, no API calls. Web research is planned as an optional future evidence layer, not part of the reasoning engine.
- When changing `escapeHTML` interplay: user text is always escaped before insertion into HTML strings (see `escapeHTML()` in `screens.js`).
- No tests, no linting, no CI. If you add tooling, document the commands here.