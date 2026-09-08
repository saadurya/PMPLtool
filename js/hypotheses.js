// PMPLtool — Hypothesis Generation & Prioritization
//
// Pure reasoning. No DOM, no localStorage.
//
// Hypotheses are competing explanations a PM would want to check — never
// conclusions. They are generated from a SMALL, meaningful set:
//
//   1. a primary explanation (converged from the selected scenarios)
//   2. a competing alternative explanation (a different plausible cause)
//   3. an explicit contrarian hypothesis ("the assumed explanation may be wrong")
//
// This deliberately fights confirmation bias: the system never assumes the
// first plausible story is right.
//
// Validation methods are RECOMMENDED by the system, not required input. The
// user may click a different educational method; that only informs the
// prioritization rationale. All methods stay hypothetical options — nothing
// here schedules real research.

const VALIDATION_METHODS = {
    logs: {
        key: "logs",
        method: "Analyze product logs/data",
        when: "when the behaviour you are checking may already exist as data in the product.",
        why: "This hypothesis is primarily about observable user behaviour that may already exist in product data.",
        speed: 3
    },
    interview: {
        key: "interview",
        method: "User interviews",
        when: "when the question is about perception, motivation, or why — data may not capture it.",
        why: "This hypothesis is mostly about motivation or perception, which product data may not capture.",
        speed: 2
    },
    experiment: {
        key: "experiment",
        method: "Controlled experiment",
        when: "when you want to prove a causal effect and can change the product to test it.",
        why: "This hypothesis claims a causal effect that a controlled change could test.",
        speed: 1
    }
};

const TYPE_RECOMMENDED_METHOD = {
    reliability: "logs",
    conversion: "logs",
    retention: "logs",
    growth: "logs",
    satisfaction: "interview",
    competitive: "interview",
    strategy: "interview",
    general: "interview"
};

// Canonical competing explanations per problem type — used when the selected
// scenarios only cover one theme, so the set stays genuinely competing.
const TYPE_COMPETING_EXPLANATIONS = {
    reliability: "This could be a regression from a recent release rather than the assumed fault.",
    conversion: "The drop could be baseline drift or seasonality rather than a product regression.",
    retention: "Leavers might not be lost to an alternative — they may simply never reach first value.",
    competitive: "The perceived gap may not change behaviour — familiarity, defaults, and habit can outweigh features.",
    growth: "The bottleneck could be acquisition economics (CAC) rather than activation.",
    satisfaction: "The sentiment could be driven by price or expectations, not the assumed friction.",
    strategy: "The opportunity could be smaller than assumed — the target segment may not be reachable or willing.",
    general: "The problem could be narrower (or wider) than scoped, affecting only a specific segment."
};

// Per-type contrarian reasons for the explicit alternative hypothesis.
const TYPE_ALTERNATIVE_REASONS = {
    reliability: "the failure may be rare or unobserved — the signal could come from a small, loud cohort.",
    conversion: "the drop may disappear once baseline noise and seasonality are removed from the data.",
    retention: "users may not be leaving — the cohort or retention definition itself may be wrong.",
    competitive: "users may not be switching at all — habits and defaults can hold even when features lag.",
    growth: "the funnel may be fine — the bottleneck could be external (seasonality, market, pricing).",
    satisfaction: "sentiment may be narrower than it sounds — a few loud voices can drive the signal.",
    strategy: "the strategic assumption may not hold once tested with real users in the real market.",
    general: "the first explanation that comes to mind may simply be wrong."
};


// Generate a small set of competing hypotheses from the classification and
// the scenarios the user selected. Deterministic: same inputs, same output.
export function generateHypotheses(classification, selectedScenarios) {

    const type = classification ? classification.primaryType.type : "general";
    const scenarios = (selectedScenarios || []).map(s => Object.assign({}, s));

    // Group selected scenarios by their uncertainty theme.
    const byTheme = {};
    scenarios.forEach(s => {
        if (!byTheme[s.theme]) byTheme[s.theme] = [];
        byTheme[s.theme].push(s);
    });

    // Dominant theme = the theme covering the most selected scenarios.
    const themes = Object.keys(byTheme).sort(
        (a, b) => byTheme[b].length - byTheme[a].length
    );
    const dominantTheme = themes[0] || "main";
    const dominant = byTheme[dominantTheme] || [];
    const primary = dominant[0] || (scenarios[0] || {});

    const hypotheses = [];

    // 1. PRIMARY — converged explanation
    hypotheses.push({
        id: "hyp-primary",
        alternative: false,
        statement: buildPrimaryStatement(type, primary, dominant),
        claimedConsequence: consequenceOf(primary),
        supports: dominant.map(s => s.id),
        themeBasis: dominantTheme,
        strength: dominant.length >= 2 ? "moderate" : "limited",
        potentialImpact: "high",
        recommendedMethod: TYPE_RECOMMENDED_METHOD[type] || "logs",
        status: "hypothesis",
        label: "HYPOTHESIS"
    });

    // 2. COMPETING — a different plausible explanation
    const otherTheme = themes.find(t => t !== dominantTheme);
    let competingStatement;
    let competingSupports = [];

    if (otherTheme && byTheme[otherTheme]) {
        const other = byTheme[otherTheme][0];
        competingStatement =
            "Alternatively, " + lowerFirst(other.scenario)
            + " could be the real driver.";
        competingSupports = [other.id];
    } else {
        competingStatement = TYPE_COMPETING_EXPLANATIONS[type] || TYPE_COMPETING_EXPLANATIONS.general;
    }

    hypotheses.push({
        id: "hyp-competing",
        alternative: false,
        statement: competingStatement,
        claimedConsequence: "It implies a different fix and a different business consequence than the primary hypothesis.",
        supports: competingSupports,
        themeBasis: otherTheme || "different-cause",
        strength: "limited",
        potentialImpact: "medium",
        recommendedMethod: TYPE_RECOMMENDED_METHOD[type] || "logs",
        status: "hypothesis",
        label: "HYPOTHESIS"
    });

    // 3. ALTERNATIVE — explicit contrarian hypothesis
    hypotheses.push({
        id: "hyp-alternative",
        alternative: true,
        statement:
            "The assumed explanation may be wrong — "
            + (TYPE_ALTERNATIVE_REASONS[type] || TYPE_ALTERNATIVE_REASONS.general),
        claimedConsequence:
            "If true, the fix is different — and the " + typeLabel(type)
            + " framing of the problem may itself need to change.",
        supports: [],
        themeBasis: "contrarian",
        strength: "limited",
        potentialImpact: "medium",
        recommendedMethod: TYPE_RECOMMENDED_METHOD[type] || "logs",
        status: "hypothesis",
        label: "HYPOTHESIS"
    });

    return hypotheses;
}


// Recommend a validation method for a hypothesis. If the user clicked an
// educational alternative, it overrides the recommendation.
export function recommendValidation(hypothesis, chosenMethod) {

    const effective = chosenMethod || hypothesis.recommendedMethod;
    const rec = getMethod(effective);

    const alternatives = Object.keys(VALIDATION_METHODS)
        .filter(k => k !== effective)
        .map(k => {
            const m = VALIDATION_METHODS[k];
            return { key: k, method: m.method, when: m.when };
        });

    return {
        recommended: {
            key: rec.key,
            method: rec.method,
            why: rec.why
        },
        alternatives
    };
}


// Prioritize hypotheses educationally. The order is a recommendation for a
// learning sequence — a teaching artifact, not a scored answer.
export function prioritizeHypotheses(hypotheses, methodChoices) {

    const scored = hypotheses.map(h => {
        const effectiveMethod = (methodChoices && methodChoices[h.id])
            || h.recommendedMethod;
        const method = getMethod(effectiveMethod);

        const impact = h.potentialImpact === "high" ? 2 : 1;
        const uncertainty = h.strength === "limited" ? 2 : 1;
        const learning = impact + uncertainty;

        return { h, learning, speed: method.speed, effectiveMethod, impact, uncertainty };
    });

    scored.sort((a, b) => {
        if (b.learning !== a.learning) return b.learning - a.learning;
        if (b.speed !== a.speed) return b.speed - a.speed;
        return 0;
    });

    const order = scored.map((s, i) => ({
        id: s.h.id,
        position: i + 1,
        rationale: rationaleFor(s),
        method: getMethod(s.effectiveMethod).method,
        strength: s.h.strength,
        potentialImpact: s.h.potentialImpact,
        alternative: s.h.alternative
    }));

    const overall =
        "The recommended order maximises learning per unit of effort: "
        + "hypotheses with high potential impact and large remaining "
        + "uncertainty come first, and cheaper validation methods let you "
        + "learn faster. This is a learning recommendation, not the answer."

    return { order, overall };
}


function rationaleFor(s) {
    const parts = [];
    parts.push(
        (s.h.potentialImpact === "high" ? "High potential impact" : "Medium potential impact")
        + " and "
        + (s.uncertainty === 2 ? "much still unknown" : "moderate uncertainty")
    );
    if (s.speed === 3) parts.push("fastest to validate with existing data");
    else if (s.speed === 2) parts.push("moderately fast to validate");
    else parts.push("slowest to validate — use when causality matters");
    if (s.h.alternative) {
        parts.push("kept high to guard against confirmation bias");
    }
    return parts.join(", ") + " → investigate with priority.";
}


function buildPrimaryStatement(type, primary, dominant) {
    const scenarioText = primary.scenario
        ? lowerFirst(primary.scenario)
        : "the most likely story";
    const behaviour = primary.userBehaviour
        ? lowerFirst(primary.userBehaviour)
        : "user behaviour shifts meaningfully";
    const consequence = consequenceOf(primary);

    return (
        "IF " + scenarioText
        + " THEN " + behaviour
        + " — which could mean "
        + (consequence ? lowerFirst(consequence) : "a real business cost")
        + "."
    );
}


function consequenceOf(scenario) {
    return scenario && scenario.businessConsequence
        ? scenario.businessConsequence
        : "";
}


function getMethod(key) {
    return VALIDATION_METHODS[key] || VALIDATION_METHODS.logs;
}


function typeLabel(type) {
    const labels = {
        reliability: "reliability",
        conversion: "conversion",
        retention: "retention",
        competitive: "competitive",
        growth: "growth",
        satisfaction: "satisfaction",
        strategy: "strategy",
        general: "general"
    };
    return labels[type] || "general";
}


function lowerFirst(text) {
    if (!text) return "";
    return text.charAt(0).toLowerCase() + text.slice(1);
}