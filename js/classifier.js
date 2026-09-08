// PMPLtool — Problem Classifier
//
// Pure logic. No DOM access. This module analyzes a problem
// statement and produces a classification that drives the rest
// of the tool.
//
// The classification is intentionally heuristic. It is not AI.
// It matches keywords and phrase patterns against hand-built
// profiles to decide which investigation/PM concepts are relevant.


export function classifyProblem(problem) {
    const text = (problem || "").trim();
    const lower = text.toLowerCase();

    const detectedClasses = [];
    let ambiguity = "unknown";

    // ---- ambiguity detection ----
    // A statement is "vague" when it lacks a concrete subject,
    // magnitude, or affected user. This is the signal that the
    // clarification engine should run.

    const vaguenessSignals = [
        "issues",
        "problem",
        "not working",
        "doesn't work",
        "not good",
        "bad",
        "low",
        "decreased",
        "declining",
        "worse",
        "failing",
        "struggling",
        "unhappy",
        "complaints",
        "features",
        "more features",
        "less features",
        "better",
        "worse"
    ];

    let vaguenessScore = 0;
    vaguenessSignals.forEach(signal => {
        if (lower.includes(signal)) {
            vaguenessScore += 1;
        }
    });

    // Specificity signals that reduce vagueness.
    const specificitySignals = [
        "%",
        "percent",
        "conversion",
        "drop",
        "increase",
        "decrease",
        "crash",
        "error",
        "retention",
        "churn",
        "signup",
        "checkout",
        "abandon",
        "daily active",
        "mau",
        "dau",
        "users",
        "customers",
        "revenue",
        "growth",
        "pricing",
        "competitor",
        "market",
        "feature",
        "bug",
        "slow",
        "loading",
        "payment",
        "subscription"
    ];

    let specificityScore = 0;
    specificitySignals.forEach(signal => {
        if (lower.includes(signal)) {
            specificityScore += 1;
        }
    });

    if (vaguenessScore >= 2 && specificityScore <= 2) {
        ambiguity = "high";
    } else if (vaguenessScore >= 1 && specificityScore <= 1) {
        ambiguity = "high";
    } else if (specificityScore >= 4) {
        ambiguity = "low";
    } else {
        ambiguity = "medium";
    }

    // ---- problem type classification ----

    const ruleSet = [

        {
            type: "conversion",
            label: "Conversion / Funnel",
            description: "A step in the user journey where users are not completing an intended action.",
            keywords: [
                "conversion", "checkout", "funnel", "signup", "abandon",
                "drop", "cart", "purchase", "complete", "transaction",
                "buy", "subscribe", "form"
            ]
        },

        {
            type: "retention",
            label: "Retention / Engagement",
            description: "Users are not returning or not staying engaged over time.",
            keywords: [
                "retention", "churn", "repeat", "returning", "inactive",
                "dau", "mau", "engagement", "loyalty", "uninstall",
                "quit", "stop using", "leave"
            ]
        },

        {
            type: "reliability",
            label: "Reliability / Technical",
            description: "A technical failure or degradation that prevents users from completing their task.",
            keywords: [
                "crash", "error", "slow", "bug", "technical", "loading",
                "down", "failed", "failure", "timeout", "pending",
                "processing", "server", "network", "latency"
            ]
        },

        {
            type: "competitive",
            label: "Competitive / Positioning",
            description: "The product's position relative to a competitor or alternative.",
            keywords: [
                "competitor", "competitive", "phonepe", "gpay", "paytm",
                "alternativ", "versus", "vs", "switch", "migrate",
                "better", "features", "feature", "market share", "price"
            ]
        },

        {
            type: "growth",
            label: "Growth / Acquisition",
            description: "Difficulty acquiring new users or expanding the user base.",
            keywords: [
                "growth", "acquisition", "new users", "signups", "download",
                "install", "activation", "onboarding", "reach", "awareness",
                "leads", "registration"
            ]
        },

        {
            type: "satisfaction",
            label: "Satisfaction / Trust",
            description: "Users are dissatisfied, losing trust, or expressing negative sentiment.",
            keywords: [
                "satisfaction", "unhappy", "complaints", "frustrat",
                "trust", "negative", "bad experience", "csat", "nps",
                "reviews", "rating", "angry", "upset"
            ]
        },

        {
            type: "strategy",
            label: "Strategy / Opportunity",
            description: "A forward-looking product or market opportunity or direction decision.",
            keywords: [
                "opportunit", "strategy", "roadmap", "launch", "expansion",
                "new market", "positioning", "differentiat", "entry",
                "vision", "innovate", "disrupt"
            ]
        }

    ];

    let bestRule = null;
    let bestRuleScore = 0;

    ruleSet.forEach(rule => {
        let score = 0;
        rule.keywords.forEach(kw => {
            if (lower.includes(kw)) {
                score += 1;
            }
        });
        if (score > bestRuleScore) {
            bestRuleScore = score;
            bestRule = rule;
        }
    });

    // Fallback when nothing matches.
    if (!bestRule || bestRuleScore === 0) {
        bestRule = {
            type: "general",
            label: "General Product Problem",
            description: "A product problem that needs clarification before any specific framework applies.",
            keywords: []
        };
    }

    // ---- entity detection (companies / products) ----
    const knownEntities = [
        "phonepe", "gpay", "google pay", "paytm", "amazon pay",
        "upi", "razorpay", "stripe", "paypal", "swiggy", "zomato",
        "flipkart", "amazon", "meesho", "cred", "myntra", "netflix",
        "spotify", "uber", "ola", "airbnb", "booking"
    ];

    const detectedEntities = [];
    knownEntities.forEach(entity => {
        if (lower.includes(entity)) {
            detectedEntities.push(normalizeEntity(entity));
        }
    });

    return {
        text,
        ambiguity,
        primaryType: bestRule,
        relevantTypes: ruleSet
            .filter(rule => {
                const score = rule.keywords.reduce(
                    (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
                    0
                );
                return score > 0;
            })
            .map(rule => rule.type),
        entities: detectedEntities,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
}


function normalizeEntity(entity) {
    const map = {
        "gpay": "GPay",
        "google pay": "GPay",
        "phonepe": "PhonePe",
        "paytm": "Paytm",
        "amazon pay": "Amazon Pay",
        "upi": "UPI",
        "swiggy": "Swiggy",
        "zomato": "Zomato",
        "flipkart": "Flipkart",
        "amazon": "Amazon",
        "meesho": "Meesho",
        "cred": "CRED"
    };
    return map[entity] || entity;
}
