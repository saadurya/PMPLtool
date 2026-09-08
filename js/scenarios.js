// PMPLtool — Scenario Synthesis & "So What?" Reasoning
//
// Pure reasoning. No DOM, no localStorage.
//
// A scenario is a plausible explanation worth checking — it is NOT evidence.
// Nothing observed has happened yet. Everything here stays in conditional
// language: "If this were true...", "This could lead to...", "We still don't
// know...".
//
// The scenario CONTENT (scenario objects) lives in investigation.js as data.
// This module contains the reasoning over that data: expanding a scenario
// into its teaching narrative and synthesizing the "So what?" step across
// the scenarios a user selected. Both functions accept plain structured
// inputs and return plain structured outputs, so a future AI/research layer
// can replace or enrich the content without touching the UI.
//
// Later, a research layer will convert a VERIFIED scenario into a "finding"
// by attaching evidence. Until then, every scenario carries the epistemic
// status "hypothetical-scenario" and is labelled HYPOTHETICAL — NOT VERIFIED.


// Per-type "if true, this changes how we think about the problem" teaching
// fold-in. Used to keep the So What? step type-aware.
const TYPE_IMPLICATIONS = {
    reliability: "If true, the problem is behavioural and technical at once — users are reacting to a real failure, not a perception.",
    conversion: "If true, the drop is a real, measurable behaviour change, not a reporting artifact.",
    retention: "If true, the churn is about the moment value is lost, and that moment is now visible.",
    competitive: "If true, the competitive gap is driving real behaviour change rather than a perceived difference.",
    growth: "If true, the growth bottleneck sits in a specific stage of the funnel, and the fix is targeted.",
    satisfaction: "If true, the negative sentiment is anchored to a concrete friction, which makes it fixable.",
    strategy: "If true, this is a real, addressable opportunity rather than an internal ambition.",
    general: "If true, the problem is well scoped enough to investigate with evidence instead of assumptions."
};


// Expand a raw scenario object (from investigation.js) into the full
// teaching narrative. Idempotent: returns plain data.
export function expandScenario(scenario) {
    return Object.assign({}, scenario, {
        status: "hypothetical-scenario",
        label: "HYPOTHETICAL — NOT VERIFIED"
    });
}


// Build the "So what?" learning layer for the selected scenarios of a path.
//
// - one what-if block per selected scenario (meaning, behaviour, why care,
//   consequence, unknown, next question) in conditional language
// - aggregate behavioural + business consequences
// - open questions = everything we still don't know
// - a recommended next question = the one that would reduce the most
//   uncertainty across the scenarios the user chose
export function buildSoWhat(classification, selectedScenarios) {

    const typeLabel = classification && classification.primaryType
        ? classification.primaryType.label
        : "General";

    const blocks = selectedScenarios.map(expandScenario);

    // --- aggregate consequences (converged by talking about the same thing) ---
    const behaviourSummary = uniqueLines(blocks.map(s => s.userBehaviour));
    const consequenceSummary = uniqueLines(blocks.map(s => s.businessConsequence));

    const implications = [
        TYPE_IMPLICATIONS[
            classification && classification.primaryType
                ? classification.primaryType.type
                : "general"
        ],
        "None of this is validated — every implication below is a conditional inference, not a measured outcome."
    ];

    const openQuestions = blocks.map(s => s.unknown);

    // --- next question: the unknown theme that covers the most selections ---
    const themeCounts = {};
    blocks.forEach(s => {
        themeCounts[s.theme] = (themeCounts[s.theme] || 0) + 1;
    });

    const bestTheme = Object.keys(themeCounts).sort(
        (a, b) => themeCounts[b] - themeCounts[a]
    )[0];

    const recommended = blocks.find(s => s.theme === bestTheme);

    return {
        pathId: blocks.length > 0 ? blocks[0].path : null,
        epistemicNote:
            "These are hypothetical scenarios. If this were true, here is "
            + "what a PM would infer — not what has been observed.",
        typeLabel,
        whatIfs: blocks.map(s => ({
            scenario: s.scenario,
            meaning: "If this were true, " + s.meaning,
            userBehaviour: "This could lead to: " + s.userBehaviour,
            whyPMCare: s.whyPMCare,
            businessConsequence: "The business consequence that could follow: "
                + s.businessConsequence,
            unknown: "We still don't know: " + s.unknown,
            nextQuestion: "The question that reduces most uncertainty next: "
                + s.nextQuestion
        })),
        behavioural: {
            label: "BEHAVIOURAL IMPACT (CONDITIONAL)",
            lines: behaviourSummary
        },
        business: {
            label: "BUSINESS CONSEQUENCE (CONDITIONAL)",
            lines: consequenceSummary
        },
        implications,
        openQuestions,
        nextQuestion: recommended ? recommended.nextQuestion : "",
        status: "inference",
        label: "INFERENCE"
    };
}


function uniqueLines(values) {
    const seen = {};
    const out = [];
    (values || []).forEach(v => {
        const key = String(v || "").toLowerCase();
        if (v && !seen[key]) {
            seen[key] = true;
            out.push(v);
        }
    });
    return out;
}