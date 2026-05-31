# ADR-004 — Vercel AI SDK with Claude Sonnet 4.6

**Date:** 2026-05-31
**Status:** Accepted

## Context

The AI Coach feature needs to call an LLM and receive structured output (weekly learning plan, weakness analysis). Options:
- Raw Anthropic SDK — requires manual JSON parsing and validation
- Raw OpenAI SDK — same problem; also ties us to OpenAI
- Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) — provider-agnostic, built-in `generateObject` with Zod schema validation

## Decision

Use **Vercel AI SDK** with **`@ai-sdk/anthropic`** as the primary provider (Claude Sonnet 4.6). `generateObject()` paired with a Zod schema gives typed, validated structured output without manual JSON parsing. `@ai-sdk/openai` registered as a fallback model.

The AI client is a singleton in `lib/ai/index.ts`. The API key (`ANTHROPIC_API_KEY`) is server-side only — never exposed to the browser.

## Consequences

- **Good:** `generateObject` + Zod eliminates all JSON parsing and validation boilerplate.
- **Good:** Provider-agnostic — swapping Claude for GPT-4o requires changing one line.
- **Good:** Consistent with `communication-ai-assistant` and `career-growth-copilot` patterns.
- **Trade-off:** Adds Vercel AI SDK as a dependency (but it's lightweight and widely used).
- **Risk:** Claude API costs — mitigated by `claude-sonnet-4-6` (cheaper than Opus).
