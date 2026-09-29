/**
 * Recommendation Templates - maps category and urgency to a next step for the agent.
 */

const actionTemplates = {
  'Billing Issue': {
    High: 'Escalate to the billing team now: verify the charges and refund any duplicate within 24 hours.',
    default: 'Route to the billing team: confirm the account and reply with the invoice or billing-portal details.',
  },
  'Technical Problem': {
    High: 'Page the on-call engineer and open an incident; acknowledge the customer within 15 minutes.',
    Medium: 'Open a technical support ticket; ask for steps to reproduce, screenshots and browser/device.',
    default: 'Reply with the relevant troubleshooting guide and offer follow-up if it persists.',
  },
  'Account & Security': {
    High: 'Escalate to the security team immediately: lock the account, force a password reset and review recent sign-ins.',
    default: 'Verify the customer\'s identity, then help them regain access (password reset or 2FA recovery).',
  },
  'Feature Request': {
    default: 'Thank the customer and log the idea on the product feedback board; no SLA required.',
  },
  'General Inquiry': {
    High: 'Answer promptly from the knowledge base; the customer needs a fast reply.',
    default: 'Answer from the knowledge base or FAQ and route to the general support queue.',
  },
  'Feedback': {
    default: 'Thank the customer and share the feedback with the team; no further action needed.',
  },
}

/**
 * Get recommended action for a given category and urgency
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @returns {string} - Recommended next step
 */
export function getRecommendedAction(category, urgency) {
  const templates = actionTemplates[category]
  if (!templates) return 'Review manually.'
  return templates[urgency] || templates.default
}

/**
 * Get all available categories
 *
 * @returns {string[]} - List of categories
 */
export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

/**
 * Determines if message should be escalated to a human lead
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @returns {boolean} - Whether to escalate
 */
export function shouldEscalate(category, urgency) {
  return urgency === 'High' || (category === 'Account & Security' && urgency !== 'Low')
}
