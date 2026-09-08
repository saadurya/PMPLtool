// PMPLtool — State Management
//
// The only module that touches localStorage.
//
// State model (subject to change in later phases):
//
// {
//   problem: { text, classified: {...}, status: "statement" },
//   clarification: {
//     round: number,
//     answers: { [questionKey]: selectedLabel },
//     refined: {...},
//     status: "statement" | "refined"
//   },
//   investigation: {                      // Phase 2: remaining explore steps
//     stage: "knowledge" | "paths" | "scenarios" | "sowhat",
//     selectedPathId: null | "<type>.<index>",
//     selectedScenarios: { "<pathId>": ["<scenarioId>"] }
//   },
//   hypotheses: {
//     selected: ["<hypothesisId>"],
//     methodChoices: { "<hypothesisId>": "logs" | "interview" | "experiment" }
//   },
//   session: {
//     step: "problem" | "clarify" | "investigate" | "hypotheses" | "complete",
//     history: []
//   }
// }
//
// Derived content (what we know, so-what synthesis, the hypothesis list and
// their priority order) is NOT stored. It is recomputed on every render by
// the pure reasoning modules. State only holds user selections.


const STORAGE_KEY = "pmpltool-investigation";


export function saveInvestigation(investigation) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(investigation)
    );
}


export function getInvestigation() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return null;
    }

    try {
        return JSON.parse(saved);
    } catch (e) {
        return null;
    }
}


export function updateInvestigation(updates) {
    const current = getInvestigation() || {};

    const updated = {
        ...current,
        ...updates
    };

    saveInvestigation(updated);

    return updated;
}


// Merge a patch into a single top-level section (e.g. "investigation" or
// "hypotheses") while preserving everything else in that section. This is
// the same answer-clobber protection as updateInvestigation: always read the
// live state and merge onto it, never a render-time closure snapshot.
export function patchSection(section, patch) {
    const current = getInvestigation() || {};

    const updated = {
        ...current,
        [section]: {
            ...(current[section] || {}),
            ...patch
        }
    };

    saveInvestigation(updated);

    return updated;
}


export function newInvestigation() {
    const fresh = {
        problem: null,
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
            step: "problem",
            history: []
        }
    };

    saveInvestigation(fresh);
    return fresh;
}
