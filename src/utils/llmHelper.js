import Groq from 'groq-sdk'
import { DEFAULT_MODEL, triageWithAI } from './triageAI.js'
import { classifyByRules, combineUrgency, scoreUrgency } from './triageRules.js'

/**
 * Triage a customer message with the AI, protected by deterministic rules.
 * Falls back to the rules (and says so) when the AI is unavailable.
 */

const apiKey = import.meta.env.VITE_GROQ_API_KEY
const model = import.meta.env.VITE_GROQ_MODEL || DEFAULT_MODEL
let client = null

// Created on first use: a missing key must not crash the whole app at import time.
function getClient() {
  if (!apiKey || apiKey === 'your_groq_api_key_here') return null
  client ??= new Groq({
    apiKey,
    dangerouslyAllowBrowser: true, // Local development only; production calls belong on a server.
  })
  return client
}

/**
 * @param {string} message
 * @returns {Promise<{category: string, urgency: string, reasoning: string, source: 'ai'|'rules',
 *   model: string|null, notice: string|null, urgencyReasons: string[]}>}
 */
export async function triageMessage(message) {
  const rules = scoreUrgency(message)
  const groq = getClient()

  if (groq) {
    try {
      const ai = await triageWithAI(groq, model, message)
      const urgency = combineUrgency(ai.urgency, rules.level)
      return {
        category: ai.category,
        urgency,
        reasoning: ai.reasoning,
        source: 'ai',
        model,
        notice: urgency !== ai.urgency ? `Urgency raised from ${ai.urgency} by safety rules: ${rules.reasons.join(', ')}.` : null,
        urgencyReasons: rules.reasons,
      }
    } catch (error) {
      console.warn('AI triage failed, using rules:', error.message)
      return rulesResult(message, rules, `AI unavailable (${describeError(error)}). Showing rule-based triage; review manually.`)
    }
  }

  return rulesResult(message, rules, 'No Groq API key configured. Showing rule-based triage; review manually.')
}

// Groq API errors carry a JSON body; show its message rather than the raw payload.
function describeError(error) {
  const detail = error?.error?.error?.message || error?.error?.message || error?.message || 'unknown error'
  return String(detail).slice(0, 160)
}

function rulesResult(message, rules, notice) {
  return {
    category: classifyByRules(message),
    urgency: rules.level,
    reasoning: `Rule-based triage: ${rules.reasons.join(', ')}.`,
    source: 'rules',
    model: null,
    notice,
    urgencyReasons: rules.reasons,
  }
}
