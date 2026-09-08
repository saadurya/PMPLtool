// PMPLtool — Know / Don't Know Synthesis
//
// Pure reasoning. No DOM, no localStorage.
//
// Phase 1 ends with a refinement: the user picked clarification answers that
// sharpen the original statement. Those selections are the user's chosen
// interpretation — NOT externally verified truth. This module turns them
// into an explicit list of:
//
//   known:  things the user told us (labelled USER STATEMENT / REFINED INTERPRETATION)
//   unknown: open questions a PM would have before treating the problem as real
//
// The "unknown" rows are deliberately researchable: each carries reserved
// fields (researchable, searchHints) that a future evidence/research layer
// will fill in. Nothing here ever claims verified facts.


// Per-type open questions a strong PM still can't answer from the problem
// statement + clarification alone. These are teaching content, deterministic
// for now. A future research/AI layer can replace this table without the UI
// changing.
const TYPE_UNKNOWNS = {
    reliability: [
        "What concrete failure, error, or symptom is actually being observed?",
        "How frequent is it, and which users/platforms are affected?",
        "Is this a new regression or a long-standing limitation?",
        "What do users do instead when the failure happens?"
    ],
    conversion: [
        "Which specific funnel step is leaking the most?",
        "What is the current conversion baseline, and what changed recently?",
        "Which segments are dropping versus converting?",
        "What data actually confirms the drop — a dashboard, an experiment, or a report?"
    ],
    retention: [
        "At what point in the lifecycle do users stop coming back?",
        "Which cohorts retain worst, and for how long?",
        "Do users actually reach the core value before leaving?",
        "What evidence shows users are leaving after reaching value, versus never activating at all?"
    ],
    competitive: [
        "Is the feature gap actually changing user behaviour, or is it perceived?",
        "Which jobs do users accomplish with each product?",
        "What would users lose or gain by switching?",
        "Do we have evidence of switching, or is this an assumption?"
    ],
    growth: [
        "Where in the acquisition funnel is the biggest leak?",
        "Which channels bring quality users versus churners?",
        "What is the current activation rate and time-to-value?",
        "What data would show the bottleneck is real?"
    ],
    satisfaction: [
        "What specifically drives the negative sentiment, and how strong is it?",
        "Is the sentiment growing, stable, or a spike?",
        "Which users feel it most, and what is their concrete pain?",
        "Does the sentiment convert into churn or reduced spend?"
    ],
    strategy: [
        "Who is the exact target segment, and why them?",
        "What is the specific outcome the strategy must achieve?",
        "What is changing in the market or user behaviour right now?",
        "What is the cheapest way to test the riskiest assumption?"
    ],
    general: [
        "What concrete evidence supports that this problem is real?",
        "Who is affected, how often, and how severely?",
        "What is currently assumption versus measured fact?",
        "What would prove or disprove the problem quickly?"
    ]
};


// Turn the classification + clarification answers into a { known, unknown }
// structure. known items always carry their epistemic status — a user's
// selected interpretation is never presented as verified truth.
export function buildKnowns(classification, clarification) {

    const answers = (clarification && clarification.answers) || {};
    const selected = Object.entries(answers)
        .filter(([key, value]) => value)
        .map(([key, value]) => value);

    const known = [];

    if (classification && classification.text) {
        known.push({
            claim: classification.text,
            status: "user-statement",
            label: "USER STATEMENT",
            detail: "Your original problem statement."
        });
    }

    selected.forEach(claim => {
        known.push({
            claim,
            status: "refined-interpretation",
            label: "REFINED INTERPRETATION",
            detail:
                "Based on the user's selected interpretation — not an "
                + "externally verified fact."
        });
    });

    const type = classification ? classification.primaryType.type : "general";
    const noAnswers = selected.length === 0;

    if (noAnswers) {
        known.push({
            claim: "Nothing has been narrowed through clarification yet.",
            status: "unknown",
            label: "UNKNOWN",
            detail: "Keep clarifying to sharpen the problem."
        });
    }

    const unknown = (TYPE_UNKNOWNS[type] || TYPE_UNKNOWNS.general).map(q => ({
        question: q,
        status: "unknown",
        label: "UNKNOWN",
        whyMatters:
            "Until a PM can answer this, the problem is a signal, not a "
            + "verified problem.",
        researchable: true,
        searchHints: null
    }));

    return { known, unknown };
}