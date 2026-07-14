---
theme: seriph
background: /assets/images/cover.avif
title: Ritus v2 - What Changed Since v1
info: |
  Internal demo of Ritus v2: the delta from v1.
  Skill-based architecture, subagent dispatch, TODO-driven control flow.
  Audience: the team that already uses v1.
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
duration: 45min
favicon: /favicon.svg
---

# Workflow v2

## What Changed Since v1

Skill-based architecture, independent verification, and a workflow that runs itself - on rails.

<div class="pt-10 opacity-80">
Dinh Pham July 2026
</div>

<!--
This is a delta talk for a team that already knows v1. Lead with what's new, not the basics.
-->

---
layout: image-right
image: /assets/images/why.avif
---

# You Already Know v1

Last time we demoed two Copilot skills - `ticket-review` and `pr-review` - backed by a set of Claude instructions.

That was v1. It worked, and the team adopted it.

Today is not a re-run. Today is **what changed in v2, and why**.

<a href="https://github.com/precise-alloy/ritus" target="_blank">Repository: Ritus</a>

<div class="pt-6 opacity-80">
Kudos to anh Truong and anh Tuyen for their solid foundation.
</div>

<!--
Set expectations: this is a delta talk, not a tutorial. The audience knows the basics.
-->

---
layout: center
class: text-center
---

# What You Saw in v1

```mermaid {scale: 0.65}
flowchart LR
  A[Jira ticket] --> B[ticket-review]
  B --> C[Review doc]
  B --> D[Task files]
  B --> E[QA files]
  D --> F[Implementation]
  E --> F
  F --> G[PR or local diff]
  G --> H[pr-review]
  H --> I[Findings]
  H --> J[AC checklist]
  H --> K[Verdict]
```

Two skills, one handoff. Powerful - but everything around them was still manual. v2 governs the whole chain.

<!--
This slide sets the whole mental model before going into details.
-->

---
layout: section
---

# From v1 to v2

## Same discipline, new engine.


---
layout: two-cols-header
---

# Why Rewrite v1 → v2

::left::

## v1 served us well

- role detection: architect vs executor
- one big `.ai/AGENTS.md` source of truth
- triage, task files, DONE WHEN gates
- standards and doc discipline

::right::

## But it strained

- the monolith loaded every turn - token heavy
- two contexts drift: `AGENTS.md` and `exec-context.md`
- the writer also graded its own work
- Copilot got 2 skills; Claude got the rest

<!--
v1 proved the workflow. v2 fixes how it runs.
-->

---
layout: two-cols-header
---

# What v2 Really Changes

::left::

### One source, every host
Same skills run on Claude Code and Copilot.

### On-demand, not always-on
Skills load only when agents need them. Lean context.

### Independent verification
The agent that writes code is not the one that grades it.

::right::

### TODO-driven control
A single rail the agent can't skip or fall off.

### Portable subagents
Main thread is the only dispatcher - identical everywhere.

<!--
These five points are the whole pitch. Everything after is detail.
-->

---
layout: two-cols-header
---

# Architecture Shift

::left::

## v1 - role-based monolith

```mermaid {scale: 0.5}
flowchart TD
  M[Message] --> R{Role?}
  R -->|Architect| A["Load full\n.ai/AGENTS.md"]
  R -->|Executor| E["Load\nexec-context.md"]
  A --> W[Do work]
  E --> W
```

One brain, loaded whole, every turn.

::right::

## v2 - on-demand skills

```mermaid {scale: 0.5}
flowchart TD
  M[Message] --> S["start-ritus\nscans frontmatter"]
  S --> P{Relevant skill?}
  P --> B[brainstorm]
  P --> T[triage]
  P --> TR[ticket-review]
  P --> D[debug]
```

Many small skills, summoned only when relevant.

<!--
The shift: from "which role am I" to "which capability does this need".
-->

---

# The v2 Formula

```text
AI Agent Workflow = Primary rules + Core workflow + Project profile + Runtime context
```

| Layer | Where it lives | What it does |
| ----- | -------------- | ------------ |
| Primary rules | CLAUDE.md / copilot-instructions.md | user's directives - highest authority |
| Core workflow | 20 on-demand skills (plugin) | pure capabilities; main thread dispatches subagents |
| Project profile | `docs/profiles/*.yml` → `PROJECT_CONTEXT.md` | project facts rendered from YAML |
| Runtime context | current task file + active skill | what to work on now |

<div class="pt-4 opacity-80">
Only primary rules and project context are always on. Everything else is summoned.
</div>

<!--
Contrast with v1, where the whole AGENTS.md was always loaded.
-->

---
layout: section
---

# Use Cases

## Three everyday flows, seamless chains.

---
layout: center
class: text-center
---

# Use Case 1 - Feature from a Ticket

```mermaid {scale: 0.33}
flowchart LR
  T[Jira ticket] --> TRI[triage]
  TRI --> TR["🤖\nticket-review\n+ requirement-analysis"]
  TR --> |Request approval| AP{"🧑\napprove\nreview + tasks?"}
  AP --> |NO| TR
  AP --> |YES| P{Parallel groups}
  P --> E1["🤖\nexecute-task"]
  P --> E2["🤖\nexecute-task"]
  E1 --> V["🤖\nverify-task"]
  E2 --> V
  V --> VC{Pass?}
  VC -->|Fail| VX["fix task\nmax 3, then escalate"]
  VX --> V
  VC -->|Pass| PR["🤖\npr-review"]
  PR --> VD{Verdict?}
  VD -->|Request changes| FX["fix + re-verify\nmax 3, then escalate"]
  FX --> PR
  VD -->|Approve| WU[wrap-up]
  WU --> CMP["comprehension\nbrief + quiz"]
  CMP --> H["🧑\ncommit"]
```

Independent tasks fan out in parallel, then converge through verification.

<!--
The parallel fan-out is only safe because each task is verified independently.
-->

---
layout: center
class: text-center
---

# Use Case 2 - Bug Fix

```mermaid {scale: 0.38}
flowchart LR
  B[Bug report] --> D["debug\n4-phase investigation"]
  D --> G{"🧑\napprove\nroot cause + fix?"}
  G -->|TRIVIAL| I["apply inline\n+ self-verify"]
  I --> CMP
  G -->|SIMPLE+| E["🤖\nexecute-task\ntdd red-green"]
  E --> V["🤖\nverify-task"]
  V --> VC{Pass?}
  VC -->|Fail| VX["fix task\nmax 3, then escalate"]
  VX --> E
  VC -->|Pass| PR["🤖\npr-review"]
  PR --> VD{Verdict?}
  VD -->|Request changes| FX["fix + re-verify\nmax 3, then escalate"]
  FX --> PR
  VD -->|Approve| WU[wrap-up]
  WU --> CMP["comprehension\nbrief + quiz"]
  CMP --> H["🧑\ncommit"]
```

Evidence-graded root cause before any fix. No layering guesses on guesses.

<!--
The 4-phase gate is the real difference from v1's bugfix workflow.
-->

---
layout: center
class: text-center
---

# Use Case 3 - PR Review Comments

```mermaid {scale: 0.35}
flowchart LR
  C[PR comments] --> AF["address-feedback\nfilter actionable"]
  AF --> G["🧑\napprove list"]
  G --> E["🤖\nexecute-task"]
  E --> V["🤖\nverify-task"]
  V --> VC{Pass?}
  VC -->|Fail| VX["fix task\nmax 3, then escalate"]
  VX --> E
  VC -->|Pass| RC{"pr-review\nre-check?"}
  RC -->|No| RP[report fixes]
  RC -->|Yes| PR["🤖\npr-review"]
  PR --> VD{Verdict?}
  VD -->|Request changes| FX["fix + re-verify\nmax 3, then escalate"]
  FX --> E
  VD -->|Approve| WU[wrap-up]
  WU --> RP
  RP --> CMP["comprehension\nbrief + quiz"]
  CMP --> H["🧑\nreview + push"]
```

Fixes land locally for the human to review - nothing is auto-pushed.

<!--
Human keeps the commit and push. The agent only prepares the change.
-->


---
layout: two-cols-header
---

# Humans Stay in Control

Automation runs the busywork - humans hold the gates.

::left::

### Approve before proceeding
- **Plan** - review the `ticket-review` output before any code
- **Tasks** - approve the execution plan
- **Root cause** - sign off the `debug` investigation and fix
- **Feedback** - pick which PR comments are actionable

::right::

### The final say
- **Diff** - the human reviews every change
- **Understanding** - `comprehension` recaps the change and quizzes you before you commit
- **Commit + push** - nothing lands automatically
- **Escalation** - after 3 fix attempts, the agent stops and asks

<div class="pt-4 opacity-80">
The agent never commits, pushes, or merges on its own.
</div>

<!--
Reassure managers and QA: judgment stays with the team at every gate.
-->

---
layout: section
---

# TODO-Driven Dispatch

## One rail. One dispatcher. Fresh workers.

---
layout: two-cols-header
---

# The Control Loop

::left::

### One rail
The main thread owns a single **TODO** - the control surface. Every skill writes its steps verbatim and marks each one done as it goes.

It walks the list top to bottom; each item is either:

- `invoke <skill>` - run inline
- `dispatch <skill> subagent` - spawn a fresh, isolated worker

::right::

### Report, then apply
A dispatched worker only **reports** a verdict and hand off next action in the chain. The main thread **applies** that update to the TODO and moves on.

> Subagents never spawn subagents.

Only the main thread dispatches, so the workflow runs identically on Claude Code, Copilot, or anywhere.

<!--
The overlap of the old two sections, stated once: the TODO is the surface, dispatch is how items run.
-->

---
layout: two-cols-header
---

# Why It Works

::left::

### Fresh workers
- **Independence** - `verify-task` and `pr-review` cannot rubber-stamp their own work
- **Context isolation** - each worker starts clean, no drift from a long session
- **Parallelism** - independent tasks dispatch at once, then converge

::right::

### The rail
- **Never stops** mid-chain
- **Never skips** a step
- **Always shows** where it is

<div class="pt-6 opacity-80">
Fresh-context quality, plus a visible control surface the agent can't fall off.
</div>

<!--
One story: isolated workers on a single, unskippable rail.
-->

---
layout: section
---

# New in v2

## What the team hasn't seen yet

---
layout: two-cols-header
---

# The New Skills

::left::

- **brainstorm** - explore vague requirements; propose 2-3 approaches before triage
- **requirement-analysis** - read-heavy analysis worker; drafts the review doc
- **verify-task** - independent per-task check in a fresh, isolated subagent
- **debug** - 4-phase root-cause investigation with evidence grading

::right::

- **address-feedback** - turn PR review comments into fix tasks, prepare a local commit
- **wrap-up** - post-review cleanup: promote exploration, verify docs, report status
- **comprehension** - after wrap-up, brief the human and run an advisory quiz on what shipped

<!--
Eleven new skills. Call out verify-task and debug as the biggest wins.
-->

---
layout: center
class: text-center
---

# Conclusion

<div class="text-2xl leading-10 pt-6">
20 skills. One dispatch contract.<br />
Claude Code and Copilot, from a single source.
</div>

<div class="pt-8 opacity-80">
The same discipline you trust - now on rails, independently verified, and portable.
</div>

<!--
Hand off to the live demo or Q&A here.
-->

---
layout: default
---

# What Building This Taught Me

- **Built-in agents are enough** - a generic harness plus injected skills makes the agent the domain expert, no custom agent types needed
- **Don't over-instruct** - models are smart now, lean skills beat micromanaged ones
- **Show, don't tell** - a pointer to a real example or existing pattern beats paragraphs of rules
- **Make the agent prove it** - models are eager to please and will claim success; demand evidence (file:line, command output), not assertions
- **Agents are half-blind** - visual and UI work needs a real view, not guesses

<!--
Personal, hard-won lessons - the reflective close before the appendix.
-->


---
layout: default
---

# Where It Goes Next

- **Listen to the team** - collect real-world feedback from everyone using the workflow and roll the fixes into the next iteration
- <img :src="'/ritus-ui.svg'" class="inline-block h-20 w-20 align-middle mr-2" /> **ritus-ui** - ui verify, e2e tests generation, and design-to-code


- <img :src="'/ritus-evals.svg'" class="inline-block h-20 w-20 align-middle mr-2" /> **ritus-evals** - per-session reports: cost, tools used, subagents spawned, retries to finish a task, and the hotspots where the workflow gets stuck

<div class="pt-6 opacity-80">
Same core - skills, subagent dispatch, the TODO rail, human gates. The plugin design keeps each addition small.
</div>

<!--
Honest solo roadmap: two concrete next steps, not a platform promise.
-->


---
layout: section
---

# Appendix

---
layout: section
---

## Appendix 1

[Ticket Review to PR Review](https://github.com/precise-alloy/ritus-demo/blob/master/ticket-review-to-pr-review.md)

