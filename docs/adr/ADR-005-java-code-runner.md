# ADR-005 — Java Code Execution: Local javac vs External API

**Date:** 2026-08-12
**Status:** Accepted

## Context

The Java Lab needs to execute user-written Java code and return stdout/stderr output. Options considered:

| Option | How it works | Pros | Cons |
|--------|-------------|------|------|
| **Local `javac` + `java`** | Next.js API route shells out to local JDK via `child_process.exec` | Zero cost, fast, offline, deterministic | Requires JDK 17+ installed locally |
| **Piston API** | Free public REST API that runs code in isolated containers | No local setup | Network latency, rate limits, privacy concern |
| **Judge0 (self-hosted)** | Docker-based code execution engine | Full control, sandboxed | Heavy setup, Docker dependency |
| **Judge0 (cloud)** | Hosted Judge0 via RapidAPI | No local setup | Paid tiers, latency, internet required |

## Decision

Use **local `javac` + `java`** via Node.js `child_process` in a Next.js API route.

Execution flow:
```
POST /api/java/run
  body: { code: string, stdin?: string }

1. Write code to /tmp/JavaLabRunner_<uuid>.java
2. shell: javac /tmp/JavaLabRunner_<uuid>.java -d /tmp/
3. shell: java -cp /tmp/ -Xmx64m -Xss512k JavaLabRunner_<uuid>
4. Capture stdout + stderr, enforce 5s timeout
5. Delete temp files
6. Return { stdout, stderr, exitCode, durationMs }
```

## Consequences

- **Good:** Instant feedback, works offline, no API keys, no cost
- **Good:** Full Java standard library available — can demonstrate Collections, Streams, Concurrency
- **Trade-off:** Requires JDK 17+ on the development machine (acceptable for personal use)
- **Safety:** Timeout + memory cap (`-Xmx64m`) prevents runaway processes. Single-user personal tool, so sandboxing is not a security concern.
- **Limitation:** Cannot run multi-file projects — each lesson provides a self-contained single-class snippet

## Public class name convention

All lesson snippets must declare a public class named `JavaLabRunner` so the runner does not need to parse the class name. Lessons that need custom names use a non-public outer class or nested classes.

```java
// Standard snippet shape
public class JavaLabRunner {
    public static void main(String[] args) {
        // lesson code here
    }
}
```
