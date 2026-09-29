/**
 * Deterministic triage rules.
 *
 * Used as a safety floor on top of the AI result (critical messages are never
 * scored below High) and as a full fallback when the AI is unavailable.
 * No clock, punctuation or message-length heuristics: the same message always
 * gets the same result.
 */

export const CATEGORIES = [
  'Billing Issue',
  'Technical Problem',
  'Account & Security',
  'Feature Request',
  'General Inquiry',
  'Feedback',
]

export const URGENCY_LEVELS = ['Low', 'Medium', 'High']

const SIGNAL_PATTERNS = {
  security: /\b(hack(ed|er)?|breach(ed)?|unauthori[sz]ed|phishing|fraud(ulent)?|compromised|data leak|someone (else )?(logged|signed|got) (in|into)|changed my password|suspicious (log ?in|sign ?in|activity))\b/,
  outage: /\b(down|outage|offline|crash(ed|es|ing)?|connection (lost|failed|dropped)|unavailable|data loss|lost (all )?(our |my )?data)\b/,
  degraded: /\b(not (loading|working)|won'?t (load|work|open)|doesn'?t (load|work)|timing out|times out|keeps? loading|broken|error|bug|fail(ed|s|ing|ure)?|slow|stuck|missing|never (arrives|arrived|came))\b/,
  money: /\b(charged twice|double[- ]?charged|billed twice|duplicate (charge|payment)|overcharged|wrong amount|chargeback|unauthori[sz]ed charge)\b/,
  billing: /\b(bill(ing|ed)?|invoice|payment|charge[ds]?|refund|subscription|plan|pricing|price|credit card|receipt|upgrade|downgrade)\b/,
  access: /\b((can'?t|cannot|unable to|could not|couldn'?t) (log ?in|sign ?in|access|get in)|locked out|password reset|2fa|two[- ]factor)\b/,
  scope: /\b(production|prod|all (of )?(our |my )?(users|customers|clients)|whole (team|company)|entire (team|company)|everyone|nobody can|team (can'?t|cannot)|losing (money|sales|customers))\b/,
  timePressure: /\b(urgent(ly)?|asap|immediately|right now|emergency|critical|deadline|in \d+ ?(min(ute)?s?|hours?|hrs?))\b/,
  churn: /\b(cancel(l?ing|l?ed)?|close my account|delete my account|switch(ing)? to|competitor|leaving)\b/,
  feature: /\b(feature|would (love|like) to see|could you add|please add|can you add|would be (great|nice|useful|helpful)|suggestion|integration|dark mode|roadmap)\b/,
  positive: /\b(thank(s| you)?|appreciate|love|great|awesome|amazing|excellent|wonderful|helpful)\b/,
  question: /\?|^(how|what|when|where|why|can i|is there|do you|does)\b/,
}

/** Which signals appear in the message (lower-cased, word-boundary matching). */
export function detectSignals(message) {
  const text = String(message).toLowerCase()
  return Object.keys(SIGNAL_PATTERNS).filter(name => SIGNAL_PATTERNS[name].test(text))
}

/**
 * Rule-based urgency with the reasons that produced it.
 * High: security, money taken wrongly, outages, or a problem under time pressure / wide impact.
 * Low: praise, feature ideas and plain questions with no problem signal.
 */
export function scoreUrgency(message) {
  const s = new Set(detectSignals(message))
  const problem = s.has('outage') || s.has('degraded') || s.has('access') || s.has('money')
  const reasons = []

  if (s.has('security')) reasons.push('possible account compromise')
  if (s.has('money')) reasons.push('customer charged incorrectly')
  if (s.has('outage')) reasons.push('service outage reported')
  if (problem && s.has('scope')) reasons.push('wide business impact')
  if (problem && s.has('timePressure')) reasons.push('problem under time pressure')
  if (reasons.length) return { level: 'High', reasons }

  if (problem) return { level: 'Medium', reasons: ['customer is blocked or seeing errors'] }
  if (s.has('churn')) return { level: 'Medium', reasons: ['cancellation or churn risk'] }
  if (s.has('billing')) return { level: 'Medium', reasons: ['billing question'] }
  if (s.has('timePressure')) return { level: 'Medium', reasons: ['customer asked for a fast answer'] }

  return { level: 'Low', reasons: ['no problem or time pressure detected'] }
}

/** Rule-based category, used only when the AI is unavailable. */
export function classifyByRules(message) {
  const s = new Set(detectSignals(message))
  const problem = s.has('outage') || s.has('degraded')
  if (s.has('security') || (s.has('access') && !s.has('billing'))) return 'Account & Security'
  if (s.has('money') || s.has('billing') || s.has('churn')) return 'Billing Issue'
  if (problem) return 'Technical Problem'
  if (s.has('feature')) return 'Feature Request'
  if (s.has('positive') && !s.has('question')) return 'Feedback'
  return 'General Inquiry'
}

/** Never let the AI score a message below the rules' High floor. */
export function combineUrgency(aiUrgency, rulesUrgency) {
  if (rulesUrgency === 'High') return 'High'
  return URGENCY_LEVELS.includes(aiUrgency) ? aiUrgency : rulesUrgency
}
