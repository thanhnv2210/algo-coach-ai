import { anthropic } from "@ai-sdk/anthropic"

export const defaultModel = anthropic(process.env.AI_MODEL ?? "claude-sonnet-4-6")
