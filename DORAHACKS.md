# PROTEUS — The Shape-Shifting AI Agent

> *Fully autonomous. Multi-skill. Earns crypto while you sleep.*

---

## The Problem

Freelance platforms like Fiverr depend entirely on humans — slow, expensive, and limited to working hours. Existing AI agents are single-purpose bots: they handle one job type and fail everything else. There's no agent today that can walk into a marketplace, pick up any job, complete it with production quality, and get paid — automatically.

---

## The Solution

**PROTEUS** is a fully autonomous, multi-skill AI agent built for the **Seedstr freelance marketplace**. It polls for new jobs every 15 seconds, classifies them intelligently, completes them using GPT-4o, and submits results — all without human intervention.

No human touches the keyboard. The agent handles everything end-to-end.

---

## How It Works

| Step | What Happens |
|------|--------------|
| 👁️ **Detect** | Polls Seedstr API every 15 seconds for new jobs |
| 🧠 **Classify** | Routes job to the right module — frontend, content, code review, or research |
| ⚙️ **Complete** | GPT-4o generates output using a 2-pass generate → self-review pipeline |
| 📦 **Package** | Zips output files for code projects |
| 📤 **Submit** | Uploads and responds via Seedstr API v2 |
| 💰 **Earn** | Crypto lands in the owner's Solana wallet automatically |

---

## Key Differentiator — 2-Pass GPT-4o Pipeline

While competitors use single-shot generation with weaker models, PROTEUS uses a **self-reviewing pipeline**:

- **Pass 1 — Generate**: GPT-4o creates a complete output using a hardcoded design system (Tailwind CSS, Inter + Space Grotesk fonts, dark/light mode, animations)
- **Pass 2 — Self-Review**: GPT-4o reviews its own output against a checklist — requirements met? JS errors? Mobile responsive? Interactive features working?

Result: consistently polished output vs. competitors' one-shot generation.

---

## Capabilities

- 🖥️ **Frontend Builder** — Responsive HTML/CSS/JS websites with embedded design system
- ✍️ **Content Writer** — Blog posts, SEO copy, articles, marketing content
- 🔍 **Code Reviewer** — Audit code with severity ratings and fix recommendations
- 📊 **Researcher** — Data analysis reports, market research, structured insights
- 🚫 **Graceful Decline** — Politely rejects jobs outside its skill set

---

## Architecture

```
Seedstr API → Watcher (polls every 15s)
                 ↓
              Router (keyword + GPT-4o classifier)
                 ↓
    ┌────────────┬────────────┬─────────────┐
    │ Frontend   │  Content   │ Code Review │  Research
    │ Builder    │  Writer    │             │
    └────────────┴────────────┴─────────────┘
                 ↓
              Zipper → Submitter → Seedstr API
                              ↓
                          SQLite DB (Prisma)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5 + Node.js 20 |
| LLM | OpenAI GPT-4o |
| Database | SQLite via Prisma ORM |
| API | Seedstr API v2 |
| Compression | archiver (zip level 9) |
| Frontend Output | HTML5, Tailwind CSS CDN, Vanilla JS |
| Blockchain | Solana (wallet-based earnings) |
| Runtime | tsx (no build step needed) |

---

## Why PROTEUS Stands Out

| Criterion | Competitors | PROTEUS |
|-----------|-------------|---------|
| LLM | Llama 3.3 70B | GPT-4o (state of the art) |
| Generation | Single-shot | 2-pass with self-review |
| Job Types | 1 | 4 (Frontend, Content, Code Review, Research) |
| Design Quality | Random LLM output | Hardcoded design system |
| Skills Registered | ~3 | 15 (maximum allowed) |
| DB Persistence | None | Full SQLite history |
| API Version | v1 | v2 verified endpoints |
| Post-hackathon Value | Zero | Keeps earning on Seedstr |

---

## Vision

The future of work is not humans on Fiverr. It's AI agents on platforms like Seedstr — bots that work 24/7, never sleep, and earn crypto for their owners.

PROTEUS demonstrates that vision today. One command, and it runs forever — detecting jobs, completing them, collecting payment. The owner just watches the wallet grow.

**This is not a demo. This is the future of work.**

---

*Built for the Seedstr $10K Blind Hackathon — designed to keep earning long after.*
