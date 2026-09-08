// PMPLtool — Investigation Path Generation & Scenario Content
//
// Pure reasoning module. No DOM, no localStorage.
//
// buildInvestigationPaths() returns the investigation paths a PM would
// pursue for a given problem classification. Phase 2 adds SCENARIOS to each
// path: plausible explanations worth checking.
//
// A scenario is HYPOTHETICAL — NOT VERIFIED. It is not evidence. The reason
// logic that reads scenarios lives in scenarios.js and hypotheses.js; this
// file only provides content so a future AI/research layer can replace the
// scenarios without touching the UI or the reasoning.


// id: "<type>.<n>" (n = 1-based position of the path within its type)
function pathId(type, n) {
    return type + "." + n;
}


// Scenarios are authored as compact objects and normalized to a stable
// schema by withPath() below. Fields:
//
//   scenario          what might be going on (plausible, NOT confirmed)
//   meaning           what it would mean if true
//   whyPMCare         why a PM should care
//   userBehaviour     the behaviour this could change (conditional)
//   businessConsequence  the consequence that could follow (conditional)
//   unknown           what we still don't know
//   nextQuestion      the question that reduces the most uncertainty next
//   theme             uncertainty theme (used to converge scenarios)
function withPath(type, n, scenarios) {
    return scenarios.map((s, i) => Object.assign({}, s, {
        id: type + "." + n + ".s" + (i + 1),
        path: pathId(type, n)
    }));
}


export function buildInvestigationPaths(classification) {

    const type = classification.primaryType.type;

    const pathsByType = {

        competitive: [
            {
                title: "User jobs & behaviour",
                description:
                    "Understand the specific jobs users accomplish with each product "
                    + "and whether the feature gap actually changes behaviour.",
                checks: [
                    "Which specific job is the user trying to do?",
                    "Does the missing feature block that job, or just add convenience?",
                    "Do users actually attempt the alternative, or is it perception?",
                    "How frequently does the behaviour difference occur?"
                ],
                why:
                    "A competitive feature gap only matters if it changes what users do. "
                    + "This path separates real behaviour change from perceived differences.",
                scenarios: withPath("competitive", 1, [
                    {
                        theme: "behaviour-change",
                        scenario: "Users accomplish the same job on both products, but the missing feature only adds convenience — behaviour does not actually change.",
                        meaning: "the feature gap is real but not decisive.",
                        whyPMCare: "a gap that doesn't change behaviour is a perception issue, not a product loss.",
                        userBehaviour: "users keep returning to your product for the core job; the missing feature stays unused.",
                        businessConsequence: "no real revenue or retention loss from the feature gap.",
                        unknown: "whether users actually perceive the gap, or simply don't notice it.",
                        nextQuestion: "Do users ever attempt the alternative feature, or do they never miss it?"
                    },
                    {
                        theme: "behaviour-change",
                        scenario: "Users have started doing part of the job on the competitor because the feature gap blocks a task they do regularly.",
                        meaning: "the gap changes behaviour for a specific, frequent job.",
                        whyPMCare: "behavioural switching is the only version of this problem that matters for the business.",
                        userBehaviour: "users split their workflow across both products; frequency on your product drops for that job.",
                        businessConsequence: "segmented revenue loss plus rising reputation for the competitor.",
                        unknown: "whether this is a small, specific cohort or broad behaviour.",
                        nextQuestion: "Which exact job is being offloaded, and how often do users do it?"
                    },
                    {
                        theme: "perception",
                        scenario: "The difference is mostly perception — users believe the other product is 'richer' even when the job works fine here.",
                        meaning: "the gap is marketing and habit, not capability.",
                        whyPMCare: "the fix would be communication and positioning, not a feature build.",
                        userBehaviour: "users stay but feel your product is inferior; trust may erode over time.",
                        businessConsequence: "slow trust decay and harder upgrade sales.",
                        unknown: "what feeds the perception — ads, defaults, or prior experience.",
                        nextQuestion: "Where does the perception of inferiority come from?"
                    }
                ])
            },
            {
                title: "Competitive positioning",
                description:
                    "Assess where your product vs. alternatives sit in the market and "
                    + "what the real differentiation is.",
                checks: [
                    "What core value does each product deliver?",
                    "Is the competition winning on features, price, trust, or habit?",
                    "What would the user lose by switching, and what would they gain?",
                    "Is this a defensible position for the long term?"
                ],
                why:
                    "Feature-count gaps are often a symptom of a deeper positioning "
                    + "question. This path forces you to think strategically, not just "
                    + "list features.",
                scenarios: withPath("competitive", 2, [
                    {
                        theme: "differentiation",
                        scenario: "Both products deliver the same core value, so the gap is positional identity, not value — users see your product as the less 'complete' one.",
                        meaning: "your positioning—not the feature list—drives the comparison.",
                        whyPMCare: "positioning can be fixed with a clear identity; a feature war cannot be won.",
                        userBehaviour: "users default to the competitor because of assumed completeness, not demonstrated value.",
                        businessConsequence: "share is lost to perception even where your product is stronger.",
                        unknown: "what identity users actually associate with each product.",
                        nextQuestion: "How do users describe each product's identity in their own words?"
                    },
                    {
                        theme: "winning-dimension",
                        scenario: "Competition is being won on a dimension other than features — trust, price, or habit.",
                        meaning: "the real battle is elsewhere; feature parity wouldn't change it.",
                        whyPMCare: "attacking the wrong dimension wastes every team cycle.",
                        userBehaviour: "users choose the alternative for credibility, cost, or inertia — not capabilities.",
                        businessConsequence: "feature investment won't move share if the winning dimension is untouched.",
                        unknown: "which non-feature dimension dominates the choice.",
                        nextQuestion: "What do switch-stayers say actually tipped their choice?"
                    },
                    {
                        theme: "switch-cost",
                        scenario: "Switching costs and habit bind users to a product regardless of features.",
                        meaning: "stickiness protects you (or the competitor) more than features do.",
                        whyPMCare: "understanding the binding force reveals whether the gap is even reachable.",
                        userBehaviour: "users complain about the gap but never act because migration is painful.",
                        businessConsequence: "the competitive threat is lower than the fuss suggests — friction is on your side.",
                        unknown: "how heavy the real switching cost is.",
                        nextQuestion: "What exactly would a user have to give up to switch?"
                    }
                ])
            },
            {
                title: "Evidence & signals",
                description:
                    "Determine what evidence exists to support that the competitive "
                    + "gap is causing real user or business loss.",
                checks: [
                    "Do we have data showing users switching or choosing the alternative?",
                    "Are there support tickets, reviews, or complaints?",
                    "Is the impact on revenue, retention, or acquisition known?",
                    "What is still assumption vs. measured?"
                ],
                why:
                    "A PM never treats a competitive claim as fact without evidence. "
                    + "This path sorts what we know from what we assume.",
                scenarios: withPath("competitive", 3, [
                    {
                        theme: "measured-switching",
                        scenario: "Product data already show users switching — usage on the alternative correlates with declining usage on yours.",
                        meaning: "the competitive gap is real and behavioural, not anecdotal.",
                        whyPMCare: "measured switching is the evidence version of the problem — worth a full response.",
                        userBehaviour: "a measurable share of users does the job across the two products.",
                        businessConsequence: "revenue loss is real and attributable to the competitor.",
                        unknown: "whether the measured switching causes actual financial loss.",
                        nextQuestion: "Does the switching behaviour translate into lost revenue and retention?"
                    },
                    {
                        theme: "anecdote",
                        scenario: "Support tickets and reviews mention the competitor, but product data cannot confirm any behaviour change yet.",
                        meaning: "the claim is anecdotal — unverified, not yet a finding.",
                        whyPMCare: "a PM withholds judgment until behaviour data confirms the story.",
                        userBehaviour: "complaints exist; the corresponding behaviour has not been measured.",
                        businessConsequence: "the business impact is unknown until the behaviour is actually tracked.",
                        unknown: "whether the anecdote reflects a broad, real behaviour.",
                        nextQuestion: "What metric would confirm or refute the anecdote?"
                    },
                    {
                        theme: "assumption",
                        scenario: "The competitive concern is currently an assumption in the room — nobody has checked the data at all.",
                        meaning: "the problem may not exist beyond the assumption.",
                        whyPMCare: "assumptions are where wasted feature work comes from — check before building.",
                        userBehaviour: "no measured behaviour difference is known either way.",
                        businessConsequence: "investment based on this assumption is a gamble, not a plan.",
                        unknown: "whether the competitive gap matters at all.",
                        nextQuestion: "What is the cheapest check that validates or kills the assumption?"
                    }
                ])
            }
        ],

        reliability: [
            {
                title: "Failure mode isolation",
                description:
                    "Pinpoint the exact technical failure mode and who/what it affects.",
                checks: [
                    "What system or step fails, and how?",
                    "Is isolated to a platform, segment, method, or region?",
                    "What error / status is produced?",
                    "Is it a new regression or chronic?"
                ],
                why:
                    "You cannot fix 'it doesn't work'. You must isolate the exact "
                    + "failure mode before investigating root cause.",
                scenarios: withPath("reliability", 1, [
                    {
                        theme: "isolation",
                        scenario: "The failure is isolated to one specific step (for example, the UPI PIN retry) rather than the whole flow.",
                        meaning: "a narrow, fixable defect in one sub-step.",
                        whyPMCare: "isolating the step is what turns 'it doesn't work' into an actionable bug.",
                        userBehaviour: "users get through every other step; they only bounce at that one step.",
                        businessConsequence: "the drop-off is concentrated at a single step — one fix recovers most of it.",
                        unknown: "whether the step fails for everyone or only some users.",
                        nextQuestion: "Does the failing step affect all users, or a platform/segment?"
                    },
                    {
                        theme: "scope",
                        scenario: "The failure appears only for a specific platform, app version, or user segment.",
                        meaning: "a version- or segment-specific defect, not a systemic outage.",
                        whyPMCare: "narrow scope means a scoped root cause — the fix is fast.",
                        userBehaviour: "one group is blocked while others are unaffected and unaware.",
                        businessConsequence: "losses are concentrated in that cohort (for example, older devices).",
                        unknown: "what distinguishes the affected cohort.",
                        nextQuestion: "Does the affected cohort share a version, OS, or payment method?"
                    },
                    {
                        theme: "regression",
                        scenario: "The failure started recently and can be correlated with a release, config, or dependency change.",
                        meaning: "a regression from a recent change, not a chronic design limit.",
                        whyPMCare: "regressions are the fastest to find: diff what changed.",
                        userBehaviour: "users who previously paid fine now hit failures — trust drops quickly.",
                        businessConsequence: "a sudden, recent revenue dip and a spike in support tickets.",
                        unknown: "exactly which change is responsible.",
                        nextQuestion: "What shipped right before the error rate started climbing?"
                    }
                ])
            },
            {
                title: "User impact & behaviour",
                description:
                    "Understand what users do after the failure and the real cost.",
                checks: [
                    "Do users retry, switch, or give up?",
                    "Does the failure erode trust or future usage?",
                    "How often does each user hit it?",
                    "What is the business cost of the lost behaviour?"
                ],
                why:
                    "The same technical error can have very different business impact "
                    + "depending on what users do afterward. This path quantifies it.",
                scenarios: withPath("reliability", 2, [
                    {
                        theme: "give-up",
                        scenario: "When the failure happens, users retry once or twice and then give up for the session.",
                        meaning: "the failure directly kills the intended behaviour.",
                        whyPMCare: "a PM cares because the error converts instantly into lost behaviour.",
                        userBehaviour: "one attempted purchase or action dies; users do not persist through the failure.",
                        businessConsequence: "each failure event costs a real transaction in the moment.",
                        unknown: "whether users return later or move on for good.",
                        nextQuestion: "Do users retry later, or does the failure end the attempt?"
                    },
                    {
                        theme: "switch",
                        scenario: "Frustrated users try another payment method or another app — the failure pushes them to alternatives.",
                        meaning: "reliability here leaks users to competitors.",
                        whyPMCare: "this is how a reliability issue turns into retention loss.",
                        userBehaviour: "users who hit the failure shift future behaviour to the alternative.",
                        businessConsequence: "lost transactions now and eroded loyalty later.",
                        unknown: "how many users actually switch versus merely retry.",
                        nextQuestion: "What share of failed users switch to an alternative within a week?"
                    },
                    {
                        theme: "trust",
                        scenario: "Even users who eventually succeed lose trust — after a failure they hesitate before the next attempt.",
                        meaning: "the failure erodes confidence even when it doesn't block the behaviour.",
                        whyPMCare: "trust is hard to rebuild and shows up later as reduced frequency.",
                        userBehaviour: "users transact less often or re-verify details repeatedly before completing.",
                        businessConsequence: "reduced order frequency and a longer time to the next purchase.",
                        unknown: "whether the hesitation decays or persists over time.",
                        nextQuestion: "Does post-failure hesitation fade, or does frequency stay lower?"
                    }
                ])
            },
            {
                title: "Release & change investigation",
                description:
                    "Look for recent changes correlated with the issue — releases, configs, dependencies.",
                checks: [
                    "Was there a recent release, config, or dependency change?",
                    "Did error rates jump at a specific time?",
                    "Do affected users correlate with a specific app version?",
                    "Is there a related incident or on-call report?"
                ],
                why:
                    "Many reliability problems are regressions from a recent change. "
                    + "Correlating the change with the issue is often the fastest path "
                    + "to root cause.",
                scenarios: withPath("reliability", 3, [
                    {
                        theme: "regression",
                        scenario: "Error counts jumped at a specific time that matches a recent release.",
                        meaning: "the issue is almost certainly a regression tied to that change.",
                        whyPMCare: "a correlated release is the single best lead for root cause.",
                        userBehaviour: "users are affected only after the new version; older versions behave fine.",
                        businessConsequence: "the cost is bounded to the period since the release.",
                        unknown: "whether the release causes the jump or merely coincides with it.",
                        nextQuestion: "Do error rates drop when the change is rolled back?"
                    },
                    {
                        theme: "correlation",
                        scenario: "Incident and on-call reports this week already reference a related problem.",
                        meaning: "the signal is corroborated by the ops team, not just one report.",
                        whyPMCare: "corroboration upgrades the claim from assumption toward evidence.",
                        userBehaviour: "affected users coincide with the incident window.",
                        businessConsequence: "the impact window is known and reportable.",
                        unknown: "the severity and reach of the incident across the user base.",
                        nextQuestion: "What does the incident report say about scope and resolution?"
                    },
                    {
                        theme: "version",
                        scenario: "Affected users cluster on a specific app/client version.",
                        meaning: "the defect is version-specific — a deployment problem, not product design.",
                        whyPMCare: "a version cluster isolates the fix to a release path.",
                        userBehaviour: "users on that version behave differently from everyone else.",
                        businessConsequence: "limited blast radius, fixable via deployment.",
                        unknown: "what differs in that version versus working versions.",
                        nextQuestion: "What changed in the affected version compared with the working one?"
                    }
                ])
            }
        ],

        conversion: [
            {
                title: "Funnel & step analysis",
                description:
                    "Localize where in the journey users drop off before deciding on causes.",
                checks: [
                    "Which exact step has the highest drop-off?",
                    "What is the drop percentage at each step?",
                    "How does it compare to a previous baseline?",
                    "Is the drop at entry, mid, or checkout?"
                ],
                why:
                    "The step where users drop is the single biggest clue. Different "
                    + "steps have entirely different likely causes.",
                scenarios: withPath("conversion", 1, [
                    {
                        theme: "localize",
                        scenario: "The drop concentrates at one specific step (for example, checkout) rather than across the funnel.",
                        meaning: "a localized blocker at that step, not a funnel-wide problem.",
                        whyPMCare: "localized drops have localized causes — no need to redesign the whole funnel.",
                        userBehaviour: "users who reach the step stall; all earlier steps convert normally.",
                        businessConsequence: "recovery is proportional to that step's loss — one fix, clear upside.",
                        unknown: "which exact step dominates the loss.",
                        nextQuestion: "Which step loses the most users relative to its entry volume?"
                    },
                    {
                        theme: "baseline",
                        scenario: "Conversion used to be higher — the drop reflects a shift from a previously healthy baseline.",
                        meaning: "something regressed recently rather than always being broken.",
                        whyPMCare: "a baseline change points to a recent cause, not a redesign project.",
                        userBehaviour: "behaviour that used to convert now stops at the same step.",
                        businessConsequence: "the lost amount equals the gap from baseline — known and recoverable.",
                        unknown: "what changed right around when the baseline shifted.",
                        nextQuestion: "What shipped or changed in the window where conversion dropped?"
                    },
                    {
                        theme: "entry",
                        scenario: "The leak is at the very start — users drop before reaching the first meaningful step.",
                        meaning: "the problem is entry friction or low intent, not the core flow.",
                        whyPMCare: "fixing later steps won't help if users never start.",
                        userBehaviour: "users exit in the first minute; they don't meaningfully attempt the funnel.",
                        businessConsequence: "all downstream value is capped by this entry leak.",
                        unknown: "whether the leak is accidental entry or low intent.",
                        nextQuestion: "Do users drop because entry is confusing, slow, or because they weren't serious?"
                    }
                ])
            },
            {
                title: "Segmentation & cohorts",
                description:
                    "Determine whether the drop is universal or cohort-specific.",
                checks: [
                    "Does the drop vary by user type, platform, or acquisition channel?",
                    "Are new vs. returning users affected differently?",
                    "Are there regional or time-of-day patterns?",
                    "Which segment drives the majority of the drop?"
                ],
                why:
                    "If only one segment drops, the cause is specific to that segment — "
                    + "this narrows the investigation dramatically.",
                scenarios: withPath("conversion", 2, [
                    {
                        theme: "segment",
                        scenario: "The drop is concentrated in one user segment while others convert normally.",
                        meaning: "a segment-specific blocker, not a universal issue.",
                        whyPMCare: "a segment-specific cause is dramatically easier to find and fix.",
                        userBehaviour: "the affected segment behaves differently at the same step.",
                        businessConsequence: "targeted remediation can recover that segment's lost value.",
                        unknown: "what about that segment creates the blocker.",
                        nextQuestion: "What is different about how the affected segment experiences the funnel?"
                    },
                    {
                        theme: "acquisition-quality",
                        scenario: "Users acquired through certain channels convert far worse than loyal or organic ones.",
                        meaning: "the issue is acquisition quality or intent, not the product flow.",
                        whyPMCare: "a PM separates product problems from channel-quality problems.",
                        userBehaviour: "channel-sourced users churn in the funnel despite similar product behaviour.",
                        businessConsequence: "spend on those channels converts poorly — an acquisition cost problem.",
                        unknown: "whether those users differ in intent or device.",
                        nextQuestion: "Do channel users differ in intent, device, or prior experience?"
                    },
                    {
                        theme: "new-vs-returning",
                        scenario: "New users drop much harder than returning users.",
                        meaning: "an onboarding/activation issue, not the core purchase flow.",
                        whyPMCare: "new-user and returning-user problems need different fixes — never conflate them.",
                        userBehaviour: "returning users convert; new users stall on first-time friction.",
                        businessConsequence: "the activation gate caps the future base of repeat users.",
                        unknown: "which first-time friction causes the stall.",
                        nextQuestion: "Which onboarding step loses new users specifically?"
                    }
                ])
            },
            {
                title: "Change correlation",
                description:
                    "Find what changed around when the drop began.",
                checks: [
                    "What product, pricing, or UX changes shipped recently?",
                    "Did any competitor or market change coincide?",
                    "Was there a seasonal or external factor?",
                    "Is the change correlated in time with the drop?"
                ],
                why:
                    "Correlating the drop with a change is often the fastest shortcut "
                    + "to a likely root cause.",
                scenarios: withPath("conversion", 3, [
                    {
                        theme: "regression",
                        scenario: "Conversion began dropping right after a product, pricing, or UX change.",
                        meaning: "the recent change is a prime suspect.",
                        whyPMCare: "change correlation is the fastest shortcut to a likely cause.",
                        userBehaviour: "users who were fine before the change now stop at the same step.",
                        businessConsequence: "impact is bounded to post-change behaviour — timing is known.",
                        unknown: "whether the change or a coinciding factor caused the drop.",
                        nextQuestion: "Is the drop reversible by rolling back or adjusting the change?"
                    },
                    {
                        theme: "seasonal",
                        scenario: "The drop lines up with a seasonal or external factor rather than a product change.",
                        meaning: "the pattern could be seasonal, not regressive.",
                        whyPMCare: "avoid fixing a seasonality problem with a product change.",
                        userBehaviour: "behaviour dips predictably with the external cycle.",
                        businessConsequence: "the fluctuation may be expected — monitoring may be the right response.",
                        unknown: "whether this drop matches the historical seasonal shape.",
                        nextQuestion: "Does the same period last year show a similar dip?"
                    },
                    {
                        theme: "competitor",
                        scenario: "A competitor launch or market event coincided with the drop.",
                        meaning: "users may be choosing the alternative — the drop is competitive.",
                        whyPMCare: "competitive drops need competitive responses, not funnel tinkering.",
                        userBehaviour: "users leave the funnel at the point the alternative becomes more attractive.",
                        businessConsequence: "a market-share shift rather than just a conversion regression.",
                        unknown: "whether the competitor event truly drove the change.",
                        nextQuestion: "Did users go to the alternative, and why that one?"
                    }
                ])
            }
        ],

        retention: [
            {
                title: "Cohort & lifecycle analysis",
                description:
                    "Understand when users leave in their lifecycle and which cohorts are worst.",
                checks: [
                    "At what day/week does retention drop fastest?",
                    "Which acquisition cohorts have the worst retention?",
                    "Is the drop immediate or gradual?",
                    "What is the baseline and target for cohort retention?"
                ],
                why:
                    "Retention is a cohort story. Knowing when and for which cohort "
                    + "users leave points to the specific moment value is lost.",
                scenarios: withPath("retention", 1, [
                    {
                        theme: "lifecycle",
                        scenario: "Retention drops sharply at a specific point in the lifecycle (for example, week 1 or day 30).",
                        meaning: "a specific moment of lost value, not gradual decay.",
                        whyPMCare: "the moment points to the feature or experience that should carry users forward.",
                        userBehaviour: "users who pass the moment stay; those who don't churn quickly.",
                        businessConsequence: "fixing the moment lifts whole cohorts, compounding over time.",
                        unknown: "what the failing moments have in common.",
                        nextQuestion: "What happens just before the drop-off point in each cohort?"
                    },
                    {
                        theme: "cohort",
                        scenario: "One acquisition cohort retains far worse than others.",
                        meaning: "something about that cohort's entry (source, timing, experience) is broken.",
                        whyPMCare: "cohort isolation separates entry quality from product quality.",
                        userBehaviour: "that cohort behaves like others briefly, then falls behind.",
                        businessConsequence: "the acquisition source may be economically toxic at scale.",
                        unknown: "what makes that cohort different from healthy ones.",
                        nextQuestion: "Where did that cohort come from, and what did they experience first?"
                    },
                    {
                        theme: "baseline",
                        scenario: "Retention has fallen from a previous baseline for all cohorts.",
                        meaning: "a broad product or market regression, not a cohort quirk.",
                        whyPMCare: "broad decay needs a root cause that affects everyone — the stakes are highest here.",
                        userBehaviour: "once-loyal users return less across the board.",
                        businessConsequence: "the whole base is eroding — the most expensive version of the problem.",
                        unknown: "what changed globally around the fall.",
                        nextQuestion: "What product or market change coincided with the baseline drop?"
                    }
                ])
            },
            {
                title: "Value & experience investigation",
                description:
                    "Determine whether users experience the core value before leaving.",
                checks: [
                    "Do users reach the 'aha' (first value) moment?",
                    "What does the user actually experience in the first sessions?",
                    "Where does friction or confusion appear?",
                    "Do users who get value behave differently from those who don't?"
                ],
                why:
                    "The most common retention killer is users never reaching real "
                    + "value. This path tests that directly.",
                scenarios: withPath("retention", 2, [
                    {
                        theme: "aha",
                        scenario: "Many leavers never reach the moment of first value ('aha').",
                        meaning: "activation is the retention gate — they never saw why to stay.",
                        whyPMCare: "retention often fails at first value, not at the end of the journey.",
                        userBehaviour: "users try once and leave before value is experienced.",
                        businessConsequence: "acquisition spend is wasted on users who never activated — a double cost.",
                        unknown: "what blocks the path to first value.",
                        nextQuestion: "Which step usually precedes the user giving up?"
                    },
                    {
                        theme: "friction",
                        scenario: "Leavers hit real friction (slow, confusing, or uncertain experiences) in their early sessions.",
                        meaning: "experience quality drives the exit, not a lack of need.",
                        whyPMCare: "friction is directly fixable — a rare lever fully under your control.",
                        userBehaviour: "users who might have returned instead associate the product with effort.",
                        businessConsequence: "churn concentrated in the first weeks, invisible in later-week numbers.",
                        unknown: "which friction matters most to leavers.",
                        nextQuestion: "Which single point of friction is cited by the most leavers?"
                    },
                    {
                        theme: "value-gap",
                        scenario: "Users who reach value behave measurably differently from those who don't.",
                        meaning: "the value experience separates the loyal from the leavers.",
                        whyPMCare: "the value-gap is a natural experiment: get more users to value and retention follows.",
                        userBehaviour: "value-reachers stay; non-reachers churn at the same rate as newcomers.",
                        businessConsequence: "moving more users to value is a direct retention play.",
                        unknown: "what prevents the non-reachers from reaching value.",
                        nextQuestion: "What, exactly, separates the users who get value from those who don't?"
                    }
                ])
            },
            {
                title: "Alternative & separation",
                description:
                    "Understand what users do instead — do they switch to an alternative?",
                checks: [
                    "Are users moving to a competitor or substitute?",
                    "What would a switching user lose or gain?",
                    "Is there a pattern in what users do before leaving?",
                    "Is the separation driven by need, habit, or dissatisfaction?"
                ],
                why:
                    "Retention problems sometimes aren't about your product at all — "
                    + "they're about a better or more convenient alternative.",
                scenarios: withPath("retention", 3, [
                    {
                        theme: "switch",
                        scenario: "Leavers are moving to a specific competitor or substitute.",
                        meaning: "a competitive separation — the alternative serves them better.",
                        whyPMCare: "the fix is a competitive response, not a generic improvement.",
                        userBehaviour: "former users do the same job elsewhere.",
                        businessConsequence: "direct market-share loss proportional to the switchers.",
                        unknown: "which alternative wins and why.",
                        nextQuestion: "What does the alternative offer leavers that you don't?"
                    },
                    {
                        theme: "need",
                        scenario: "Leavers simply stop needing the product — the need faded rather than a switch.",
                        meaning: "a need-based separation, not dissatisfaction.",
                        whyPMCare: "retention can't be 'fixed' if the need ended — segment on need instead.",
                        userBehaviour: "usage ends naturally when the underlying job ends.",
                        businessConsequence: "the addressable base for growth is smaller than it appears.",
                        unknown: "how long the underlying need typically lasts.",
                        nextQuestion: "Does usage end when a measurable life event happens?"
                    },
                    {
                        theme: "habit",
                        scenario: "Leavers are driven by habit and convenience rather than a better product.",
                        meaning: "a defaults-and-habit problem — friction froze them out.",
                        whyPMCare: "habit is beatable with triggers and accessibility, not new features.",
                        userBehaviour: "users who might inspect the product now default elsewhere.",
                        businessConsequence: "silent, gradual erosion of share.",
                        unknown: "what defaults or routines anchor them to the alternative.",
                        nextQuestion: "What changed in their routine that broke the habit?"
                    }
                ])
            }
        ],

        growth: [
            {
                title: "Acquisition funnel breakdown",
                description:
                    "Break the acquisition journey into stages and find where each leaks.",
                checks: [
                    "Awareness → install → onboarding → first value — where is the leak?",
                    "What is the conversion rate at each stage?",
                    "Which stage has the biggest room to improve?",
                    "Is the bottleneck awareness, interest, or activation?"
                ],
                why:
                    "Growth is a series of conversions, not one metric. The stage that "
                    + "leaks most should drive the strategy.",
                scenarios: withPath("growth", 1, [
                    {
                        theme: "awareness",
                        scenario: "The biggest leak is at awareness → consideration — too few people learn the product exists.",
                        meaning: "a reach problem, not a product problem yet.",
                        whyPMCare: "a PM must know whether growth needs marketing or product.",
                        userBehaviour: "people outside the funnel never surface — no behaviour to fix.",
                        businessConsequence: "growth is capped by top-of-funnel volume regardless of product quality.",
                        unknown: "reach relative to the addressable market.",
                        nextQuestion: "What share of the target audience has even heard of the product?"
                    },
                    {
                        theme: "consideration",
                        scenario: "Users are interested but hesitate at the decision step (price, trust, or fit).",
                        meaning: "a consideration blocker between intent and action.",
                        whyPMCare: "removing a consideration blocker converts existing interest into growth.",
                        userBehaviour: "high intent, stalled action — users who are 'close' but never decide.",
                        businessConsequence: "latent demand is visible but unharvested.",
                        unknown: "which blocker (price, trust, or fit) dominates.",
                        nextQuestion: "What do undecided users say gives them pause?"
                    },
                    {
                        theme: "activation-bottleneck",
                        scenario: "The biggest leak is at signup → first value — many install, few activate.",
                        meaning: "activation is the growth bottleneck, not acquisition.",
                        whyPMCare: "improving activation lifts every downstream metric without more spend.",
                        userBehaviour: "installed users stall before first value; the funnel looks fine until activation.",
                        businessConsequence: "acquisition spend yields no retention — the classic waste loop.",
                        unknown: "which activation step kills the most installs.",
                        nextQuestion: "Where, exactly, do new installs stop before value?"
                    }
                ])
            },
            {
                title: "Channel & cost analysis",
                description:
                    "Understand which channels work and whether the problem is volume or efficiency.",
                checks: [
                    "Which channels bring quality users vs. churners?",
                    "What is CAC per channel and does it vary?",
                    "Is the issue too few users or too expensive acquisition?",
                    "Where does word-of-mouth / organic come from?"
                ],
                why:
                    "The same growth problem can need a spend strategy or a product "
                    + "strategy. Channel economics tells you which.",
                scenarios: withPath("growth", 2, [
                    {
                        theme: "channel-quality",
                        scenario: "Some channels bring quality users; others bring heavy churners.",
                        meaning: "the growth problem is channel mix, not overall volume.",
                        whyPMCare: "a PM reallocates spend instead of changing the product.",
                        userBehaviour: "high-churn cohorts entered through specific channels.",
                        businessConsequence: "channel economics decide ROI — the wrong mix loses money per user.",
                        unknown: "how CAC and retention differ by channel.",
                        nextQuestion: "Which channels produce users that retain, and at what cost?"
                    },
                    {
                        theme: "efficiency",
                        scenario: "Volume is fine but cost per acquisition is high across all channels.",
                        meaning: "an efficiency problem — growth at current cost may destroy value.",
                        whyPMCare: "if lifetime value is below acquisition cost, every new user shrinks the business.",
                        userBehaviour: "users are acquired, but expensively enough to make scale unprofitable.",
                        businessConsequence: "growth at this CAC shrinks margin instead of compounding it.",
                        unknown: "the true ratio of lifetime value to acquisition cost.",
                        nextQuestion: "Does current CAC allow the unit economics to work at scale?"
                    },
                    {
                        theme: "organic",
                        scenario: "Organic and word-of-mouth referrals are nearly absent.",
                        meaning: "the product is not triggering natural spread.",
                        whyPMCare: "organic growth is the strongest proof of real value — its absence is a product signal.",
                        userBehaviour: "satisfied users never bring others, so growth is always paid.",
                        businessConsequence: "growth stays permanently dependent on paid acquisition.",
                        unknown: "whether users don't praise the product or are never able to share it.",
                        nextQuestion: "Do users succeed so quietly that the product never becomes shareable?"
                    }
                ])
            },
            {
                title: "Activation & time to value",
                description:
                    "Assess whether new users actually reach first value quickly.",
                checks: [
                    "How long does it take a new user to get value?",
                    "What is the activation rate (users reaching value)?",
                    "What friction blocks activation?",
                    "Does improving activation scale retention and growth together?"
                ],
                why:
                    "Getting users in is only half the battle. If they don't activate, "
                    + "acquisition spend is wasted — a huge hidden growth lever.",
                scenarios: withPath("growth", 3, [
                    {
                        theme: "time-to-value",
                        scenario: "Users take a long time to reach first value, and each added step leaks users.",
                        meaning: "time-to-value is the activation killer.",
                        whyPMCare: "compressing time-to-value is the highest-leverage growth lever.",
                        userBehaviour: "users who get value fast stay; slower users drift away first.",
                        businessConsequence: "the activation rate caps the whole growth curve.",
                        unknown: "the exact time-to-value distribution.",
                        nextQuestion: "How long, on average, does a user take to reach value?"
                    },
                    {
                        theme: "blocker",
                        scenario: "A specific setup step or friction blocks activation for most new users.",
                        meaning: "activation is blocked by a concrete, fixable step.",
                        whyPMCare: "removing a single blocker raises activation for everyone at once.",
                        userBehaviour: "new users stall at the same setup or onboarding point.",
                        businessConsequence: "most installs never become active users.",
                        unknown: "what the blocker is and why it is hard to pass.",
                        nextQuestion: "Which setup step do most newly-stuck users stall on?"
                    },
                    {
                        theme: "prompted",
                        scenario: "Users activate only when prompted — activation is aided, not spontaneous.",
                        meaning: "the value isn't self-evident; it needs triggers.",
                        whyPMCare: "prompted activation is fragile but immediately improvable.",
                        userBehaviour: "unprompted users never activate; nudged users do.",
                        businessConsequence: "activation depends on reminder cadence — a scaling constraint.",
                        unknown: "whether prompted activation creates its own habit.",
                        nextQuestion: "Do nudge-activated users stay once the prompts stop?"
                    }
                ])
            }
        ],

        satisfaction: [
            {
                title: "Signal & sentiment analysis",
                description:
                    "Quantify the negative signal and identify where it originates.",
                checks: [
                    "What do reviews / complaints / NPS actually say?",
                    "Is the sentiment growing, stable, or spiking?",
                    "Which themes appear most frequently?",
                    "Is the signal from data, tickets, or assumption?"
                ],
                why:
                    "You need to know what specifically drives the negative sentiment "
                    + "and how strong the signal really is.",
                scenarios: withPath("satisfaction", 1, [
                    {
                        theme: "prevalence",
                        scenario: "The negative signal is broad — many reviews and complaints share one theme, not an anecdote.",
                        meaning: "a real, common pain rather than edge noise.",
                        whyPMCare: "prevalence separates a genuine problem from a vocal minority.",
                        userBehaviour: "many users share the same behaviour pattern tied to the complaint.",
                        businessConsequence: "a wide dissatisfaction base — broad churn risk.",
                        unknown: "the true share of users who feel it.",
                        nextQuestion: "How large a share of all users shares the complaint theme?"
                    },
                    {
                        theme: "trend",
                        scenario: "Sentiment was stable, then spiked recently.",
                        meaning: "something changed — a recent regression or event.",
                        whyPMCare: "a spike has a datable cause and a fast fix path.",
                        userBehaviour: "users who were fine until recently now complain.",
                        businessConsequence: "recent, fast-growing risk — prioritise immediately.",
                        unknown: "what coincided with the spike.",
                        nextQuestion: "What changed shortly before the sentiment spike?"
                    },
                    {
                        theme: "unverified",
                        scenario: "The signal comes from support tickets and reviews, but product data does not yet confirm it.",
                        meaning: "strong anecdote, unverified behaviour — exactly what needs an evidence check.",
                        whyPMCare: "a PM withholds judgment until data confirms the anecdote.",
                        userBehaviour: "complaints exist; the corresponding behaviour has not been measured.",
                        businessConsequence: "the impact is unknown until the behaviour is actually measured.",
                        unknown: "whether the behaviour matches the complaints.",
                        nextQuestion: "Do product data show the behaviour users complain about?"
                    }
                ])
            },
            {
                title: "Root friction identification",
                description:
                    "Find the specific friction or trust break behind the sentiment.",
                checks: [
                    "What is the user's specific pain or trust break?",
                    "Is it reliability, cost, UX, support, or safety related?",
                    "Which users feel it most?",
                    "What would remove or reduce the friction?"
                ],
                why:
                    "Dissatisfaction has a concrete cause. Finding the specific friction "
                    + "is the path to an actual fix, not just sentiment damage control.",
                scenarios: withPath("satisfaction", 2, [
                    {
                        theme: "friction-point",
                        scenario: "The pain maps to one concrete friction — cost, UX, reliability, or support.",
                        meaning: "dissatisfaction has a specific, addressable source.",
                        whyPMCare: "a concrete friction is fixable; sentiment damage is only downstream of it.",
                        userBehaviour: "users avoid the painful path or reduce usage around it.",
                        businessConsequence: "churn risk concentrates in users who hit that friction.",
                        unknown: "how central the friction is to overall dissatisfaction.",
                        nextQuestion: "How much of total dissatisfaction traces to this one friction?"
                    },
                    {
                        theme: "segment",
                        scenario: "One user segment feels the friction far more than others.",
                        meaning: "a segment-specific experience problem.",
                        whyPMCare: "narrow scope means a narrow fix and fast verification.",
                        userBehaviour: "the affected segment behaves measurably worse than others.",
                        businessConsequence: "segment churn may be hidden in aggregate numbers.",
                        unknown: "what makes that segment's experience worse.",
                        nextQuestion: "What is different about that segment's journey?"
                    },
                    {
                        theme: "trust",
                        scenario: "The friction is a trust or safety issue rather than a convenience problem.",
                        meaning: "dissatisfaction is rooted in belief, not ease — it is slower to fix.",
                        whyPMCare: "trust fixes differ completely from UX fixes.",
                        userBehaviour: "hesitation, verification behaviour, and reduced high-stakes usage.",
                        businessConsequence: "the highest-stakes dissatisfaction — it converts to defection.",
                        unknown: "the specific trust break.",
                        nextQuestion: "What specific moment broke trust for users?"
                    }
                ])
            },
            {
                title: "Business impact assessment",
                description:
                    "Connect the sentiment to churn, revenue, or brand consequences.",
                checks: [
                    "Do dissatisfied users actually leave or reduce spend?",
                    "What is the revenue / retention / brand cost?",
                    "Is there a cohort that experiences both sentiment and churn?",
                    "How urgent is the business impact?"
                ],
                why:
                    "Negative sentiment matters to a business only when it converts to "
                    + "behaviour. This path quantifies that conversion.",
                scenarios: withPath("satisfaction", 3, [
                    {
                        theme: "realised-churn",
                        scenario: "Dissatisfied users measurably leave or reduce spend.",
                        meaning: "the sentiment converts into behaviour and real money.",
                        whyPMCare: "converted dissatisfaction is the version worth the strongest response.",
                        userBehaviour: "usage and spend fall among the dissatisfied cohort.",
                        businessConsequence: "measurable revenue loss is tied to the sentiment.",
                        unknown: "the size of the financial effect.",
                        nextQuestion: "How much revenue is tied to the dissatisfied cohort's reduced spend?"
                    },
                    {
                        theme: "no-behaviour",
                        scenario: "Dissatisfaction is loud in sentiment, but behaviour barely changes.",
                        meaning: "complaints without behavioural cost — inconvenient but not fatal.",
                        whyPMCare: "a PM prioritises behaviour over sentiment volume.",
                        userBehaviour: "users complain but keep using the product at a similar level.",
                        businessConsequence: "limited revenue exposure — resolve at a measured pace.",
                        unknown: "whether a stress event would convert the sentiment into behaviour.",
                        nextQuestion: "Would a failure or competitor event turn the sentiment into churn?"
                    },
                    {
                        theme: "cohort-overlap",
                        scenario: "The highest-sentiment cohort overlaps with the highest-churn cohort.",
                        meaning: "sentiment and churn are the same people — a synthetic confirmation.",
                        whyPMCare: "when the overlap exists, fixing sentiment is fixing churn.",
                        userBehaviour: "the most dissatisfied are also the most likely to leave.",
                        businessConsequence: "churn is concentrated and attributable — a sharp remediation target.",
                        unknown: "the direction of causation — and whether a third driver causes both.",
                        nextQuestion: "Is there a single root cause behind both the sentiment and the churn?"
                    }
                ])
            }
        ],

        strategy: [
            {
                title: "Opportunity & target definition",
                description:
                    "Sharpen who the opportunity serves and what it targets.",
                checks: [
                    "Who is the target segment and why them?",
                    "What specific outcome does the strategy aim for?",
                    "What problem does it solve for the user?",
                    "How large is the opportunity?"
                ],
                why:
                    "A strategy without a defined target and outcome is an idea, not a "
                    + "direction. This path anchors the strategy.",
                scenarios: withPath("strategy", 1, [
                    {
                        theme: "target",
                        scenario: "The opportunity only works for one well-defined target segment.",
                        meaning: "a focused strategy with a clear winner — the opposite of 'everyone'.",
                        whyPMCare: "a defined target is what turns a direction into a strategy.",
                        userBehaviour: "that segment has the need and the willingness to act on it.",
                        businessConsequence: "the upside is concentrated but real and defensible.",
                        unknown: "segment size and willingness to pay.",
                        nextQuestion: "How large is the target segment, and can it be reached?"
                    },
                    {
                        theme: "outcome",
                        scenario: "The strategy's success hinges on one specific outcome, such as a daily habit rather than signups.",
                        meaning: "the goal is a behaviour change, not a vanity metric.",
                        whyPMCare: "a single outcome focus clarifies what to measure and defend.",
                        userBehaviour: "success requires a repeatable behaviour, not a one-time action.",
                        businessConsequence: "value accrues only if the behaviour becomes habitual.",
                        unknown: "how achievable the behaviour is for the target.",
                        nextQuestion: "Can the target realistically perform the behaviour repeatedly?"
                    },
                    {
                        theme: "pain",
                        scenario: "The problem the strategy solves is real and urgent for the target.",
                        meaning: "there is actual pain — not a made-up problem.",
                        whyPMCare: "urgent pain is the strongest market signal a strategy can have.",
                        userBehaviour: "the target already finds workarounds — behaviour that signals need.",
                        businessConsequence: "demand exists; the strategy converts latent need into product.",
                        unknown: "whether users will pay or switch for the improvement.",
                        nextQuestion: "What are the target users using today as a workaround?"
                    }
                ])
            },
            {
                title: "Market & competitive scan",
                description:
                    "Understand the competitive and market context for the direction.",
                checks: [
                    "Who are the competitors or alternatives?",
                    "What is changing in the market or user behaviour?",
                    "What is the differentiation vs. alternatives?",
                    "Why does this opportunity exist right now?"
                ],
                why:
                    "Strong strategy is grounded in an understanding of the market and "
                    + "why the timing is right — not just internal ambition.",
                scenarios: withPath("strategy", 2, [
                    {
                        theme: "growing-market",
                        scenario: "The market is growing — the opportunity expands even if share stays flat.",
                        meaning: "a rising tide favours the strategy.",
                        whyPMCare: "in a growth market, the same effort buys a larger payoff.",
                        userBehaviour: "new users enter the market with the problem being solved.",
                        businessConsequence: "revenue can grow with the market before any share is gained.",
                        unknown: "the market's actual growth rate.",
                        nextQuestion: "How fast is the market actually growing?"
                    },
                    {
                        theme: "whitespace",
                        scenario: "Competitors dominate the two ends of the market (commodity and premium), leaving a middle gap.",
                        meaning: "a defensible whitespace exists between competitor positions.",
                        whyPMCare: "positioning in a gap beats head-on competition.",
                        userBehaviour: "users in the middle are underserved and open to switching.",
                        businessConsequence: "a distinct segment can be won without out-spending incumbents.",
                        unknown: "whether the gap is real or was abandoned for a reason.",
                        nextQuestion: "Why haven't incumbents already filled the gap?"
                    },
                    {
                        theme: "behaviour-shift",
                        scenario: "User behaviour in the market is shifting — new usage patterns, platforms, or expectations.",
                        meaning: "the rules are being rewritten — an opening for the strategy.",
                        whyPMCare: "entrants win when behaviour changes faster than incumbents adapt.",
                        userBehaviour: "users adopt patterns the incumbents don't serve.",
                        businessConsequence: "early positioning in a shift can define the category.",
                        unknown: "how durable the behaviour shift is.",
                        nextQuestion: "Is the behaviour shift a fad or a durable trend?"
                    }
                ])
            },
            {
                title: "Feasibility & risk",
                description:
                    "Assess what it would take to pursue and the key risks.",
                checks: [
                    "What capabilities or resources are needed?",
                    "What are the top assumptions that could be wrong?",
                    "What is the fastest way to validate the direction cheaply?",
                    "What would you deprioritize or stop to pursue this?"
                ],
                why:
                    "Every strategy carries assumptions and trade-offs. Naming and "
                    + "testing the riskiest assumption first is what separates execution "
                    + "from wishful thinking.",
                scenarios: withPath("strategy", 3, [
                    {
                        theme: "capability",
                        scenario: "The strategy needs a capability or resource the team does not have.",
                        meaning: "feasibility is the constraint, not the market.",
                        whyPMCare: "a PM names the capability gap before committing — effort is real.",
                        userBehaviour: "the intended behaviour can't be reached without the capability.",
                        businessConsequence: "delivery time and cost dominate the strategy's viability.",
                        unknown: "whether the capability can be built or bought.",
                        nextQuestion: "What would it take to close the capability gap?"
                    },
                    {
                        theme: "assumption",
                        scenario: "The strategy rests on a specific assumption that could be wrong — willingness to pay, behaviour, or reach.",
                        meaning: "one fragile assumption carries the whole direction.",
                        whyPMCare: "naming the riskiest assumption is the fastest route to de-risking.",
                        userBehaviour: "if the assumption fails, the intended behaviour never materialises.",
                        businessConsequence: "the outcome is binary — the strategy lives or dies on the assumption.",
                        unknown: "the current truth of that assumption.",
                        nextQuestion: "What is the cheapest way to test the riskiest assumption?"
                    },
                    {
                        theme: "tradeoff",
                        scenario: "Pursuing the strategy means deprioritising or stopping something else.",
                        meaning: "an opportunity cost that must be faced honestly.",
                        whyPMCare: "a PM who won't name trade-offs is committing to everything — which means nothing.",
                        userBehaviour: "the deprioritised behaviour predictably declines.",
                        businessConsequence: "near-term metrics suffer for longer-term gain — a managed trade.",
                        unknown: "how much near-term cost the business can absorb.",
                        nextQuestion: "What would the business lose, and can it afford that?"
                    }
                ])
            }
        ],

        general: [
            {
                title: "Problem scoping",
                description:
                    "Pin down who is affected, what specifically is wrong, and why it matters.",
                checks: [
                    "Who experiences this and in what context?",
                    "What is the concrete failing outcome?",
                    "How frequently and how severe is it?",
                    "Why does it matter to the user and the business?"
                ],
                why:
                    "Before any framework applies, the problem must be well defined. "
                    + "This path creates that definition.",
                scenarios: withPath("general", 1, [
                    {
                        theme: "who",
                        scenario: "The problem affects a specific, identifiable set of users.",
                        meaning: "the problem is scoped to a segment, which makes it investigable.",
                        whyPMCare: "a scoped problem is findable and fixable; an unbounded one is not yet a problem.",
                        userBehaviour: "only that segment experiences the failing outcome.",
                        businessConsequence: "impact is measurable within the segment.",
                        unknown: "whether the segment is the only one affected.",
                        nextQuestion: "Who, exactly, experiences this, and who doesn't?"
                    },
                    {
                        theme: "severity",
                        scenario: "The problem is frequent and severe when it occurs, not a rare annoyance.",
                        meaning: "it is worth investing in — the cost per event is high.",
                        whyPMCare: "frequency × severity decides whether the problem deserves a team.",
                        userBehaviour: "affected users' routines are meaningfully disrupted.",
                        businessConsequence: "the cost is material enough to fund a real investigation.",
                        unknown: "the precise frequency and severity numbers.",
                        nextQuestion: "How often, and how badly, does this actually happen?"
                    },
                    {
                        theme: "outcome",
                        scenario: "There is a specific failing outcome the user can't achieve.",
                        meaning: "the problem has a concrete definition of failure.",
                        whyPMCare: "a defined failing outcome gives you the metric that proves it's fixed.",
                        userBehaviour: "a target action or state is unreachable for affected users.",
                        businessConsequence: "progress is measurable against the defined outcome.",
                        unknown: "whether the outcome failure causes a real loss.",
                        nextQuestion: "What is the concrete outcome users cannot achieve?"
                    }
                ])
            },
            {
                title: "Evidence gathering",
                description:
                    "Determine what evidence exists and what is still unknown.",
                checks: [
                    "What data or signals support the problem?",
                    "What is currently an assumption vs. a fact?",
                    "What would prove or disprove the problem?",
                    "What is the cheapest way to gather that evidence?"
                ],
                why:
                    "A PM never treats the first explanation as fact. Gathering and "
                    + "sorting evidence separates what we know from what we assume.",
                scenarios: withPath("general", 2, [
                    {
                        theme: "anecdote",
                        scenario: "The problem is currently known through anecdote — tickets, complaints, or a report — not yet data.",
                        meaning: "understandable, but unverified: a complaint is not a confirmed behaviour.",
                        whyPMCare: "a PM separates 'reported' from 'measured' before acting.",
                        userBehaviour: "the complained-about behaviour has not yet been measured.",
                        businessConsequence: "actioning a false-positive problem wastes a full team cycle.",
                        unknown: "whether the behaviour is as widespread as the anecdotes suggest.",
                        nextQuestion: "What data would confirm or refute the reports?"
                    },
                    {
                        theme: "data-gap",
                        scenario: "No metric currently captures the problem, so its size is invisible.",
                        meaning: "you can't manage an unmeasured problem.",
                        whyPMCare: "instrumentation is the first step of any real investigation.",
                        userBehaviour: "the behaviour exists but is not logged or counted.",
                        businessConsequence: "responses remain guesses until a metric exists.",
                        unknown: "the actual size of the problem.",
                        nextQuestion: "What is the cheapest metric that would capture it?"
                    },
                    {
                        theme: "contradiction",
                        scenario: "Some signals say the problem is real; others say the opposite.",
                        meaning: "conflicting evidence — resolution requires better data, not intuition.",
                        whyPMCare: "contradictions are where cognitive bias usually hides.",
                        userBehaviour: "segments or sources contradict each other in the data.",
                        businessConsequence: "the direction of effort depends entirely on which signal is true.",
                        unknown: "which signal reflects reality.",
                        nextQuestion: "Which signal is better measured, and why do they disagree?"
                    }
                ])
            },
            {
                title: "Hypothesis development",
                description:
                    "Form possible explanations for the problem and decide which to test first.",
                checks: [
                    "What are 3-4 distinct possible explanations?",
                    "Which is most likely given current evidence?",
                    "Which is most cost-effective to test first?",
                    "What would each hypothesis predict we should observe?"
                ],
                why:
                    "Strong PMs are hypothesis-driven. Forming multiple possible "
                    + "explanations and picking the best to test is the core reasoning skill.",
                scenarios: withPath("general", 3, [
                    {
                        theme: "multiple",
                        scenario: "Multiple distinct explanations are plausible, not just one.",
                        meaning: "a healthy state — competing hypotheses exist.",
                        whyPMCare: "the skill is generating alternatives before testing any of them.",
                        userBehaviour: "each explanation predicts different observable behaviour.",
                        businessConsequence: "choosing the wrong explanation costs a full iteration.",
                        unknown: "which explanation is most likely.",
                        nextQuestion: "What would each candidate hypothesis predict we should observe?"
                    },
                    {
                        theme: "cheapest-test",
                        scenario: "One explanation stands out as the cheapest to test first, even if not the most likely.",
                        meaning: "learning economics favour the cheap test.",
                        whyPMCare: "fast, cheap tests usually beat precise but slow ones early.",
                        userBehaviour: "a cheap test can distinguish between two plausible stories.",
                        businessConsequence: "early, low-cost evidence shapes direction cheaply.",
                        unknown: "whether the chosen test truly discriminates.",
                        nextQuestion: "What is the smallest experiment that separates the leading explanations?"
                    },
                    {
                        theme: "predictive",
                        scenario: "The leading hypothesis makes a testable prediction about what we should observe.",
                        meaning: "a falsifiable hypothesis — the mark of a strong one.",
                        whyPMCare: "predictability is what lets evidence confirm or kill it.",
                        userBehaviour: "the prediction ties directly to measurable user behaviour.",
                        businessConsequence: "risk is removed by confirming a specific, observable claim.",
                        unknown: "whether the predicted behaviour will actually show up.",
                        nextQuestion: "Does the predicted behaviour reliably appear in real usage?"
                    }
                ])
            }
        ]
    };

    return pathsByType[type] || pathsByType.general;
}