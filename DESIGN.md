# Hisako Digital — Lead Qualification Bot Demo
## Design & Architecture Reference

---

## Product Overview

A public-facing web demo for **Hisako Digital** — a premium digital marketing agency. The demo is a branded chat interface that qualifies inbound leads, handles objections, and books meetings via embedded Calendly. It is sent to US agency owners as a live link to prove the product concept.

---

## Agency Profile (Bot Training Data)

### Agency: Hisako Digital
**Tagline:** Revenue-First Digital Growth for Established B2B and E-Commerce Brands  
**Founded:** 2019  
**HQ:** Remote-first, US-serving  
**Team Size:** 18 specialists  
**Avg. Client ROI:** 3.8x within 6 months  
**Client Range:** $500K–$20M/yr revenue businesses  

### Services & Pricing

#### 1. SEO Growth Retainer
- **What:** Full-spectrum organic search — technical audit, content architecture, link acquisition, ongoing optimization
- **Best for:** B2B SaaS, professional services, e-commerce brands with 3–24 month growth horizons
- **Starting at:** $3,500/month
- **Deliverables:** Monthly ranking reports, content calendar, technical fixes, backlink reports
- **Timeline to results:** 60–90 days for initial movement, 6 months for compounding results

#### 2. Google Search Ads Management
- **What:** Campaign strategy, copy, bidding optimization, conversion tracking, monthly reporting
- **Best for:** Service businesses, lead gen, e-commerce with clear ROAS targets
- **Starting at:** $2,500/month management fee (ad spend separate)
- **Deliverables:** Weekly performance reports, A/B ad tests, landing page recommendations
- **Timeline to results:** 2–4 weeks for first data, 60 days for optimization

#### 3. Custom Web Design & Development
- **What:** Strategy-first website redesigns and new builds — focused on conversion, not just aesthetics
- **Best for:** Businesses losing leads due to poor web presence or low conversion rates
- **Starting at:** $8,500 one-time (ongoing maintenance available)
- **Deliverables:** Full design system, CMS setup, analytics integration, 90-day support
- **Timeline:** 6–10 weeks

#### 4. Full-Funnel Growth Package (Flagship)
- **What:** SEO + Paid Ads + CRO working together under one integrated strategy
- **Best for:** Scaling businesses ready to dominate their category
- **Starting at:** $6,500/month
- **Deliverables:** Dedicated strategist, bi-weekly calls, unified dashboard, full reporting suite

### Case Studies (for bot reference)
- **B2B SaaS client:** 214% increase in organic leads in 8 months via SEO retainer
- **E-commerce brand:** 4.2x ROAS on Google Ads within 90 days, scaling from $8K to $45K/month ad spend
- **Professional services firm:** New website increased consultation bookings by 180% in 60 days
- **Agency client (competitor):** Full-funnel package generated $1.2M in new pipeline in 6 months

### Differentiators
- Revenue-tied KPIs — every engagement tracked to pipeline and closed deals, not just traffic
- No cookie-cutter campaigns — custom strategy per client
- Senior-only execution — no junior account managers on active accounts
- Quarterly strategy reviews with C-suite access
- Proprietary conversion attribution model

---

## Qualification Logic

### The 4 Checkpoints (in order)

1. **Service Intent** — What are they looking for? SEO / Paid Ads / Web Design / Full Growth / Not Sure
2. **Current Situation** — How are they getting customers now? Where is the friction?
3. **Monthly Budget** — The gatekeeper:
   - **< $2,500/month** → Politely close. No booking link. Recommend free resources.
   - **≥ $2,500/month** → Mark qualified. Proceed to close.
4. **Timeline** — When are they looking to start? (Urgency signal)

### Closing Trigger
Once service + budget ≥ $2,500 is confirmed → embed Calendly widget and invite to book a Pipeline Audit call.

### Calendly URL
`https://calendly.com/hisakolimited/new-meeting`

---

## Conversation Flows

### Flow A — Qualified Lead
1. Greeting → establish service need
2. Explore current situation briefly
3. Budget question (natural, not blunt)
4. Confirm budget ≥ $2,500
5. Confirm timeline
6. Close: "You're a great fit. Let's book your Pipeline Audit →" + embedded Calendly

### Flow B — Disqualified (Budget < $2,500)
1. Same steps 1–3
2. Budget confirmed under $2,500
3. Polite close: acknowledge their stage, offer free resources, wish them well
4. Do NOT offer to book a meeting

### Flow C — Objection Handling
- **"Too expensive"** → Reframe around ROI and acquisition cost
- **"We tried ads before and it didn't work"** → Ask what happened; reframe around strategy quality
- **"We're not ready yet"** → Probe timeline; offer to stay in touch
- **"We do this in-house"** → Respect it; probe pain points; offer audit value
- **"I need to think about it / talk to my partner"** → Acknowledge; offer to book a no-pressure audit

### Off-topic redirect
If the user asks something unrelated (general marketing tips, competitor comparisons, etc.) — answer briefly (1–2 sentences), then smoothly redirect back to qualification.

---

## UI/UX Design System

### Aesthetic Direction
**Swiss International Style** meets **dark premium agency** — clean grid, sharp typography, deliberate negative space, editorial feel. Think: Zurich design school applied to a New York performance marketing agency.

### Color Palette
```
--bg-primary: #0A0A0A        /* Near-black canvas */
--bg-secondary: #111111       /* Card/panel backgrounds */
--bg-tertiary: #1A1A1A        /* Input fields, hover states */
--accent: #E8FF00             /* Electric yellow-green — the ONE bold color */
--accent-dim: #B8CC00         /* Muted accent for hover */
--text-primary: #F5F5F0       /* Off-white body */
--text-secondary: #888880     /* Muted labels, timestamps */
--text-tertiary: #444440      /* Placeholder text */
--border: #222222             /* Subtle borders */
--border-active: #333333      /* Active/focused borders */
--user-bubble: #1E1E1E        /* User message background */
--bot-bubble: #141414         /* Bot message background */
--qualified-green: #00E599    /* Qualification success state */
--disqualified: #FF4444       /* Soft disqualification indicator */
```

### Typography
- **Display/Logo:** `Bebas Neue` — condensed, authoritative
- **Headings:** `DM Sans` weight 500 — clean, modern
- **Body/Chat:** `DM Sans` weight 400
- **Monospace accents:** `JetBrains Mono` — for status indicators, timestamps, budget numbers

### Layout
- Full-viewport dark canvas
- Left panel (30%): Agency branding, quick-test buttons, status indicator
- Right panel (70%): Chat interface with message bubbles
- Calendly embeds inline in the chat when triggered
- Mobile: stacked, chat-first

### Chat UI Specifics
- Bot messages: left-aligned, subtle left border accent in `--accent` color
- User messages: right-aligned, `--user-bubble` background
- Typing indicator: three dots, 800ms animation
- Timestamps: `JetBrains Mono`, muted
- Message entrance: fade + slide up, 200ms

### Quick-Test Buttons (left panel)
Three clickable prompts:
1. "Run a qualification sequence" → injects "I run a B2B SaaS company and need more leads"
2. "Test an objection" → injects "Your pricing seems expensive compared to other agencies"
3. "See the booking flow" → injects "I'm ready to invest $5,000/month and want to start next month"

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 App Router
- **Styling:** Tailwind CSS + CSS custom properties
- **Fonts:** Google Fonts (Bebas Neue, DM Sans, JetBrains Mono)
- **Calendar:** Calendly inline embed widget

### AI
- **Provider:** Gemini API
- **Architecture:** Streaming responses via `/api/chat` route
- **System prompt:** Full agency profile + qualification logic injected server-side
- **Max tokens:** 300 (keep responses tight and conversational)

### Hosting
- **Platform:** Vercel
- **Env vars:** `GEMINI_API_KEY `

---

## File Structure

```
hisako-digital-demo/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← Main demo page
│   ├── globals.css
│   └── api/
│       └── chat/
│           └── route.ts      ← Anthropic streaming endpoint
├── components/
│   ├── ChatInterface.tsx     ← Full chat UI
│   ├── MessageBubble.tsx     ← Individual message component
│   ├── TypingIndicator.tsx   ← Animated dots
│   ├── CalendlyEmbed.tsx     ← Inline Calendly widget
│   ├── SidePanel.tsx         ← Branding + quick-test buttons
│   └── QualificationBadge.tsx ← Status indicator
├── lib/
│   └── systemPrompt.ts       ← Full bot persona + logic
├── public/
│   └── ...
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local                ← GEMINI_API_KEY 
```

---

## Prompt Architecture

The system prompt is injected in `lib/systemPrompt.ts` and passed to every `/api/chat` request. It contains:

1. **Persona block** — Who the AI is, tone, constraints
2. **Agency knowledge block** — Full services, pricing, case studies
3. **Qualification logic block** — The 4 checkpoints, budget gate rules
4. **Objection handling block** — Specific counter-scripts
5. **Closing block** — When and how to trigger the Calendly
6. **Format rules block** — Response length, markdown rules, tone calibration

Each section is clearly labeled with comments so it can be tuned independently.