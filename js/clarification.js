// PMPLtool — Clarification Engine
//
// Pure logic. No DOM access.
//
// Takes the classified problem and produces a set of clickable
// clarification questions. Each question teaches the user WHY
// a strong PM would ask this before proceeding.
//
// The engine supports multiple clarification ROUNDS. Each round
// narrows the problem based on prior answers. In Phase 1 we
// support one to two rounds before handing off to investigation.


import { classifyProblem } from "./classifier.js";


export function buildClarification(classification, priorAnswers = {}) {

    const type = classification.primaryType.type;

    if (priorAnswers && Object.keys(priorAnswers).length > 0) {
        return buildFollowup(type, priorAnswers, classification);
    }

    return buildFirstRound(type, classification);
}


function buildFirstRound(type, classification) {

    switch (type) {

        case "competitive":
            return buildCompetitiveClarification(classification);

        case "reliability":
            return buildReliabilityClarification(classification);

        case "conversion":
            return buildConversionClarification(classification);

        case "retention":
            return buildRetentionClarification(classification);

        case "growth":
            return buildGrowthClarification(classification);

        case "satisfaction":
            return buildSatisfactionClarification(classification);

        case "strategy":
            return buildStrategyClarification(classification);

        default:
            return buildGeneralClarification(classification);
    }
}


function buildFollowup(type, answers, classification) {

    // For Phase 1, follow-up is modelled as a single additional
    // round that builds on the most significant first-round answer.
    // In later phases this becomes a full branching tree.

    const chosenKey = Object.keys(answers).find(
        key => answers[key]
    );

    switch (type) {

        case "competitive":
            return competitiveFollowup(chosenKey, answers);

        case "reliability":
            return reliabilityFollowup(chosenKey, answers);

        case "conversion":
            return conversionFollowup(chosenKey, answers);

        case "retention":
            return retentionFollowup(chosenKey, answers);

        case "growth":
            return growthFollowup(chosenKey, answers);

        case "satisfaction":
            return satisfactionFollowup(chosenKey, answers);

        default:
            return generalFollowup(chosenKey, answers);
    }
}


/* --------------------------------------------
   COMPETITIVE
-------------------------------------------- */

function buildCompetitiveClarification(classification) {

    const entities = classification.entities;
    const entityLabel = entities.length > 0
        ? entities.join(" vs ")
        : "the competing products";

    const moreFeaturesEntity =
        entities.length >= 1 ? entities[0] : null;
    const lessFeaturesEntity =
        entities.length >= 2 ? entities[1] : null;

    const behaviourLabel =
        moreFeaturesEntity && lessFeaturesEntity
            ? `What is the user doing on ${moreFeaturesEntity} that they cannot or will not do on ${lessFeaturesEntity}?`
            : "What is the user doing on one product that they cannot or will not do on the other?";

    return {
        title: "Sharpening the competitive problem",
        explanation:
            `A strong PM would not accept "more features" (or any vague comparison) as a `
            + `well-defined problem right away. Before jumping to a solution, a PM asks what `
            + `specific behaviour or outcome is changing because of this difference. `
            + `Let's get specific.`,

        intro: `When did this become noticeable? How frequently does the competitive gap show up?`,

        questions: [

            {
                key: "job",
                label: "What job is the user trying to get done?",
                reason: "A PM needs to know the user's goal before assessing whether a feature difference matters.",
                options: [
                    { value: "payments", label: "Sending or receiving money" },
                    { value: "shopping", label: "Buying something" },
                    { value: "invest", label: "Saving or investing" },
                    { value: "bills", label: "Paying bills / recharges" },
                    { value: "business", label: "Running a business (merchant)" }
                ]
            },

            {
                key: "behaviour",
                label: behaviourLabel,
                reason: "The gap only matters if it changes behaviour. Otherwise it's a perception, not a problem.",
                options: [
                    { value: "switching", label: "Users are switching entirely to the other product" },
                    { value: "usage_split", label: "Users split usage between both" },
                    { value: "feature_miss", label: "Users want one specific feature that is missing" },
                    { value: "not_confirmed", label: "We don't actually know — it's an assumption" }
                ]
            },

            {
                key: "frequency",
                label: "How often does the affected behaviour happen?",
                reason: "Frequency tells you whether this is a daily core task or an occasional edge case.",
                options: [
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                    { value: "rare", label: "Rarely" },
                    { value: "unknown", label: "Unknown" }
                ]
            },

            {
                key: "impact",
                label: "What is the business impact you care about?",
                reason: "A PM connects user-facing problems to business outcomes. Otherwise it's hard to know if it's worth solving.",
                options: [
                    { value: "revenue", label: "Lost revenue / market share" },
                    { value: "retention", label: "Users leaving" },
                    { value: "acquisition", label: "Harder to acquire new users" },
                    { value: "perception", label: "Brand or perception damage" },
                    { value: "unsure", label: "Not sure of the impact yet" }
                ]
            }
        ]
    };
}


function competitiveFollowup(chosenKey, answers) {

    if (chosenKey === "behaviour" || chosenKey === "job") {
        return {
            title: "Understanding the behaviour that changed",
            explanation:
                "Good. Now the key PM question is: is the difference in features causing "
                + "an actual behaviour change, or is it just a feature gap nobody uses? "
                + "A PM would investigate this rather than assume it.",
            intro: "Let's narrow down where the behaviour gap is most visible.",
            questions: [
                {
                    key: "evidence",
                    label: "Can you already see evidence of this behaviour?",
                    reason: "Distinguishing observed behaviour from assumption is a core PM skill.",
                    options: [
                        { value: "observed", label: "Yes — we see it in data or reports" },
                        { value: "anecdotal", label: "Partly — we hear about it from some users" },
                        { value: "assumption", label: "No — this is our assumption right now" }
                    ]
                },
                {
                    key: "segment",
                    label: "Which users are most affected?",
                    reason: "Segmentation tells you whether this is a broad problem or narrow cohort.",
                    options: [
                        { value: "all", label: "All users" },
                        { value: "new", label: "New / less frequent users" },
                        { value: "power", label: "Power / frequent users" },
                        { value: "segment_unknown", label: "We don't know yet" }
                    ]
                }
            ]
        };
    }

    return {
        title: "One more layer of clarification",
        explanation:
            "Good context. A PM would keep asking 'so what?' until the problem is "
            + "specific enough that it suggests concrete next steps.",
        intro: "Help us understand the magnitude and confidence behind this.",
        questions: [
            {
                key: "magnitude",
                label: "Roughly how big is the impact you're describing?",
                reason: "Magnitude helps you prioritize. Small impact on a rare behaviour may not be worth solving.",
                options: [
                    { value: "large", label: "Large — it affects a core metric" },
                    { value: "medium", label: "Medium — some users are affected" },
                    { value: "small", label: "Small — niche but potentially important" },
                    { value: "unknown", label: "We don't know the size yet" }
                ]
            }
        ]
    };
}


/* --------------------------------------------
   RELIABILITY / TECHNICAL
-------------------------------------------- */

function buildReliabilityClarification(classification) {

    return {
        title: "Breaking down the technical problem",
        explanation:
            '"Payment processing issues" (or any vague technical claim) could mean many '
            + 'different things. A strong PM would first separate the specific failure '
            + 'mode from the user experience, and only then investigate the technical '
            + 'system. Let\'s get specific.',

        intro: "Which of these best describes what actually happens?",

        questions: [

            {
                key: "failure",
                label: "What actually happens when the issue occurs?",
                reason: "A PM needs the exact failure mode — not 'it doesn't work'.",
                options: [
                    { value: "failed", label: "The action fails / gives an error" },
                    { value: "slow", label: "It is slow but eventually completes" },
                    { value: "pending", label: "Money/action was taken but status stays pending" },
                    { value: "silent", label: "Nothing obvious happens — silently broken" },
                    { value: "varied", label: "It varies — different failure modes" }
                ]
            },

            {
                key: "behaviour_after",
                label: "What do users do after the issue?",
                reason: "Retry vs switch vs give up tells you the real cost of the problem.",
                options: [
                    { value: "retry", label: "They retry and eventually succeed" },
                    { value: "switch", label: "They switch to another method / product" },
                    { value: "give_up", label: "They give up entirely" },
                    { value: "trust_impact", label: "They lose trust and reduce future usage" },
                    { value: "unknown_after", label: "We don't know what they do afterward" }
                ]
            },

            {
                key: "affected",
                label: "Who or what is affected?",
                reason: "Isolation narrows where to investigate — by platform, segment, or context.",
                options: [
                    { value: "all", label: "Everyone" },
                    { value: "platform", label: "Specific platform (iOS / Android / web)" },
                    { value: "segment", label: "Specific user segment" },
                    { value: "method", label: "Specific payment method / bank" },
                    { value: "context", label: "Specific context (time, volume, region)" }
                ]
            },

            {
                key: "timing",
                label: "When did this start, and how frequent is it?",
                reason: "Recency + frequency distinguishes a new regression from a chronic issue.",
                options: [
                    { value: "recent_rare", label: "Recent, occasional" },
                    { value: "recent_often", label: "Recent, frequent" },
                    { value: "chronic", label: "Long-standing / always happening" },
                    { value: "pulsed", label: "Spikes at certain times" },
                    { value: "unknown_timing", label: "Don't know yet" }
                ]
            }
        ]
    };
}


function reliabilityFollowup(chosenKey, answers) {

    if (chosenKey === "failure" || chosenKey === "behaviour_after") {
        return {
            title: "Understanding the impact of the failure",
            explanation:
                "Now a PM would ask 'so what?' — the failure matters only if it "
                + "changes user behaviour or causes real harm. Let's quantify that.",
            intro: "Help us understand severity and confidence.",
            questions: [
                {
                    key: "severity",
                    label: "How severe is the impact?",
                    reason: "Severity drives how quickly and how much you invest.",
                    options: [
                        { value: "critical", label: "Critical — blocks a core task entirely" },
                        { value: "high", label: "High — significant friction or loss" },
                        { value: "moderate", label: "Moderate — some users affected" },
                        { value: "low", label: "Low — minor inconvenience" }
                    ]
                },
                {
                    key: "evidence_strength",
                    label: "Is the impact you describe observed or assumed?",
                    reason: "Distinguishing data from assumption prevents solving the wrong problem.",
                    options: [
                        { value: "data", label: "Observed in data / metrics" },
                        { value: "reports", label: "Seen in support tickets / reports" },
                        { value: "assumption", label: "Assumed / hypothetical right now" }
                    ]
                }
            ]
        };
    }

    return {
        title: "One more clarification",
        explanation:
            "Good context. A PM would want to know whether this is a system-level "
            + "issue or something isolated.",
        intro: "Final layer of context:",
        questions: [
            {
                key: "scope",
                label: "Is this isolated or widespread?",
                reason: "Scope determines whether to treat it as a systemic issue or a localized one.",
                options: [
                    { value: "widespread", label: "Widespread / systemic" },
                    { value: "isolated", label: "Isolated to a few users/cases" },
                    { value: "unknown_scope", label: "Unknown scope" }
                ]
            }
        ]
    };
}


/* --------------------------------------------
   CONVERSION / FUNNEL
-------------------------------------------- */

function buildConversionClarification(classification) {

    return {
        title: "Pinpointing where the conversion breaks",
        explanation:
            "A conversion problem is only useful to a PM when it is localized. "
            + "Which step drops? Which users? Since when? Let's get specific before "
            + "we even talk about causes.",

        intro: "Help us narrow the conversion problem.",

        questions: [

            {
                key: "where",
                label: "Where in the journey does the drop happen?",
                reason: "Every funnel step has different likely causes — you must localize first.",
                options: [
                    { value: "entry", label: "At entry / first step" },
                    { value: "middle", label: "Mid-funnel (e.g. form, selection)" },
                    { value: "checkout", label: "At checkout / payment" },
                    { value: "spread", label: "Spread across multiple steps" },
                    { value: "unsure_where", label: "Don't know which step yet" }
                ]
            },

            {
                key: "who",
                label: "Which users are affected?",
                reason: "Segmentation is essential — the cause may be cohort-specific.",
                options: [
                    { value: "all", label: "All users" },
                    { value: "new", label: "New users" },
                    { value: "returning", label: "Returning users" },
                    { value: "platform", label: "Users on a specific platform" },
                    { value: "unknown_who", label: "Unknown" }
                ]
            },

            {
                key: "when",
                label: "When did the drop start?",
                reason: "Recency correlates with what changed — a key clue to root cause.",
                options: [
                    { value: "recent", label: "Recently — started within weeks" },
                    { value: "gradual", label: "Gradual decline over time" },
                    { value: "chronic", label: "Always been low" },
                    { value: "unknown_when", label: "Don't know yet" }
                ]
            },

            {
                key: "change",
                label: "Did anything change around that time?",
                reason: "A PM looks for correlation changes — product, pricing, competition, seasonality.",
                options: [
                    { value: "product", label: "Product / UX changed" },
                    { value: "pricing", label: "Pricing / fees / offers changed" },
                    { value: "external", label: "External / market / competitor change" },
                    { value: "none", label: "No obvious change" },
                    { value: "unknown_change", label: "Don't know" }
                ]
            }
        ]
    };
}


function conversionFollowup(chosenKey, answers) {

    if (chosenKey === "where" || chosenKey === "who") {
        return {
            title: "Understanding the drop's magnitude",
            explanation:
                "A PM would quantify the drop and connect it to business impact before "
                + "deciding how hard to chase it.",
            intro: "Two more quick questions:",
            questions: [
                {
                    key: "magnitude",
                    label: "How big is the conversion drop?",
                    reason: "Magnitude determines urgency and whether it's worth solving.",
                    options: [
                        { value: "large", label: "Large — significant decline" },
                        { value: "moderate", label: "Moderate — noticeable but not drastic" },
                        { value: "small", label: "Small — minor change" },
                        { value: "unknown_magnitude", label: "Don't know the size yet" }
                    ]
                },
                {
                    key: "confidence",
                    label: "Is the drop measured or anecdotal?",
                    reason: "Data vs anecdote changes how much you trust the problem exists.",
                    options: [
                        { value: "data", label: "Measured in analytics" },
                        { value: "reports", label: "Seen in reports / support" },
                        { value: "assumption", label: "Believed / assumed" }
                    ]
                }
            ]
        };
    }

    return {
        title: "One more layer",
        explanation: "Almost there — one final clarifying layer.",
        intro: "How confident are we in the current understanding?",
        questions: [
            {
                key: "confidence",
                label: "What's the current confidence in this problem framing?",
                reason: "Confidence tells the user (and the tool) what is assumption vs fact.",
                options: [
                    { value: "high", label: "High — well supported" },
                    { value: "medium", label: "Medium — some support" },
                    { value: "low", label: "Low — mostly gut feel" }
                ]
            }
        ]
    };
}


/* --------------------------------------------
   RETENTION
-------------------------------------------- */

function buildRetentionClarification(classification) {

    return {
        title: "Understanding the retention problem",
        explanation:
            "Retention problems need to be broken apart by cohort and by the specific "
            + "moment users leave. A strong PM does not treat 'losing users' as one "
            + "problem — it's a set of moments where value drops.",

        intro: "Let's get specific about the retention issue.",

        questions: [

            {
                key: "when_leave",
                label: "When do users stop coming back?",
                reason: "The moment users leave (day 1 vs day 90) points to very different causes.",
                options: [
                    { value: "instant", label: "Immediately after signup / first use" },
                    { value: "early", label: "Within the first week" },
                    { value: "later", label: "After weeks or months" },
                    { value: "gradual", label: "Gradual decay over time" },
                    { value: "unknown_leave", label: "Don't know yet" }
                ]
            },

            {
                key: "which_users",
                label: "Which users are leaving?",
                reason: "Segmentation reveals whether the drop is broad or cohort-specific.",
                options: [
                    { value: "new", label: "New users" },
                    { value: "old", label: "Long-time users" },
                    { value: "specific", label: "A specific segment / behaviour group" },
                    { value: "all", label: "Everyone" },
                    { value: "unknown_users", label: "Unknown" }
                ]
            },

            {
                key: "value",
                label: "Was the user getting value before leaving?",
                reason: "Did they leave because they never got value, or because value faded?",
                options: [
                    { value: "never", label: "They never got real value" },
                    { value: "faded", label: "Value faded over time" },
                    { value: "competing", label: "They found a better alternative" },
                    { value: "unknown_value", label: "Don't know" }
                ]
            },

            {
                key: "business",
                label: "What is the business consequence?",
                reason: "Retention only matters if it hits revenue, growth, or strategy.",
                options: [
                    { value: "revenue", label: "Lost revenue / LTV" },
                    { value: "growth", label: "Hampers growth / word of mouth" },
                    { value: "acq_cost", label: "Acquisition cost keeps rising" },
                    { value: "unknown_biz", label: "Not sure of business impact yet" }
                ]
            }
        ]
    };
}


function retentionFollowup(chosenKey, answers) {

    if (chosenKey === "when_leave" || chosenKey === "business") {
        return {
            title: "Quantifying the retention issue",
            explanation:
                "A PM would tie the retention drop to a concrete metric and understand "
                + "its trend before proposing changes. Let's do that.",
            intro: "Quick quantification:",
            questions: [
                {
                    key: "metric",
                    label: "Can you state the retention drop as a metric?",
                    reason: "A defined metric (e.g. D30 retention) is the backbone of any retention investigation.",
                    options: [
                        { value: "d30", label: "Yes — we track cohort retention / DAU" },
                        { value: "percent", label: "Yes — we have a % drop" },
                        { value: "no_metric", label: "Not yet — we need to define it" }
                    ]
                },
                {
                    key: "confidence",
                    label: "Is this retention drop measured or assumed?",
                    reason: "Measured vs assumed changes your whole approach.",
                    options: [
                        { value: "data", label: "Measured in data" },
                        { value: "reports", label: "Seen in reports / anecdotally" },
                        { value: "assumption", label: "Assumed" }
                    ]
                }
            ]
        };
    }

    return {
        title: "One more layer",
        explanation: "One final clarity check before we move to investigation.",
        intro: "How sure are we?",
        questions: [
            {
                key: "confidence",
                label: "How confident are you in the retention framing?",
                reason: "Confidence separates hard facts from gut feel.",
                options: [
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" }
                ]
            }
        ]
    };
}


/* --------------------------------------------
   GROWTH / ACQUISITION
-------------------------------------------- */

function buildGrowthClarification(classification) {

    return {
        title: "Clarifying the growth / acquisition problem",
        explanation:
            "A growth problem must be pinned to a specific stage of the acquisition "
            + "funnel. Is it awareness, activation, or a bottleneck partway through? "
            + "Let's identify where it actually breaks.",

        intro: "Which part of acquiring a user is failing?",

        questions: [

            {
                key: "stage",
                label: "Where in acquisition is the bottleneck?",
                reason: "Acquisition is not one stage — awareness vs activation have different causes.",
                options: [
                    { value: "awareness", label: "Awareness / reach (not enough people know)" },
                    { value: "install", label: "Install / initial interest" },
                    { value: "onboarding", label: "Onboarding / first-time setup" },
                    { value: "activation", label: "Activation (users don't get to first value)" },
                    { value: "registered", label: "Registration / sign-up" }
                ]
            },

            {
                key: "cost",
                label: "Is this a volume or cost and efficiency problem?",
                reason: "Too few users vs too expensive to get them requires different levers.",
                options: [
                    { value: "volume", label: "Not enough users coming in" },
                    { value: "cost", label: "Acquisition is too expensive / inefficient" },
                    { value: "quality", label: "Users come but don't stick (quality issue)" },
                    { value: "mix", label: "A mix of these" }
                ]
            },

            {
                key: "channels",
                label: "Are all channels equally affected?",
                reason: "Channel-level breakdown pinpoints whether the problem is a channel or the product.",
                options: [
                    { value: "all", label: "Across all channels" },
                    { value: "one", label: "One specific channel underperforms" },
                    { value: "unknown_channels", label: "Unknown yet" }
                ]
            }
        ]
    };
}


function growthFollowup(chosenKey, answers) {

    return {
        title: "Understanding the growth bottleneck",
        explanation:
            "A PM connects growth problems to the target metric and whether it's "
            + "a new-user or efficiency problem.",
        intro: "Final growth clarification:",
        questions: [
            {
                key: "metric",
                label: "What is the current growth metric moving?",
                reason: "Without a clear metric, growth improvements are guesses.",
                options: [
                    { value: "new_users", label: "New signups / registrations" },
                    { value: "installs", label: "Installs/downloads" },
                    { value: "activation", label: "Activation rate" },
                    { value: "cac", label: "Cost per acquisition" },
                    { value: "no_metric", label: "We need to define one" }
                ]
            }
        ]
    };
}


/* --------------------------------------------
   SATISFACTION / TRUST
-------------------------------------------- */

function buildSatisfactionClarification(classification) {

    return {
        title: "Understanding the satisfaction / trust problem",
        explanation:
            "Low satisfaction is a symptom, not a cause. A strong PM digs into the "
            + "specific friction or trust break, and which users feel it most.",

        intro: "Let's get specific about what's driving dissatisfaction.",

        questions: [

            {
                key: "trigger",
                label: "What is triggering the negative sentiment?",
                reason: "You must find the specific friction or trust break, not just 'unhappy users'.",
                options: [
                    { value: "reliability", label: "Reliability / technical failure" },
                    { value: "cost", label: "Cost / pricing / value for money" },
                    { value: "experience", label: "Product experience / confusing flow" },
                    { value: "support", label: "Customer support / service" },
                    { value: "trust", label: "Trust / safety / privacy concern" }
                ]
            },

            {
                key: "evidence",
                label: "How do you know users are dissatisfied?",
                reason: "The source of the signal (reviews vs data vs assumption) determines how strongly you weight it.",
                options: [
                    { value: "reviews", label: "Reviews / ratings / app store" },
                    { value: "nps", label: "NPS / CSAT survey scores" },
                    { value: "tickets", label: "Support tickets / complaints" },
                    { value: "churn", label: "Behavioural — users leaving" },
                    { value: "assumed", label: "It's an assumption right now" }
                ]
            },

            {
                key: "segment",
                label: "Which users are most negative?",
                reason: "Dissatisfaction is rarely uniform — segmentation locates the epicentre.",
                options: [
                    { value: "new", label: "New users" },
                    { value: "power", label: "Power / long-time users" },
                    { value: "specific", label: "A specific segment" },
                    { value: "all", label: "Everyone" },
                    { value: "unknown_segment", label: "Unknown" }
                ]
            }
        ]
    };
}


function satisfactionFollowup(chosenKey, answers) {

    return {
        title: "Weighing the satisfaction signal",
        explanation:
            "A PM would assess whether the negative signal is backed by enough "
            + "evidence to act on, and how it connects to business outcomes.",
        intro: "Two more questions:",
        questions: [
            {
                key: "severity",
                label: "How severe / widespread is the dissatisfaction?",
                reason: "Severity and reach determine priority.",
                options: [
                    { value: "severe", label: "Severe and widespread" },
                    { value: "growing", label: "Growing but not yet severe" },
                    { value: "niche", label: "Niche / small group" },
                    { value: "unknown_sev", label: "Unknown" }
                ]
            },
            {
                key: "business",
                label: "How does this hurt the business?",
                reason: "Tie the sentiment to revenue, churn, or brand impact.",
                options: [
                    { value: "churn", label: "Users leaving" },
                    { value: "revenue", label: "Revenue / spend impact" },
                    { value: "brand", label: "Brand / reputation damage" },
                    { value: "unsure_biz", label: "Not sure yet" }
                ]
            }
        ]
    };
}


/* --------------------------------------------
   STRATEGY
-------------------------------------------- */

function buildStrategyClarification(classification) {

    return {
        title: "Grounding the strategic problem",
        explanation:
            "A strategy / opportunity statement needs to be anchored to who it helps "
            + "and what outcome it targets, otherwise it's an idea, not a problem to solve.",

        intro: "Let's ground the strategic direction.",

        questions: [

            {
                key: "who",
                label: "Who is this for?",
                reason: "Strategy should name the target segment, not everyone.",
                options: [
                    { value: "new_seg", label: "A new user segment" },
                    { value: "existing", label: "Existing users" },
                    { value: "business", label: "The business / internal" },
                    { value: "unknown_who", label: "Not defined yet" }
                ]
            },

            {
                key: "outcome",
                label: "What outcome do you want to reach?",
                reason: "A strategy needs a measurable target to be actionable.",
                options: [
                    { value: "revenue", label: "Revenue / growth" },
                    { value: "engagement", label: "Engagement / usage" },
                    { value: "position", label: "Market position / differentiation" },
                    { value: "efficiency", label: "Cost / efficiency" },
                    { value: "unknown_outcome", label: "Not defined yet" }
                ]
            },

            {
                key: "urgency",
                label: "Why now?",
                reason: "Understanding the trigger (competitor, market, tech shift) explains why this is urgent.",
                options: [
                    { value: "competitor", label: "Competitive pressure" },
                    { value: "market", label: "Market / user behaviour shift" },
                    { value: "tech", label: "New technology / capability" },
                    { value: "internal", label: "Internal goal / mandate" },
                    { value: "unknown_urgency", label: "No clear trigger yet" }
                ]
            }
        ]
    };
}


function strategyFollowup(chosenKey, answers) {

    return {
        title: "Clarifying the strategic direction",
        explanation:
            "Knowing the target outcome and urgency lets us frame what a PM would "
            + "investigate first.",
        intro: "One more strategic question:",
        questions: [
            {
                key: "confidence",
                label: "How confident are you that this is the right direction?",
                reason: "Confidence flags how much discovery still needs to happen.",
                options: [
                    { value: "high", label: "High — direction is clear" },
                    { value: "medium", label: "Medium — some open questions" },
                    { value: "low", label: "Low — still exploring" }
                ]
            }
        ]
    };
}


/* --------------------------------------------
   GENERAL FALLBACK
-------------------------------------------- */

function buildGeneralClarification(classification) {

    return {
        title: "Let's make this a well-defined problem",
        explanation:
            "A strong PM does not start solving a vague statement. They first make "
            + "the problem concrete: who, what, when, and why it matters. "
            + "Let's do that with you.",

        intro: "A few quick questions to sharpen the problem.",

        questions: [

            {
                key: "who",
                label: "Who is affected by this?",
                reason: "Every problem has a user with a specific context.",
                options: [
                    { value: "users", label: "End users" },
                    { value: "customers", label: "Paying customers" },
                    { value: "business", label: "The business / internal team" },
                    { value: "unknown_who", label: "Not sure yet" }
                ]
            },

            {
                key: "what",
                label: "What is the specific outcome that is wrong?",
                reason: "Name the concrete failing outcome, not the symptom.",
                options: [
                    { value: "behaviour", label: "A user behaviour / action isn't happening" },
                    { value: "metric", label: "A metric is moving the wrong way" },
                    { value: "reliability", label: "Something is failing / breaking" },
                    { value: "unknown_what", label: "Not sure what specifically is wrong" }
                ]
            },

            {
                key: "why",
                label: "Why does this matter?",
                reason: "Connect the problem to a meaningful outcome (business or user).",
                options: [
                    { value: "revenue", label: "Revenue / growth impact" },
                    { value: "retention", label: "Users leaving" },
                    { value: "trust", label: "Trust / brand damage" },
                    { value: "unknown_why", label: "Not sure yet" }
                ]
            }
        ]
    };
}


function generalFollowup(chosenKey, answers) {

    return {
        title: "One final layer of clarity",
        explanation:
            "Good. Now we have a clearer picture. A PM would confirm the central "
            + "unknown before deciding what to investigate.",
        intro: "One last confirmation:",
        questions: [
            {
                key: "confidence",
                label: "How confident are you in the problem framing now?",
                reason: "Confidence tells the tool where to focus investigation.",
                options: [
                    { value: "high", label: "High — fairly clear" },
                    { value: "medium", label: "Medium — some gaps" },
                    { value: "low", label: "Low — lots still unknown" }
                ]
            }
        ]
    };
}


/* --------------------------------------------
   SUMMARY / OUTPUT
-------------------------------------------- */

export function synthesizeClarifiedProblem(classification, answers) {

    // Build a human-readable, refined problem statement that
    // reflects the epistemic status of what we know.

    const selected = Object.entries(answers)
        .filter(([key, value]) => value)
        .map(([key, value]) => ({ key, value }));

    return {
        original: classification.text,
        clarifiedParts: selected,
        summary: summarize(classification, selected),
        status: "refined"
    };
}


function summarize(classification, selected) {

    const typeLabel = classification.primaryType.label;
    const ambiguityNote = classification.ambiguity === "high"
        ? "The original statement was vague and has been clarified through questioning."
        : "";

    let lines = [
        `Problem type: ${typeLabel}.`
    ];

    if (ambiguityNote) {
        lines.push(ambiguityNote);
    }

    if (classification.entities.length > 0) {
        lines.push(`Products/context involved: ${classification.entities.join(", ")}.`);
    }

    if (selected.length > 0) {
        lines.push(
            "Through clarification we narrowed: "
            + selected.map(s => `"${s.value}"`).join(", ")
            + "."
        );
    }

    lines.push(
        "What remains unknown is what a PM should investigate next — this is where "
        + "evidence and investigation come in, rather than assumptions."
    );

    return lines.join(" ");
}
