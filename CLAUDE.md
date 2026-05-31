# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlgoCoach AI is a full-stack personal learning platform for algorithm interview preparation. It uses a Next.js frontend, Spring Boot backend, PostgreSQL database (Neon), and OpenAI for AI features.

## Architecture

```
Next.js (Vercel) → Spring Boot REST API (Render/Fly.io) → PostgreSQL (Neon)
                                                         → OpenAI API
```

### Frontend (`/frontend`)
- **Next.js** with TypeScript and Tailwind CSS
- **shadcn/ui** component library
- Structure: `app/` (routes), `components/`, `features/` (domain logic), `services/` (API calls), `types/`

### Backend (`/backend`)
- **Spring Boot** with Java
- Structure: `controller/`, `service/`, `repository/`, `domain/`, `dto/`, `config/`
- REST API consumed by the frontend

### Other directories
- `docs/` — architecture notes, roadmap, API docs
- `database/` — schema and seed files

## Domain Model

- **User**: id, name, email, createdAt
- **Topic**: id, name, category, description, order (Arrays, Strings, HashMap, Sliding Window, Stack, Queue, Linked List, Tree, Graph, Heap, Binary Search, Backtracking, Dynamic Programming)
- **Question**: id, title, difficulty (Easy/Medium/Hard), topic, link, notes, status (Not Started/Learning/Solved/Review Needed/Mastered)
- **Progress**: topic, solvedCount, confidenceLevel, lastReviewed, completionPercentage

## Key AI Integration

- Primary AI endpoint: `POST /api/ai/recommendations` — calls OpenAI to analyze progress and suggest next topics/learning plans
- OpenAI API is used for: learning plan generation, weakness detection, personalized recommendations

## Development Commands

These commands will apply once the project is scaffolded. Update this section as the project is built out.

### Frontend
```bash
cd frontend
npm install
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run lint       # lint
```

### Backend
```bash
cd backend
./mvnw spring-boot:run    # start dev server
./mvnw test               # run all tests
./mvnw test -Dtest=ClassName#methodName   # run single test
./mvnw package            # build JAR
```

## MVP Pages
- `/` — Dashboard with stats, streak, AI recommendations
- `/topics` — Learning roadmap with topic progress
- `/questions` — Curated question library with status tracking
- `/ai-coach` — AI-generated learning suggestions
- `/profile` — Learning summary and progress overview
