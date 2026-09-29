/**
 * Urgency Scorer - deterministic, severity-based urgency (see triageRules.js).
 */
import { scoreUrgency } from './triageRules.js'

export function calculateUrgency(message) {
  return scoreUrgency(message).level
}
