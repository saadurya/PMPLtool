// PMPLtool — Screen Rendering & Navigation
//
// This file owns the UI. It reads classification / clarification /
// knowledge / scenario / hypothesis output from the reasoning modules and
// renders click-based screens. The user should READ → THINK → SELECT →
// LEARN → CONTINUE. Reasoning logic is deliberately kept OUT of this file.
//
// Phase 2 flow:
//
//   Problem → Clarify → Know/Don't Know → Path → Scenarios → So What?
//   → Hypotheses → Prioritization → Done
//
// Everything is click-based. The only required user input is the problem
// statement. Selections are persisted; derived content is recomputed on each
// render from the pure reasoning modules.


import { classifyProblem } from "./classifier.js";
import {
    buildClarification,
    synthesizeClarifiedProblem
} from "./clarification.js";
import { buildInvestigationPaths } from "./investigation.js";
import { buildKnowns } from "./knowledge.js";
import { buildSoWhat, expandScenario } from "./scenarios.js";
import {
    generateHypotheses,
    prioritizeHypotheses,
    recommendValidation
} from "./hypotheses.js";

import {
    getInvestigation,
    patchSection,
    updateInvestigation,
    newInvestigation
} from "./state.js";



/* -----------------------------------
   ESCAPE
----------------------------------- */

function escapeHTML(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* -----------------------------------
   STATUS BADGES
----------------------------------- */

function statusBadge(status, label) {

    const labels = {
        statement: "USER STATEMENT",
        "user-statement": "USER STATEMENT",
        assumption: "ASSUMPTION",
        unknown: "UNKNOWN",
        hypothesis: "HYPOTHESIS",
        refined: "REFINED PROBLEM",
        "refined-interpretation": "REFINED INTERPRETATION",
        "hypothetical-scenario": "HYPOTHETICAL — NOT VERIFIED",
        inference: "INFERENCE",
        finding: "POSSIBLE FINDING",
        "verified-external": "VERIFIED EXTERNAL INFORMATION"
    };

    const text = label || labels[status] || status.toUpperCase();

    return `<span class="status-badge status-${status}">${text}</span>`;
}


/* -----------------------------------
   PROGRESS
----------------------------------- */

function renderProgress() {

    const steps = [
        "Problem",
        "Clarify",
        "Investigate",
        "Hypotheses",
        "Complete"
    ];

    const state = getInvestigation() || { session: { step: "problem" } };
    const current = state.session ? state.session.step : "problem";

    const order = {
        "problem": 0,
        "clarify": 1,
        "investigate": 2,
        "hypotheses": 3,
        "complete": 4
    };

    const currentIndex = order[current] !== undefined ? order[current] : 0;

    return `
        <div class="progress-strip">
            ${steps.map((label, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                return `
                    <div class="progress-seg ${done ? "done" : ""} ${active ? "active" : ""}">
                        <span class="dot">${done ? "✓" : (i + 1)}</span>
                        <span class="seg-label">${label}</span>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}


/* -----------------------------------
   HELPERS
----------------------------------- */

function isSelected(answers, key, value) {
    return !!(answers && answers[key] && answers[key] === value);
}

function hasAnyAnswer(answers) {
    return !!(answers && Object.keys(answers).length > 0);
}

// Recover the full scenario objects the user selected, across paths.
function getSelectedScenarioObjects(state) {
    const classified = state.problem.classified;
    const paths = buildInvestigationPaths(classified);
    const inv = state.investigation || {};
    const selections = inv.selectedScenarios || {};
    const out = [];

    Object.keys(selections).forEach(pathKey => {
        const n = Number(pathKey.split(".")[1]) - 1;
        const path = paths[n];
        if (!path) return;
        (selections[pathKey] || []).forEach(sid => {
            const scenario = path.scenarios.find(s => s.id === sid);
            if (scenario) out.push(expandScenario(scenario));
        });
    });

    return out;
}

// Path object by "<type>.<n>" id.
function findPathByPathId(classified, pathId) {
    const paths = buildInvestigationPaths(classified);
    const n = Number(String(pathId).split(".")[1]) - 1;
    return paths[n] || null;
}

function restartAndRender() {
    newInvestigation();
    renderProblem();
}


/* -----------------------------------
   PROBLEM SCREEN
----------------------------------- */

export function renderProblem() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    // If already mid-session, resume at the right place.
    if (state && state.session && state.session.step !== "problem") {
        if (state.session.step === "clarify") {
            renderClarify();
            return;
        }
        if (state.session.step === "investigate") {
            renderInvestigate();
            return;
        }
        if (state.session.step === "hypotheses") {
            renderHypotheses();
            return;
        }
        if (state.session.step === "complete") {
            renderComplete();
            return;
        }
    }

    const previous = state && state.problem ? state.problem.text : "";

    hero.innerHTML = `

        <div class="screen-heading">
            <div class="eyebrow">PRODUCT PROBLEM INVESTIGATION</div>
            <h1>What problem are you trying to solve?</h1>
            <p class="intro">
                Start with a problem, signal, or concern. PMPLtool will help you
                sharpen it and figure out what to investigate — the way a strong
                Product Manager would.
            </p>
        </div>

        <form id="problemForm" class="problem-form">

            <label for="problemInput">Product problem</label>
            <textarea
                id="problemInput"
                placeholder="Example: PhonePe has more features than GPay."
                required
            >${escapeHTML(previous)}</textarea>

            <p class="form-hint">
                You only need to describe the problem. PMPLtool will guide the rest
                with choices — no repeated form-filling.
            </p>

            <button type="submit" class="primary-button">
                Start Investigation →
            </button>

        </form>

    `;

    document
        .getElementById("problemForm")
        .addEventListener("submit", function(e) {

            e.preventDefault();

            const problemText =
                document
                    .getElementById("problemInput")
                    .value
                    .trim();

            if (!problemText) {
                alert("Please enter a problem statement first.");
                return;
            }

            const classified = classifyProblem(problemText);

            updateInvestigation({
                problem: {
                    text: problemText,
                    classified,
                    status: "statement"
                },
                clarification: {
                    round: 0,
                    answers: {},
                    refined: null
                },
                investigation: {
                    stage: "knowledge",
                    selectedPathId: null,
                    selectedScenarios: {}
                },
                hypotheses: {
                    selected: [],
                    methodChoices: {}
                },
                session: {
                    step: "clarify",
                    history: []
                }
            });

            renderClarify();
        });
}


/* -----------------------------------
   CLARIFY SCREEN
----------------------------------- */

export function renderClarify() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    if (!state || !state.problem) {
        renderProblem();
        return;
    }

    const classification = state.problem.classified;
    const clarificationState = state.clarification || {
        round: 0,
        answers: {}
    };

    const priorAnswers = clarificationState.answers || {};
    const round = clarificationState.round || 0;

    // Deliberately do NOT auto-redirect to investigate when refined is set.
    // The user can return here from the investigate screen to review their
    // choices; that's a valid state (review round), not an error.

    const content = buildClarification(classification, priorAnswers);

    hero.innerHTML = `

        ${renderProgress()}

        <button class="text-button" id="restartBtn">← Start over</button>

        <div class="screen-heading">
            <div class="eyebrow">${escapeHTML(content.title || "CLARIFICATION")}</div>
            <h2>Let's sharpen the problem</h2>
        </div>

        <p class="instruction-text">
            ${escapeHTML(content.explanation || "")}
        </p>

        <p class="intro">
            ${escapeHTML(content.intro || "")}
        </p>

        <div class="context-card">
            <div class="section-label">YOUR STATEMENT</div>
            <p>${escapeHTML(state.problem.text)}</p>
            ${statusBadge("statement")}
        </div>

        ${content.questions.map((q, qi) => `

            <div class="clarify-question" data-question-index="${qi}">

                <div class="section-label">PM QUESTION ${qi + 1}</div>
                <h3>${escapeHTML(q.label || q.reason)}</h3>

                <p class="question-reason">
                    💡 ${escapeHTML(q.reason || "")}
                </p>

                <div class="choice-grid" data-question-key="${q.key}">
                    ${q.options.map(opt => `
                        <button
                            type="button"
                            class="choice-card
                                ${isSelected(priorAnswers, q.key, opt.value) ? "selected" : ""}"
                            data-question-key="${q.key}"
                            data-option-value="${opt.value}"
                        >
                            ${escapeHTML(opt.label)}
                        </button>
                    `).join("")}
                </div>

            </div>

        `).join("")}

        <div class="navigation">
            <button class="secondary-button" id="restartBtnB">← Start over</button>
            <button class="primary-button" id="continueClarify" ${hasAnyAnswer(priorAnswers) ? "" : "disabled"}>
                ${round === 0 ? "See next questions →" : "Continue to investigation →"}
            </button>
        </div>

    `;


    // Restart
    document
        .getElementById("restartBtn")
        .addEventListener("click", restartAndRender);
    document
        .getElementById("restartBtnB")
        .addEventListener("click", restartAndRender);


    // Option selection
    const choiceButtons = hero.querySelectorAll(".choice-card");
    choiceButtons.forEach(btn => {

        btn.addEventListener("click", function() {

            const qKey = this.dataset.questionKey;
            const value = this.dataset.optionValue;

            const group = hero.querySelectorAll(
                `[data-question-key="${qKey}"].choice-card`
            );

            group.forEach(other => {
                other.classList.remove("selected");
            });

            this.classList.add("selected");

            // Read the LATEST state rather than the closure snapshot so that
            // answering several questions on one screen does not clobber
            // earlier answers.
            const liveState = getInvestigation();
            const liveClarification = liveState.clarification || { answers: {} };

            const updatedAnswers = {
                ...(liveClarification.answers || {}),
                [qKey]: value
            };

            updateInvestigation({
                clarification: {
                    ...liveClarification,
                    answers: updatedAnswers
                }
            });

            const anyAnswered = Object.keys(updatedAnswers).length > 0;
            document
                .getElementById("continueClarify")
                .disabled = !anyAnswered;
        });

    });


    // Continue
    document
        .getElementById("continueClarify")
        .addEventListener("click", function() {

            const latestState = getInvestigation();
            const latestClarification = latestState.clarification || { answers: {} };
            const answers = latestClarification.answers || {};
            const currentRound = latestClarification.round || 0;

            const contentAgain = buildClarification(
                classification,
                answers
            );

            if (currentRound === 0 && contentAgain && contentAgain.questions) {
                // Move to follow-up round
                updateInvestigation({
                    clarification: {
                        ...latestClarification,
                        round: currentRound + 1
                    }
                });
                renderClarify();
                return;
            }

            // Clarification done — synthesize refined problem and move on.
            const refined = synthesizeClarifiedProblem(
                classification,
                answers
            );

            // Reset the investigate phase: a re-synthesized clarification
            // invalidates any earlier path/scenario selections.
            updateInvestigation({
                clarification: {
                    ...latestClarification,
                    refined
                },
                investigation: {
                    stage: "knowledge",
                    selectedPathId: null,
                    selectedScenarios: {}
                },
                hypotheses: {
                    selected: [],
                    methodChoices: {}
                },
                session: {
                    ...latestState.session,
                    step: "investigate"
                }
            });

            renderInvestigate();
        });
}


/* -----------------------------------
   INVESTIGATE STAGE DISPATCHER
----------------------------------- */

export function renderInvestigate() {

    const state = getInvestigation();

    if (!state || !state.problem) {
        renderProblem();
        return;
    }

    const stage = (state.investigation && state.investigation.stage) || "knowledge";

    if (stage === "knowledge") {
        renderKnowledge();
    } else if (stage === "paths") {
        renderPathSelect();
    } else if (stage === "scenarios") {
        renderScenarios();
    } else {
        renderSoWhat();
    }
}


/* -----------------------------------
   KNOW / DON'T KNOW
----------------------------------- */

function renderKnowledge() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    const classification = state.problem.classified;
    const clarificationState = state.clarification || {};
    const refined = clarificationState.refined;
    const knowledge = buildKnowns(classification, clarificationState);

    hero.innerHTML = `

        ${renderProgress()}

        <button class="text-button" id="restartKnowledge">← Start over</button>

        <div class="screen-heading">
            <div class="eyebrow">KNOW / DON'T KNOW</div>
            <h2>What we know — and what we still don't</h2>
        </div>

        <p class="instruction-text">
            A strong PM separates what the user believed, what was clarified
            by choice, and what has never been verified. Nothing on this
            screen is externally confirmed truth.
        </p>

        <div class="context-card">
            <div class="section-label">REFINED INTERPRETATION</div>
            <p>${escapeHTML(refined ? refined.summary : classification.text)}</p>
        </div>

        <div class="section-label">WHAT WE KNOW (FROM YOUR SELECTED INTERPRETATION)</div>
        <div class="stack">
            ${knowledge.known.map(item => `
                <div class="known-card">
                    <p>${escapeHTML(item.claim)}</p>
                    <div class="known-meta">
                        ${statusBadge(item.status, item.label)}
                        <span class="known-detail">${escapeHTML(item.detail || "")}</span>
                    </div>
                </div>
            `).join("")}
        </div>

        <div class="section-label">WHAT WE DON'T KNOW</div>
        <div class="stack">
            ${knowledge.unknown.map(item => `
                <div class="unknown-card">
                    <p>${escapeHTML(item.question)}</p>
                    <div class="known-meta">
                        ${statusBadge(item.status, item.label)}
                        <span class="known-detail">${escapeHTML(item.whyMatters || "")}</span>
                    </div>
                </div>
            `).join("")}
        </div>

        <div class="navigation">
            <button class="secondary-button" id="backToClarify">← Back to clarification</button>
            <button class="primary-button" id="contKnowledge">Continue to investigation path →</button>
        </div>

    `;

    document.getElementById("restartKnowledge").addEventListener("click", restartAndRender);

    document.getElementById("backToClarify").addEventListener("click", function() {
        updateInvestigation({
            session: {
                ...(getInvestigation().session || {}),
                step: "clarify"
            }
        });
        renderClarify();
    });

    document.getElementById("contKnowledge").addEventListener("click", function() {
        patchSection("investigation", { stage: "paths" });
        renderInvestigate();
    });
}


/* -----------------------------------
   PATH SELECT
----------------------------------- */

function renderPathSelect() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    const classification = state.problem.classified;
    const paths = buildInvestigationPaths(classification);
    const inv = state.investigation || {};
    const selectedPathId = inv.selectedPathId || null;

    hero.innerHTML = `

        ${renderProgress()}

        <button class="text-button" id="restartPaths">← Start over</button>

        <div class="screen-heading">
            <div class="eyebrow">INVESTIGATION PATH</div>
            <h2>Choose the path you'd investigate first</h2>
        </div>

        <p class="instruction-text">
            Each path is how a strong PM would approach a
            ${escapeHTML(classification.primaryType.label)} problem. Pick one —
            you'll then explore the possible scenarios within it.
        </p>

        <div class="stack">
            ${paths.map((path, i) => {
                const pathId = classification.primaryType.type + "." + (i + 1);
                const selected = pathId === selectedPathId;
                return `
                    <button
                        type="button"
                        class="investigation-card path-selectable ${selected ? "selected" : ""}"
                        data-path-id="${escapeHTML(pathId)}"
                    >
                        <div class="path-header">
                            <div class="path-number">${i + 1}</div>
                            <div>
                                <div class="section-label">INVESTIGATION PATH</div>
                                <h3>${escapeHTML(path.title)}</h3>
                            </div>
                        </div>
                        <p>${escapeHTML(path.description)}</p>
                        <div class="section-label">WHAT A PM WOULD LOOK FOR</div>
                        <ul class="check-list">
                            ${path.checks.map(c => `<li>${escapeHTML(c)}</li>`).join("")}
                        </ul>
                        ${selected ? `
                            <div class="selection-note selected">✓ Path selected</div>
                        ` : `
                            <div class="selection-note">Click to select this path</div>
                        `}
                    </button>
                `;
            }).join("")}
        </div>

        <div class="navigation">
            <button class="secondary-button" id="backPaths">← Back to know / don't know</button>
            <button class="primary-button" id="contPaths" ${selectedPathId ? "" : "disabled"}>
                Explore scenarios →
            </button>
        </div>

    `;

    document.getElementById("restartPaths").addEventListener("click", restartAndRender);

    hero.querySelectorAll(".path-selectable").forEach(card => {
        card.addEventListener("click", function() {
            patchSection("investigation", { selectedPathId: this.dataset.pathId });
            renderPathSelect();
        });
    });

    document.getElementById("backPaths").addEventListener("click", function() {
        patchSection("investigation", { stage: "knowledge" });
        renderInvestigate();
    });

    document.getElementById("contPaths").addEventListener("click", function() {
        patchSection("investigation", { stage: "scenarios" });
        renderInvestigate();
    });
}


/* -----------------------------------
   SCENARIO SELECT
----------------------------------- */

function renderScenarios() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    const inv = state.investigation || {};
    const selectedPathId = inv.selectedPathId;
    const path = selectedPathId
        ? findPathByPathId(state.problem.classified, selectedPathId)
        : null;

    // Defensive: no valid path selected — go back to path selection.
    if (!path) {
        patchSection("investigation", { stage: "paths", selectedPathId: null });
        renderInvestigate();
        return;
    }

    const selectedIds = (inv.selectedScenarios || {})[selectedPathId] || [];

    hero.innerHTML = `

        ${renderProgress()}

        <button class="text-button" id="restartScenarios">← Start over</button>

        <div class="screen-heading">
            <div class="eyebrow">POSSIBLE SCENARIOS</div>
            <h2>Which scenarios could explain this?</h2>
        </div>

        <div class="context-card">
            <div class="section-label">PATH</div>
            <h3 class="context-title">${escapeHTML(path.title)}</h3>
            <p class="context-subtitle">${escapeHTML(path.description)}</p>
            <div class="known-meta">
                ${statusBadge("hypothetical-scenario")}
                <span class="known-detail">
                    Every scenario below is a plausible story to CHECK — none of
                    it has been observed or verified.
                </span>
            </div>
        </div>

        <div class="stack">
            ${path.scenarios.map(s => {
                const selected = selectedIds.indexOf(s.id) !== -1;
                const expanded = expandScenario(s);
                return `
                    <div class="scenario-card ${selected ? "selected" : ""}" data-scenario-id="${escapeHTML(s.id)}">
                        <div class="scenario-head">
                            <div class="scenario-tag">SCENARIO ${s.id.split(".")[2].replace("s", "")}</div>
                            <p class="scenario-text">${escapeHTML(s.scenario)}</p>
                            ${statusBadge("hypothetical-scenario")}
                        </div>

                        ${selected ? `

                            <div class="scenario-detail">

                                <div class="scenario-row">
                                    <div class="row-label">WHAT THIS WOULD MEAN IF TRUE</div>
                                    <p>${escapeHTML(s.meaning)}</p>
                                </div>

                                <div class="scenario-row">
                                    <div class="row-label">WHY A PM SHOULD CARE</div>
                                    <p>${escapeHTML(s.whyPMCare)}</p>
                                </div>

                                <div class="scenario-row">
                                    <div class="row-label">USER BEHAVIOUR THIS COULD CHANGE</div>
                                    <p>If this were true: ${escapeHTML(s.userBehaviour)}.</p>
                                </div>

                                <div class="scenario-row">
                                    <div class="row-label">BUSINESS CONSEQUENCE THAT COULD FOLLOW</div>
                                    <p>${escapeHTML(s.businessConsequence)}.</p>
                                </div>

                                <div class="scenario-row">
                                    <div class="row-label">WHAT REMAINS UNKNOWN</div>
                                    <p>We still don't know: ${escapeHTML(s.unknown)}.</p>
                                </div>

                                <div class="scenario-row">
                                    <div class="row-label">NEXT INVESTIGATION QUESTION</div>
                                    <p>${escapeHTML(s.nextQuestion)}</p>
                                </div>

                            </div>

                        ` : `

                            <div class="selection-note">Click to consider this scenario and see what it would mean</div>

                        `}

                    </div>
                `;
            }).join("")}
        </div>

        <div class="navigation">
            <button class="secondary-button" id="backScenarios">← Back to paths</button>
            <button class="primary-button" id="contScenarios" ${selectedIds.length ? "" : "disabled"}>
                What does this mean? →
            </button>
        </div>

    `;

    document.getElementById("restartScenarios").addEventListener("click", restartAndRender);

    hero.querySelectorAll(".scenario-card").forEach(card => {
        card.addEventListener("click", function() {
            const pId = selectedPathId;
            const live = getInvestigation();
            const liveSelections = ((live.investigation || {}).selectedScenarios || {});
            const current = liveSelections[pId] || [];
            const sid = this.dataset.scenarioId;
            const next = current.indexOf(sid) === -1
                ? current.concat([sid])
                : current.filter(x => x !== sid);

            patchSection("investigation", {
                selectedScenarios: {
                    ...liveSelections,
                    [pId]: next
                }
            });

            renderScenarios();
        });
    });

    document.getElementById("backScenarios").addEventListener("click", function() {
        patchSection("investigation", { stage: "paths" });
        renderInvestigate();
    });

    document.getElementById("contScenarios").addEventListener("click", function() {
        patchSection("investigation", { stage: "sowhat" });
        renderInvestigate();
    });
}


/* -----------------------------------
   SO WHAT?
----------------------------------- */

function renderSoWhat() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    const selected = getSelectedScenarioObjects(state);

    // Defensive: no scenarios selected → back to scenario selection.
    if (selected.length === 0) {
        patchSection("investigation", { stage: "scenarios" });
        renderInvestigate();
        return;
    }

    const sopa = buildSoWhat(state.problem.classified, selected);

    hero.innerHTML = `

        ${renderProgress()}

        <button class="text-button" id="restartSoWhat">← Start over</button>

        <div class="screen-heading">
            <div class="eyebrow">SO WHAT?</div>
            <h2>If this were true, why would it matter?</h2>
        </div>

        <p class="instruction-text">
            ${escapeHTML(sopa.epistemicNote)}
        </p>

        ${sopa.whatIfs.map((w, i) => `

            <div class="what-if-block">
                <div class="what-if-head">
                    <div class="what-if-index">${i + 1}</div>
                    <p>${escapeHTML(w.scenario)}</p>
                </div>

                <div class="scenario-row">
                    <div class="row-label">MEANING (IF TRUE)</div>
                    <p>${escapeHTML(w.meaning)}</p>
                </div>

                <div class="scenario-row">
                    <div class="row-label">BEHAVIOURAL IMPACT</div>
                    <p>${escapeHTML(w.userBehaviour)}</p>
                </div>

                <div class="scenario-row">
                    <div class="row-label">WHY A PM SHOULD CARE</div>
                    <p>${escapeHTML(w.whyPMCare)}</p>
                </div>

                <div class="scenario-row">
                    <div class="row-label">BUSINESS CONSEQUENCE</div>
                    <p>${escapeHTML(w.businessConsequence)}</p>
                </div>

                <div class="scenario-row">
                    <div class="row-label">REMAINING UNKNOWN</div>
                    <p>${escapeHTML(w.unknown)}</p>
                </div>
            </div>

        `).join("")}

        <div class="section-label">${sopa.behavioural.label}</div>
        <div class="notice-card">
            <ul class="check-list">
                ${sopa.behavioural.lines.map(l => `<li>${escapeHTML(l)}</li>`).join("")}
            </ul>
            ${statusBadge("inference")}
        </div>

        <div class="section-label">${sopa.business.label}</div>
        <div class="notice-card">
            <ul class="check-list">
                ${sopa.business.lines.map(l => `<li>${escapeHTML(l)}</li>`).join("")}
            </ul>
            ${statusBadge("inference")}
        </div>

        <div class="section-label">IMPLICATIONS</div>
        <div class="notice-card">
            ${sopa.implications.map(imp => `<p>${escapeHTML(imp)}</p>`).join("")}
            ${statusBadge("inference")}
        </div>

        <div class="section-label">OPEN QUESTIONS</div>
        <div class="stack">
            ${sopa.openQuestions.map(q => `
                <div class="unknown-card">
                    <p>${escapeHTML(q)}</p>
                    ${statusBadge("unknown")}
                </div>
            `).join("")}
        </div>

        <div class="section-label">RECOMMENDED NEXT STEP</div>
        <div class="context-card">
            <div class="section-label">NEXT INVESTIGATION QUESTION</div>
            <p class="next-question">${escapeHTML(sopa.nextQuestion)}</p>
            <div class="known-meta">
                ${statusBadge("unknown")}
                <span class="known-detail">
                    The question that would reduce the most uncertainty across
                    the scenarios you selected.
                </span>
            </div>
        </div>

        <div class="navigation">
            <button class="secondary-button" id="backSoWhat">← Back to scenarios</button>
            <button class="primary-button" id="contSoWhat">Turn this into hypotheses →</button>
        </div>

    `;

    document.getElementById("restartSoWhat").addEventListener("click", restartAndRender);

    document.getElementById("backSoWhat").addEventListener("click", function() {
        patchSection("investigation", { stage: "scenarios" });
        renderInvestigate();
    });

    document.getElementById("contSoWhat").addEventListener("click", function() {
        const live = getInvestigation();
        updateInvestigation({
            session: {
                ...(live.session || {}),
                step: "hypotheses"
            }
        });
        renderHypotheses();
    });
}


/* -----------------------------------
   HYPOTHESES
----------------------------------- */

export function renderHypotheses() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    const selected = getSelectedScenarioObjects(state);
    if (selected.length === 0) {
        updateInvestigation({
            session: {
                ...(state.session || {}),
                step: "investigate"
            }
        });
        renderInvestigate();
        return;
    }

    const classification = state.problem.classified;
    const hypotheses = generateHypotheses(classification, selected);
    const hypState = state.hypotheses || { selected: [], methodChoices: {} };
    const chosen = hypState.selected || [];
    const methodChoices = hypState.methodChoices || {};
    const refined = (state.clarification || {}).refined;

    hero.innerHTML = `

        ${renderProgress()}

        <button class="text-button" id="restartHypotheses">← Start over</button>

        <div class="screen-heading">
            <div class="eyebrow">HYPOTHESES</div>
            <h2>Competing explanations worth checking</h2>
        </div>

        <div class="context-card">
            <div class="section-label">REFINED PROBLEM</div>
            <p>${escapeHTML(refined ? refined.summary : classification.text)}</p>
        </div>

        <p class="instruction-text">
            These are competing hypotheses — not conclusions. A strong PM
            keeps several explanations alive, including one that challenges
            the obvious story. Supporting a hypothesis here means "I would
            investigate this first", not "this is true".
        </p>

        <div class="stack">
            ${hypotheses.map(h => {

                const validation = recommendValidation(h, methodChoices[h.id]);
                const isChosen = chosen.indexOf(h.id) !== -1;

                return `

                    <div class="hypothesis-card ${isChosen ? "selected" : ""}" data-hypothesis-id="${escapeHTML(h.id)}">

                        <div class="hypothesis-head">
                            <div class="hypothesis-role ${h.alternative ? "alternative" : ""}">
                                ${h.alternative ? "ALTERNATIVE" : (h.id === "hyp-primary" ? "PRIMARY" : "COMPETING")}
                            </div>
                            <p class="hypothesis-statement">${escapeHTML(h.statement)}</p>
                            ${statusBadge("hypothesis")}
                        </div>

                        <div class="hypothesis-notes">
                            <div class="notes-item">
                                <span class="notes-key">What it claims</span>
                                <span>${escapeHTML(h.claimedConsequence)}</span>
                            </div>
                            <div class="notes-item">
                                <span class="notes-key">Current support</span>
                                <span>${h.supports.length
                                    ? "Based on " + h.supports.length + " selected scenario" + (h.supports.length === 1 ? "" : "s")
                                    : "No scenario points directly at this yet — it is deliberately contrarian."}</span>
                            </div>
                            <div class="notes-item">
                                <span class="notes-key">Strength</span>
                                <span>${escapeHTML(h.strength === "moderate" ? "Moderate (multiple scenarios align)" : "Limited (check before trusting)")}</span>
                            </div>
                            <div class="notes-item">
                                <span class="notes-key">Potential impact</span>
                                <span>${escapeHTML(h.potentialImpact === "high" ? "High — if true, the business consequence is significant" : "Medium — meaningful, but not the largest story")}</span>
                            </div>
                        </div>

                        <div class="validation-box">
                            <div class="row-label">RECOMMENDED VALIDATION</div>
                            <div class="method-row recommended">
                                <span class="method-name">${escapeHTML(validation.recommended.method)}</span>
                                <span class="method-why">${escapeHTML(validation.recommended.why)}</span>
                            </div>

                            <div class="row-label method-alternatives-label">ALTERNATIVE METHODS (EDUCATIONAL)</div>
                            <div class="method-row">
                                ${validation.alternatives.map(alt => `
                                    <button
                                        type="button"
                                        class="method-chip"
                                        data-hypothesis-id="${escapeHTML(h.id)}"
                                        data-method-key="${escapeHTML(alt.key)}"
                                    >
                                        ${escapeHTML(alt.method)}
                                    </button>
                                `).join("")}
                            </div>
                            <p class="method-hint">
                                Choosing an alternative only refines how the
                                prioritization explains the effort — nothing is
                                scheduled, and nothing here is required input.
                            </p>
                        </div>

                    </div>

                `;
            }).join("")}
        </div>

        <div class="navigation">
            <button class="secondary-button" id="backHypotheses">← Back to so what?</button>
            <button class="primary-button" id="contHypotheses">How would I decide what to test first? →</button>
        </div>

    `;

    document.getElementById("restartHypotheses").addEventListener("click", restartAndRender);

    // Toggle "I would investigate this" on a hypothesis (educational).
    hero.querySelectorAll(".hypothesis-card").forEach(card => {
        card.addEventListener("click", function() {
            const hid = this.dataset.hypothesisId;
            const live = getInvestigation();
            const liveHyp = live.hypotheses || { selected: [], methodChoices: {} };
            const next = (liveHyp.selected || []).indexOf(hid) === -1
                ? (liveHyp.selected || []).concat([hid])
                : (liveHyp.selected || []).filter(x => x !== hid);

            patchSection("hypotheses", { selected: next });
            renderHypotheses();
        });
    });

    // Educational alternative method selection (non-mandatory).
    hero.querySelectorAll(".method-chip").forEach(chip => {
        chip.addEventListener("click", function(e) {
            e.stopPropagation();
            const hid = this.dataset.hypothesisId;
            const live = getInvestigation();
            const liveHyp = live.hypotheses || { selected: [], methodChoices: {} };
            patchSection("hypotheses", {
                methodChoices: {
                    ...(liveHyp.methodChoices || {}),
                    [hid]: this.dataset.methodKey
                }
            });
            renderHypotheses();
        });
    });

    document.getElementById("backHypotheses").addEventListener("click", function() {
        const live = getInvestigation();
        updateInvestigation({
            session: {
                ...(live.session || {}),
                step: "investigate"
            },
            investigation: {
                ...(live.investigation || {}),
                stage: "sowhat"
            }
        });
        renderInvestigate();
    });

    document.getElementById("contHypotheses").addEventListener("click", function() {
        renderPrioritize();
    });
}


/* -----------------------------------
   PRIORITIZATION
----------------------------------- */

function renderPrioritize() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    const selected = getSelectedScenarioObjects(state);
    const classification = state.problem.classified;
    const hypotheses = generateHypotheses(classification, selected);
    const methodChoices = (state.hypotheses || {}).methodChoices || {};

    const prioritized = prioritizeHypotheses(hypotheses, methodChoices);

    hero.innerHTML = `

        ${renderProgress()}

        <button class="text-button" id="restartPrioritize">← Start over</button>

        <div class="screen-heading">
            <div class="eyebrow">PRIORITIZATION</div>
            <h2>What to investigate first</h2>
        </div>

        <p class="instruction-text">
            Priorities here are recommended learning order — driven by
            potential impact, how much is unknown, current support, and how
            fast an answer can be found. This is a teaching recommendation,
            not a precise score.
        </p>

        <div class="concept-strip">
            <span class="concept">POTENTIAL IMPACT</span>
            <span class="concept">UNCERTAINTY</span>
            <span class="concept">STRENGTH OF SUPPORT</span>
            <span class="concept">EASE / SPEED OF VALIDATION</span>
            <span class="concept">LEARNING VALUE</span>
        </div>

        <div class="stack">
            ${prioritized.order.map(item => {
                const h = hypotheses.find(h => h.id === item.id);
                return `

                    <div class="priority-card">
                        <div class="priority-row">
                            <div class="priority-number">${item.position}</div>
                            <div>
                                <div class="section-label">${item.alternative ? "ALTERNATIVE HYPOTHESIS" : "HYPOTHESIS"}</div>
                                <p class="priority-statement">${escapeHTML(h.statement)}</p>
                            </div>
                        </div>
                        <div class="priority-rationale">${escapeHTML(item.rationale)}</div>
                        <div class="priority-method">
                            <span class="notes-key">Validation to start with</span>
                            <span>${escapeHTML(item.method)}</span>
                        </div>
                    </div>

                `;
            }).join("")}
        </div>

        <div class="notice-card">
            <div class="section-label">WHY THIS ORDER</div>
            <p>${escapeHTML(prioritized.overall)}</p>
            ${statusBadge("inference")}
        </div>

        <div class="navigation">
            <button class="secondary-button" id="backPrioritize">← Back to hypotheses</button>
            <button class="primary-button" id="finishPrioritize">Finish investigation →</button>
        </div>

    `;

    document.getElementById("restartPrioritize").addEventListener("click", restartAndRender);

    document.getElementById("backPrioritize").addEventListener("click", function() {
        updateInvestigation({
            session: {
                ...(getInvestigation().session || {}),
                step: "hypotheses"
            }
        });
        renderHypotheses();
    });

    document.getElementById("finishPrioritize").addEventListener("click", function() {
        const live = getInvestigation();
        updateInvestigation({
            session: {
                ...(live.session || {}),
                step: "complete"
            }
        });
        renderComplete();
    });
}


/* -----------------------------------
   COMPLETE
----------------------------------- */

function renderComplete() {

    const state = getInvestigation();
    const hero = document.querySelector(".hero");

    const classification = state.problem.classified;
    const selected = getSelectedScenarioObjects(state);
    const hypotheses = generateHypotheses(classification, selected);
    const methodChoices = (state.hypotheses || {}).methodChoices || {};
    const prioritized = prioritizeHypotheses(hypotheses, methodChoices);
    const top = prioritized.order[0];
    const topH = hypotheses.find(h => h.id === top.id);
    const refined = (state.clarification || {}).refined;
    const inv = state.investigation || {};
    const selectedPath = inv.selectedPathId
        ? findPathByPathId(classification, inv.selectedPathId)
        : null;

    hero.innerHTML = `

        ${renderProgress()}

        <button class="text-button" id="restartComplete">← Start over</button>

        <div class="screen-heading">
            <div class="eyebrow">COMPLETE</div>
            <h2>Investigation journey complete</h2>
        </div>

        <div class="recap-card">
            <div class="section-label">YOUR PROBLEM</div>
            <p>${escapeHTML(state.problem.text)}</p>
            ${statusBadge("user-statement")}
        </div>

        <div class="recap-card">
            <div class="section-label">REFINED INTERPRETATION</div>
            <p>${escapeHTML(refined ? refined.summary : classification.text)}</p>
            ${statusBadge("refined-interpretation")}
        </div>

        <div class="recap-card">
            <div class="section-label">PATH INVESTIGATED</div>
            <p>${selectedPath ? escapeHTML(selectedPath.title) : "—"}</p>
            ${statusBadge("inference")}
        </div>

        <div class="recap-card">
            <div class="section-label">SCENARIOS SELECTED</div>
            <ul class="check-list">
                ${selected.map(s => `<li>${escapeHTML(s.scenario)}</li>`).join("")}
            </ul>
            ${statusBadge("hypothetical-scenario")}
        </div>

        <div class="recap-card">
            <div class="section-label">TOP PRIORITY TO INVESTIGATE</div>
            <p>${topH ? escapeHTML(topH.statement) : "—"}</p>
            ${statusBadge("hypothesis")}
        </div>

        <div class="notice-card">
            <p>
                This is a learning artifact, not a business answer. The
                scenarios and hypotheses are plausible explanations to CHECK —
                none of them are verified. A real investigation would now test
                the top priority (${escapeHTML(top ? top.method : "the fastest validation")})
                and use what it learns to update the picture.
            </p>
            ${statusBadge("inference")}
        </div>

        <div class="navigation">
            <button class="secondary-button" id="backComplete">← Back to prioritization</button>
            <button class="primary-button" id="restartCompleteBtn">Start a new problem →</button>
        </div>

    `;

    document.getElementById("restartComplete").addEventListener("click", restartAndRender);

    document.getElementById("backComplete").addEventListener("click", function() {
        const live = getInvestigation();
        updateInvestigation({
            session: {
                ...(live.session || {}),
                step: "hypotheses"
            }
        });
        renderHypotheses();
    });

    document.getElementById("restartCompleteBtn").addEventListener("click", restartAndRender);
}


// init() keeps the app entry point identical across phases.
export function init() {
    renderProblem();
}