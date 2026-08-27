# Family Tasks — Product Specification

**Version:** 0.1
**Status:** MVP
**Primary platform:** Mobile-first web application / PWA

---

## 1. Product Vision

Family Tasks is a lightweight application for managing the responsibilities involved in running a family.

The primary problem it solves is:

> **Make it obvious what needs doing in the family, when it needs doing, and who owns it.**

The initial focus is family administration between parents rather than children's chores.

Typical examples include:

* Book dentist appointments
* Complete school forms
* Renew insurance
* Arrange an MOT
* Pay club fees
* Buy birthday presents
* Book a boiler service
* Put bins out
* Order school uniform

A later phase will allow children to complete household chores in return for pocket money.

The application should feel like a **family organisation tool**, not corporate project-management software.

---

# 2. Product Principles

### 2.1 Capture quickly

Creating a basic task should take less than approximately 10 seconds.

A user should be able to enter:

**Task → Owner → Due date → Save**

without navigating through a complicated form.

### 2.2 Clear ownership

Where possible, every task should have one responsible person.

Tasks may also temporarily be unassigned.

### 2.3 Make important work visible

Opening the application should immediately show:

* Overdue tasks
* Tasks due today
* Important upcoming tasks

Tasks must not disappear simply because their due date has passed.

### 2.4 Reduce family mental load

The application should act as a trusted place to record responsibilities rather than requiring one parent to remember and repeatedly remind others about them.

### 2.5 Keep the MVP small

Do not introduce features unless they directly support the core family task workflow.

Avoid building a generic project-management platform.

---

# 3. Technology

The initial implementation should use:

* Next.js
* App Router
* TypeScript
* Tailwind CSS
* Supabase
* PostgreSQL
* Supabase Authentication
* Supabase Row Level Security
* Vercel
* GitHub

The application should be structured so it can operate as a Progressive Web App (PWA).

Primary usage will be through mobile phones.

Native iOS or Android applications are explicitly outside the MVP.

---

# 4. Deployment Architecture

```text
Developer
    │
    │ Claude Code
    ▼
Local Next.js application
    │
    ▼
GitHub
    │
    │ push / merge to main
    ▼
Vercel
    │
    ▼
Production Next.js application
    │
    ▼
Supabase
 ┌───────────────┐
 │ PostgreSQL    │
 │ Auth          │
 │ RLS           │
 └───────────────┘
```

Production will initially use a standard Vercel domain such as:

```text
familytasks.vercel.app
```

A custom domain may be introduced later.

---

# 5. Users

## Parent

Parents are authenticated application users.

Parents can:

* Create tasks
* Edit tasks
* Delete tasks
* Assign tasks
* Complete tasks
* View all family tasks
* Manage family members

Later they will also:

* Create children's chores
* Assign monetary rewards
* Approve completed chores
* Record pocket-money payments

## Child

Children initially exist as family members without authentication.

A child can therefore have tasks assigned to them without needing an application account.

Child authentication will be introduced in a later release.

---

# 6. Family Model

Every authenticated user belongs to a family.

A family contains multiple family members.

Example:

```text
Eland Family

Dad       Parent
Mum       Parent
Child 1   Child
Child 2   Child
```

All family-specific data must be associated with a `family_id`.

Users must never be able to access another family's data.

This must be enforced at database level using Supabase Row Level Security and must not rely solely on client-side filtering.

---

# 7. Main Navigation

The mobile navigation contains three destinations and a prominent task creation action:

```text
┌───────────────────────────────┐
│                               │
│                               │
│        Current screen         │
│                               │
│                               │
├───────────────────────────────┤
│                               │
│  Today    My Tasks   Family   │
│              +                │
│                               │
└───────────────────────────────┘
```

The `+` action opens **Add Task**.

The four principal experiences are therefore:

1. Today
2. My Tasks
3. Add Task
4. Family

---

# 8. Today

Today is the default application screen.

It answers:

> **What needs doing in the family right now?**

It shows tasks for the whole family, not just the current user.

## Sections

Tasks should be grouped into:

### Overdue

Outstanding tasks where:

```text
due_date < today
```

### Today

Outstanding tasks due today.

### Upcoming

Outstanding tasks due within an appropriate upcoming period, initially approximately seven days.

---

## Wireframe

```text
┌─────────────────────────────────┐
│ Family Tasks              👤    │
│                                 │
│ Thursday 20 August              │
│                                 │
│ ⚠ OVERDUE                      │
│ ┌─────────────────────────────┐ │
│ │ ○ Book dentist             │ │
│ │   Dad · Yesterday          │ │
│ └─────────────────────────────┘ │
│                                 │
│ TODAY                           │
│ ┌─────────────────────────────┐ │
│ │ ○ Complete school form     │ │
│ │   Mum                      │ │
│ ├─────────────────────────────┤ │
│ │ ○ Put bins out            │ │
│ │   Dad · Every Thursday     │ │
│ └─────────────────────────────┘ │
│                                 │
│ UPCOMING                        │
│ ┌─────────────────────────────┐ │
│ │ ○ Renew car insurance      │ │
│ │   Dad · 24 Aug             │ │
│ ├─────────────────────────────┤ │
│ │ ○ Buy birthday present     │ │
│ │   Mum · 26 Aug             │ │
│ └─────────────────────────────┘ │
│                                 │
│              +                  │
├─────────────────────────────────┤
│  Today     My Tasks     Family  │
└─────────────────────────────────┘
```

Tapping the completion control marks a task complete.

Tapping elsewhere on the task opens its details.

Completing a task should briefly provide an **Undo** option.

---

# 9. My Tasks

My Tasks answers:

> **What am I responsible for?**

Only tasks assigned to the currently authenticated family member are displayed.

## Grouping

Outstanding tasks should be grouped by:

```text
Overdue
Today
This week
Later
No due date
```

Provide two high-level views:

```text
To Do | Completed
```

Avoid advanced filtering in the MVP.

---

## Wireframe

```text
┌─────────────────────────────────┐
│ My Tasks                        │
│                                 │
│ Dad                             │
│                                 │
│ [ To Do ]   [ Completed ]       │
│                                 │
│ ⚠ OVERDUE                      │
│                                 │
│ ○ Book dentist                  │
│   Yesterday                     │
│                                 │
│ TODAY                           │
│                                 │
│ ○ Put bins out                  │
│   Every Thursday                │
│                                 │
│ THIS WEEK                       │
│                                 │
│ ○ Renew car insurance           │
│   Monday                        │
│                                 │
│ ○ Order school shoes            │
│   Wednesday                     │
│                                 │
│ LATER                           │
│                                 │
│ ○ Book boiler service           │
│   12 September                  │
│                                 │
│              +                  │
├─────────────────────────────────┤
│  Today     My Tasks     Family  │
└─────────────────────────────────┘
```

---

# 10. Add Task

Task creation is one of the most important user journeys.

The interface must prioritise speed.

## Primary fields

The initial form contains:

* Task title
* Assignee
* Due date
* Recurrence

Optional functionality should not clutter the initial view.

---

## Wireframe

```text
┌─────────────────────────────────┐
│ ✕          Add Task             │
│                                 │
│ What needs doing?               │
│ ┌─────────────────────────────┐ │
│ │ Book dentist appointments  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Assign to                       │
│                                 │
│ [ Dad ] [ Mum ] [ Anyone ]      │
│                                 │
│ Due                             │
│                                 │
│ [ Today ] [ Tomorrow ] [ Pick ] │
│                                 │
│ Repeat                          │
│                                 │
│ [ Never ▼ ]                    │
│                                 │
│ ─────────────────────────────── │
│                                 │
│       More options       ›      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │          Add Task           │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

## More Options

Expanding More Options exposes:

* Description
* Category
* Reward amount
* Requires approval

Reward and approval are primarily intended for future child chore functionality.

---

# 11. Unassigned Tasks

A task does not have to immediately have an owner.

Example:

```text
Arrange MOT
Owner: Anyone
```

Internally this means:

```text
assigned_to = null
```

Unassigned tasks should remain clearly visible.

A parent should eventually be able to select:

```text
Assign to me
```

This supports rapid capture of family responsibilities before deciding who will handle them.

---

# 12. Family

Family provides an overview of workload across family members.

It answers:

> **Who currently has what?**

---

## Wireframe

```text
┌─────────────────────────────────┐
│ Family                          │
│                                 │
│ 12 tasks outstanding            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Dad                     5   │ │
│ │                             │ │
│ │ ⚠ 1 overdue                │ │
│ │ ○ Book dentist             │ │
│ │ ○ Put bins out             │ │
│ │                   View all ›│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Mum                     4   │ │
│ │                             │ │
│ │ ○ Complete school form     │ │
│ │ ○ Birthday present         │ │
│ │                   View all ›│ │
│ └─────────────────────────────┘ │
│                                 │
│ CHILDREN                        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Child                   3   │ │
│ │                             │ │
│ │ ○ Tidy bedroom       £1.00 │ │
│ │ ○ Empty dishwasher   £0.50 │ │
│ │                             │ │
│ │                   View all ›│ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  Today     My Tasks     Family  │
└─────────────────────────────────┘
```

Selecting a family member displays their outstanding tasks.

---

# 13. Task Completion

For normal adult tasks, completion should be immediate.

```text
○ Put bins out
```

becomes:

```text
✓ Put bins out
```

The application should display a temporary confirmation:

```text
Task completed                  Undo
```

Completion information must be persisted rather than simply removing the task.

---

# 14. Recurring Tasks

MVP recurrence options:

```text
Never
Daily
Weekly
Monthly
Yearly
```

Do not implement arbitrary recurrence rules in the MVP.

When a recurring task is completed:

1. Mark the current task complete.
2. Retain it for history.
3. Calculate the next due date.
4. Create the next task occurrence.

Example:

```text
Put bins out
20 August
Weekly
```

becomes:

```text
Put bins out
27 August
Weekly
```

The original 20 August task remains as a completed record.

---

# 15. Categories

Categories are optional.

Initial suggested categories:

```text
Home
Family
School
Money
Car
Pets
Appointments
Shopping
Other
```

Users must not be forced to select a category when creating a task.

Custom category management is outside the initial MVP.

---

# 16. Data Model

## families

```text
id              UUID PK
name            TEXT
created_at      TIMESTAMP
```

## profiles

```text
id              UUID PK
user_id         UUID
display_name    TEXT
created_at      TIMESTAMP
```

## family_members

```text
id              UUID PK
family_id       UUID FK
profile_id      UUID FK nullable
display_name    TEXT
role            parent | child
created_at      TIMESTAMP
```

A child can therefore exist without an authenticated profile.

## categories

```text
id              UUID PK
family_id       UUID FK nullable
name            TEXT
created_at      TIMESTAMP
```

## tasks

```text
id                  UUID PK
family_id           UUID FK
title               TEXT
description         TEXT nullable

assigned_to         UUID FK family_members nullable
created_by          UUID FK family_members

category_id         UUID FK nullable

due_date             DATE nullable

status               todo | done

recurrence           never | daily | weekly | monthly | yearly

reward_amount        DECIMAL nullable
requires_approval    BOOLEAN default false

parent_task_id       UUID FK tasks nullable

completed_at         TIMESTAMP nullable

created_at           TIMESTAMP
updated_at           TIMESTAMP
```

`parent_task_id` can be used to relate generated recurring occurrences.

---

# 17. Future Pocket Money Model

Pocket money is not required for the initial adult-focused release, but the architecture should not prevent its introduction.

A child's task may contain:

```text
reward_amount = 1.00
requires_approval = true
```

When the child completes the task:

```text
Tidy bedroom
£1.00

Status:
Awaiting parent approval
```

A parent can then:

```text
Reject | Approve
```

Approval creates a financial ledger entry.

Future table:

## reward_transactions

```text
id              UUID PK
family_id       UUID FK
child_id        UUID FK family_members
task_id         UUID FK nullable

type            earned | paid | adjustment
amount          DECIMAL

created_by      UUID
created_at      TIMESTAMP
```

Pocket-money balances should be **calculated from transactions**, not stored as a mutable balance field.

Example:

```text
Earned                         +£5.00
Pocket money paid              -£3.00
Adjustment                     +£1.00
────────────────────────────────────
Balance                         £3.00
```

---

# 18. Future Child Experience

A future child-specific interface may look like:

```text
┌─────────────────────────────────┐
│ My Jobs                         │
│                                 │
│ TODAY                           │
│                                 │
│ ○ Empty dishwasher       £0.50 │
│ ○ Tidy bedroom           £1.00 │
│ ○ Put clothes away       £0.50 │
│                                 │
│ EXTRA JOBS                      │
│                                 │
│ ○ Wash car               £3.00 │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ This week                       │
│                                 │
│ Earned                   £4.50 │
│ Waiting approval         £1.00 │
│                                 │
└─────────────────────────────────┘
```

This functionality is explicitly **not required for v0.1**.

---

# 19. Authentication

Initial authentication is required only for parents.

Use Supabase Authentication.

The implementation should initially support a straightforward secure authentication mechanism.

Authentication sessions should persist so users do not need to log in every time they open the PWA.

Future options may include:

* Magic links
* Social authentication
* Passkeys

Do not introduce unnecessary authentication complexity into v0.1.

---

# 20. Security

Security must be implemented from the beginning.

Supabase Row Level Security must ensure that users can access only data associated with families of which they are members.

For example:

```text
User from Family A
        │
        ├── Family A tasks       ALLOW
        │
        └── Family B tasks       DENY
```

Do not rely solely upon filtering in React or Next.js.

Sensitive Supabase credentials must never be exposed to the client.

Secrets must be stored using environment variables.

---

# 21. PWA

The application should be designed mobile-first.

It should be possible to add the application to an iPhone or Android home screen.

The project should support the introduction of:

* Web app manifest
* Application icons
* Standalone display mode

Offline functionality is not required for v0.1.

---

# 22. User Stories

## Create task

**As a parent**
I want to quickly create a task
**so that** I do not have to remember it.

## Assign responsibility

**As a parent**
I want to assign a task to myself or my partner
**so that** responsibility is clear.

## Capture unassigned work

**As a parent**
I want to record a task without assigning it
**so that** I can capture something before deciding who will do it.

## Today's responsibilities

**As a parent**
I want to see everything important today
**so that** family jobs are not forgotten.

## Personal responsibilities

**As a parent**
I want to see only my outstanding tasks
**so that** I know what I am responsible for.

## Family responsibilities

**As a parent**
I want to see tasks grouped by family member
**so that** I can understand the overall family workload.

## Recurring responsibilities

**As a parent**
I want routine tasks to recur automatically
**so that** I do not repeatedly create them.

## Overdue work

**As a parent**
I want overdue tasks to remain visible
**so that** missed responsibilities do not disappear.

## Completion

**As a parent**
I want to mark tasks complete quickly
**so that** the family task list stays current.

---

# 23. MVP Scope

## Included in v0.1

* Parent authentication
* Create family
* Family members
* Parent and child member types
* Create task
* Edit task
* Delete task
* Assign task
* Unassigned tasks
* Due dates
* Today view
* My Tasks view
* Family view
* Task completion
* Completed task history
* Simple recurrence
* Optional categories
* Mobile-first responsive interface
* Supabase Row Level Security
* Vercel deployment
* PWA-ready structure

## Explicitly excluded from v0.1

* Child authentication
* Pocket-money UI
* Payment processing
* Push notifications
* Email notifications
* Calendar integration
* Chat
* Comments
* Attachments
* Shopping lists
* Meal planning
* Advanced search
* Advanced filters
* Complex recurrence
* Statistics
* Gamification
* Native mobile applications
* AI features

---

# 24. Development Sequence

Development should proceed as small vertical slices.

## Phase 1 — Foundation

Implement:

1. Next.js project
2. TypeScript
3. Tailwind
4. Supabase integration
5. Database migrations
6. RLS policies
7. Authentication
8. Application shell
9. Mobile navigation

## Phase 2 — Family

Implement:

1. Create family
2. Create family members
3. Associate authenticated parent with family
4. Family security

## Phase 3 — Basic Tasks

Implement the complete journey:

```text
Create task
    ↓
Store in Supabase
    ↓
Display task
    ↓
Edit task
    ↓
Complete task
```

This should work before introducing more advanced functionality.

## Phase 4 — Core Views

Implement:

* Today
* My Tasks
* Family

## Phase 5 — Recurrence

Implement:

* Daily
* Weekly
* Monthly
* Yearly

Ensure completed occurrences remain in history.

## Phase 6 — PWA

Implement:

* Manifest
* Icons
* Standalone mobile presentation
* Home-screen installation support

## Phase 7 — Family Testing

Deploy production.

Begin using the application for real family administration.

Do not immediately build additional planned features.

Collect actual usage feedback first.

---

# 25. MVP Success Criteria

The first version should be considered successful when two parents can:

1. Install/open the application on their phones.
2. Remain securely logged in.
3. Add a family task within approximately 10 seconds.
4. Assign it to either parent or leave it unassigned.
5. See what needs doing today.
6. See their personal responsibilities.
7. See their partner's responsibilities.
8. Complete a task easily.
9. Have recurring tasks automatically generate their next occurrence.
10. Reliably use Family Tasks instead of messaging or verbally reminding one another about routine family administration.

The primary success criterion is not feature count.

It is:

> **Does the family actually use it?**

---

# 26. Future Product Direction

Potential future features should be driven by observed family usage rather than implemented speculatively.

Likely areas include:

### Children's chores

Assign chores to children with optional financial rewards.

### Pocket money

Track earned, approved and paid pocket money using a transaction ledger.

### Notifications

Notify family members when important tasks become due.

### Calendar integration

Display relevant family events alongside tasks.

### Shared lists

Shopping, packing and other family lists.

### AI-assisted family administration

Potential future functionality could convert incoming information into suggested family tasks.

For example:

```text
School email:

"Payment for the Year 8 trip must
be received by Friday 18 September."

              ↓

Suggested task:

Pay Year 8 trip
Due: 18 September
Category: School

[ Assign to Mum ] [ Assign to Dad ]
```

AI-generated tasks should initially require human confirmation rather than being created automatically.

This is outside the MVP but should be considered a potential longer-term differentiator.

---

# 27. Instructions for Claude Code

This document is the source of truth for the Family Tasks MVP.

When implementing the application:

1. Do not expand the scope without being asked.
2. Prefer simple solutions over speculative abstractions.
3. Maintain strong TypeScript typing.
4. Keep components small and reusable where appropriate.
5. Keep business logic separate from presentation where practical.
6. Implement database changes through migrations.
7. Never weaken Row Level Security to simplify development.
8. Never expose server secrets to client-side code.
9. Optimise primarily for mobile use.
10. Preserve accessibility and semantic HTML.
11. Do not add libraries without a clear requirement.
12. Do not implement features listed as outside the MVP.
13. Write tests around important business logic, particularly recurrence and family access.
14. Explain significant architectural decisions before implementing them.
15. When requirements are genuinely ambiguous, ask rather than inventing major product behaviour.

Before generating substantial application code:

1. Read this entire specification.
2. Propose the project folder structure.
3. Propose the Supabase schema and migration strategy.
4. Propose the authentication and RLS approach.
5. Identify any important technical decisions or risks.
6. Present the proposed implementation plan.

Do not begin large-scale implementation until that architecture has been reviewed.

---

# 28. Guiding Principle

When choosing between two implementations, favour the one that makes the everyday family experience simpler.

The application exists to reduce mental load, not create another system that the family has to manage.
