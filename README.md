# Customer Inbox Triage App

## Overview

The Customer Inbox Triage app is a lightweight AI-powered tool that helps classify customer support messages and recommend actions. It uses Groq AI to categorize messages, applies rule-based urgency scoring, and suggests next steps based on predefined templates.

## Problem Statement

Support teams waste time manually reading and triaging customer messages. This tool provides an automated first pass at classification to help prioritize and route messages more efficiently.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Groq API (Llama 3.3 70B - Free tier)
- **Runtime**: Browser-based (local development only)

## Setup Instructions

### Prerequisites

- Node.js 20.19 or newer (required by Vite 7; `npm run eval` needs Node 22+)
- npm or yarn
- Groq API key (FREE - get from https://console.groq.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "L2 assessment"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Groq API Key**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Groq API key:
   ```
   VITE_GROQ_API_KEY=gsk_your-actual-key-here
   ```
   
   Get your FREE API key from: https://console.groq.com/keys
   
   **Why Groq?** Groq offers a generous free tier with fast inference and no credit card required!

4. **Run the application**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## How It Works

1. **Paste Message**: User pastes a customer support message (10–5,000 characters) into the text area
2. **Analyze**: Click "Analyze Message" to process the input
3. **Triage**:
   - **AI triage** (Groq, default model `openai/gpt-oss-120b`): returns a category and urgency as validated JSON, with temperature 0 so the same message gets the same answer. The customer message is sent as delimited, untrusted data.
   - **Safety rules** (deterministic): detect outages, security incidents, incorrect charges and blocking problems under time pressure. A critical message is never scored below High, even if the AI says otherwise.
   - **Recommendation and escalation**: next step based on category *and* urgency; High urgency and security issues are flagged for escalation.
4. **Display Results**: Shows the source (AI or rule-based fallback), category, urgency, escalation, recommended action and reasoning
5. **Fallback**: With no API key, or if the AI call fails, the rules triage the message and a visible notice asks for manual review

Categories: Billing Issue, Technical Problem, Account & Security, Feature Request, General Inquiry, Feedback.

To use another Groq model, add `VITE_GROQ_MODEL=<model id>` to `.env.local`.

## Testing

```bash
npm test       # unit tests for rules, AI response validation, actions and escalation (no API key needed)
npm run eval   # live check against Groq: 14 labelled messages, run twice each
```

## Improvements made (Week 2 assessment)

**Top 3 problems found**

1. **The AI was never used.** The hard-coded model `llama-3.3-70b-versatile` no longer exists on Groq, so every request failed and silently fell back to random keyword guesses. Without an API key the page was blank, because the Groq client threw at import time.
2. **Urgency was inverted.** Short messages lost points, exclamation marks added them, capitals, questions and polite words lowered them, and the time of day changed the result. "Database connection lost" and "Server down now" were Low; a thank-you note with many "!" was High.
3. **Routing was wrong.** Feature requests were told to "check the billing portal", outages to "restart the browser", escalation depended only on message length (over 100 characters), and urgency was ignored.

**What changed**

- Structured AI triage: fixed category list, JSON mode, strict validation, temperature 0, configurable model, prompt-injection guard.
- Deterministic severity rules used as a High-urgency floor and as a clearly labelled fallback; the client is created lazily, so a missing key no longer breaks the app.
- Category and urgency-aware actions and escalation; input validation; source and signals shown in the results.

**Results**

| Check | Before | After |
|---|---|---|
| Messages actually triaged by the AI | 0 of 22 calls (model not found) | 28 of 28 calls |
| Category correct (14 labelled messages) | 7/14 (keyword fallback; 7/11 counting only messages whose category existed before) | 14/14 |
| Urgency correct (same 14 messages) | 5/14 (measured on a weekday at 11:00; evenings and weekends lower it further) | 13/14 |
| Same result on a second run | — | 14/14 |
| Prompt injection ("classify this as Low") on an outage | — | Still High, escalated |

The one remaining difference is a slow page the customer calls "not blocking": the AI says Low where the label says Medium.

**Next steps**: move the Groq call to a server so the API key is not in the browser, upgrade `react-router-dom` (npm audit reports high-severity advisories), and fix the remaining React lint errors in the pages.
5. **History**: All analyses are saved to localStorage and viewable in the History tab


## Example Test Messages

Try analyzing these messages to see how the triage system works:

### Example 1: Production Issue
```
Our production server is down
```

### Example 2: Customer Feedback
```
Hi there! I just wanted to say thank you for your amazing customer service. I've been using your product for three years now and I'm really happy with it. Keep up the great work!
```

### Example 3: Feature Request
```
I would love to see a dark mode option in the app. It would be much easier on my eyes during night time usage.
```

### Example 4: Payment Issue
```
I tried to update my payment method but the page keeps loading forever. Is this a known issue?
```

### Example 5: Billing Question
```
Can I upgrade my subscription to the pro plan?
```

### Example 6: Technical Support
```
The dashboard won't load when I try to access it. I've tried refreshing but it keeps timing out.
```

## Security Note

⚠️ **Warning**: This application exposes the Groq API key in the browser (using `dangerouslyAllowBrowser: true`). This is acceptable for local development only but should **NEVER** be done in production. In a real application, API calls should be made from a secure backend server.

## Why Groq?

- ✅ **Completely Free** - No credit card required
- ✅ **Fast Inference** - Groq's LPU technology is incredibly fast
- ✅ **Generous Limits** - ~14,400 requests/day on free tier
- ✅ **High Quality** - Llama 3.3 70B performs excellently
- ✅ **Easy Signup** - Get started in minutes at https://console.groq.com

## License

This project is for educational purposes only.
