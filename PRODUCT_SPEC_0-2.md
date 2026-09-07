# Feature: Push Notifications for Task Assignment and Due-Today Reminders

## Summary

Add push notifications to Family Tasks for two high-value scenarios:

1. A family member is assigned a task by another family member.
2. A family member has one or more tasks due today.

The goal is to improve awareness without requiring users to repeatedly open the app.

This feature should remain deliberately simple and avoid notification overload.

---

## User Problem

Family Tasks currently provides clear ownership of tasks, but users only become aware of new tasks when they open the application.

This creates two gaps:

* A user may not realise that another family member has assigned them a new task.
* A user may forget to check tasks that are due today.

The application should proactively surface these situations through push notifications.

---

## User Stories

### Assignment notification

**As a family member**
I want to receive a notification when another family member assigns me a task
**so that** I know that something new has become my responsibility.

### Due-today reminder

**As a family member**
I want to receive a reminder when I have outstanding tasks due today
**so that** I do not need to remember to manually check the app.

### Notification preferences

**As a family member**
I want to control which notification types I receive
**so that** notifications remain useful rather than intrusive.

---

# Functional Requirements

## 1. Task Assignment Notification

When User A creates a task and assigns it to User B:

```text
Dad creates:

Book dentist appointment
Assigned to: Mum
Due: Friday
```

User B should receive a push notification.

Example:

```text
Family Tasks

Trevor assigned you a task

Book dentist appointment
```

Tapping the notification should open the relevant task where practical.

If deep linking directly to the task is not yet supported, open:

```text
/my-tasks
```

instead.

---

## Assignment Notification Rules

Send a notification when:

```text
created_by != assigned_to
AND
assigned_to IS NOT NULL
```

Do not send a notification when:

* A user assigns a task to themselves.
* A task is unassigned.
* Push notifications are disabled for that user.
* The assignee has no valid push subscription.

---

## Reassignment

If an existing task is reassigned from User A to User B:

```text
Previously:
Assigned to Dad

Changed to:
Assigned to Mum
```

User B should receive the same type of assignment notification.

Do not notify the previously assigned user in v0.2.

---

# 2. Due-Today Notification

Once per day, identify outstanding tasks where:

```text
assigned_to = current family member
AND
due_date = today
AND
status = 'todo'
```

Send a reminder to the assignee.

Avoid sending one notification per task.

Prefer a summary notification.

Example for one task:

```text
Family Tasks

1 task due today

Book dentist appointment
```

Example for multiple tasks:

```text
Family Tasks

3 tasks due today

Tap to view your tasks
```

Tapping the notification should open:

```text
/my-tasks
```

---

# 3. Reminder Timing

Initial default:

```text
08:00 local family time
```

The scheduled reminder should run once per day.

For the initial implementation, family timezone may default to the application's configured timezone.

Preferred production configuration for the current family:

```text
Europe/London
```

The implementation should avoid assuming UTC when determining whether a task is due "today".

Future configurable reminder times are outside the current scope.

---

# 4. Notification Preferences

Add notification preferences per authenticated family member.

Suggested schema:

```text
notification_preferences

id
family_member_id
task_assigned_enabled BOOLEAN DEFAULT true
due_today_enabled BOOLEAN DEFAULT true
created_at
updated_at
```

Each authenticated parent should be able to enable or disable:

```text
Task assigned to me      [ On / Off ]

Tasks due today          [ On / Off ]
```

The UI can initially live under:

```text
Profile / Settings
→ Notifications
```

Avoid adding additional notification types in this enhancement.

---

# 5. Push Subscription Model

Store browser/device push subscriptions separately from notification preferences.

A user may have more than one device.

Suggested table:

```text
push_subscriptions

id                  UUID PK
family_member_id    UUID FK
endpoint             TEXT NOT NULL
p256dh               TEXT NOT NULL
auth                 TEXT NOT NULL
user_agent           TEXT nullable
created_at           TIMESTAMP
updated_at           TIMESTAMP
last_used_at         TIMESTAMP nullable
```

A family member may therefore have:

```text
Mum
 ├── iPhone PWA
 └── iPad PWA
```

Notifications should be sent to all valid registered subscriptions for that user.

---

# 6. Web Push Architecture

Use standard Web Push Notifications.

High-level flow:

```text
User installs / opens PWA
        ↓
Browser requests notification permission
        ↓
Service worker creates PushSubscription
        ↓
Subscription stored in Supabase
        ↓
Server-side notification event occurs
        ↓
Retrieve recipient subscriptions
        ↓
Send Web Push notification
        ↓
Device displays notification
```

Do not send notifications directly from client-side application code after task creation.

Push delivery must be initiated server-side.

---

# 7. Service Worker

Extend the existing PWA service worker, or add one if required.

It must support:

```text
push
notificationclick
```

Example behaviour:

```text
push event
    ↓
parse payload
    ↓
showNotification()

notificationclick
    ↓
close notification
    ↓
open relevant application URL
```

Example notification payload:

```json
{
  "title": "Family Tasks",
  "body": "Trevor assigned you: Book dentist appointment",
  "url": "/tasks/<task-id>",
  "type": "task_assigned"
}
```

For due-today notifications:

```json
{
  "title": "Family Tasks",
  "body": "You have 3 tasks due today",
  "url": "/my-tasks",
  "type": "due_today"
}
```

---

# 8. iPhone / PWA Behaviour

The application is intended to be used as an installed PWA.

Push notification setup should work with supported modern iOS versions where web push is available for Home Screen web apps.

The UI should make notification enablement understandable.

Suggested messaging:

```text
Get task reminders

Allow Family Tasks to notify you when:
• Someone assigns you a task
• You have tasks due today

[ Enable notifications ]
```

Do not request notification permission immediately on first page load.

Permission should be requested only after a deliberate user action such as:

```text
Enable notifications
```

This avoids presenting a browser permission prompt without context.

---

# 9. Server-Side Push Service

Create a reusable notification service.

Suggested responsibility:

```text
sendPushNotification({
  recipientFamilyMemberId,
  title,
  body,
  url,
  type
})
```

The service should:

1. Load the recipient's notification preferences.
2. Determine whether the notification type is enabled.
3. Load active push subscriptions.
4. Send the push message.
5. Handle failed or expired subscriptions safely.
6. Update `last_used_at` where appropriate.

Do not duplicate push-delivery logic across task APIs and scheduled jobs.

---

# 10. VAPID Configuration

Use VAPID keys for Web Push.

Required server-side environment variables should be documented.

Example names:

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

The private key must never be exposed to client-side JavaScript.

Only the public VAPID key may be exposed to the browser.

Document the setup in the project README.

---

# 11. Task Creation Integration

When a task is created:

```text
create task
    ↓
database insert succeeds
    ↓
determine whether assigned_to != created_by
    ↓
trigger server-side notification
```

Notification delivery failure must not cause task creation to fail.

Example:

```text
Task persisted successfully
Push provider unavailable
```

Result:

```text
Task creation = success
Notification = log failure
```

Task persistence is more important than push delivery.

---

# 12. Task Reassignment Integration

When a task is edited:

Compare:

```text
old.assigned_to
new.assigned_to
```

If:

```text
new.assigned_to IS NOT NULL
AND
new.assigned_to != old.assigned_to
AND
new.assigned_to != editing_user
```

send an assignment notification to the new assignee.

---

# 13. Scheduled Due-Today Job

Create one scheduled server-side job per day.

Depending on the existing architecture, use an appropriate mechanism such as:

* Vercel Cron
* Supabase scheduled function / cron
* Existing scheduled backend mechanism

Prefer the simplest solution compatible with the current deployment.

The job should:

1. Determine the current date in the configured family timezone.
2. Query outstanding tasks due today.
3. Group tasks by `assigned_to`.
4. Exclude users with due-today notifications disabled.
5. Send one summary notification per user.
6. Avoid duplicate daily reminders.

---

# 14. Prevent Duplicate Daily Notifications

Introduce a lightweight delivery log or equivalent idempotency mechanism.

Suggested table:

```text
notification_delivery_log

id                  UUID PK
family_member_id    UUID FK
notification_type   TEXT
reference_date      DATE nullable
reference_id        UUID nullable
sent_at             TIMESTAMP
```

For due-today notifications, enforce at application level or database level that only one reminder is sent per:

```text
family_member_id
+
notification_type = due_today
+
reference_date
```

This protects against a scheduled job being retried.

For assignment notifications, duplicate prevention may use:

```text
task_id
+
recipient
+
assignment event
```

If assignment-event tracking would significantly complicate v0.2, prioritise duplicate protection for due-today reminders first.

---

# 15. Expired Subscription Handling

Push subscriptions can expire or become invalid.

If the push provider returns an appropriate terminal response such as an expired/unregistered subscription:

```text
404
410
```

remove or deactivate that subscription.

Do not repeatedly retry permanently invalid subscriptions.

Transient failures should be logged but should not immediately remove the subscription.

---

# 16. Security

Push subscriptions are family-specific user data.

RLS must ensure that users cannot:

* View another family's subscriptions.
* Modify another family's subscriptions.
* Register a subscription against a family member outside their family.

Normal users should only manage their own push subscriptions.

Server-side notification code may use an appropriate privileged Supabase client where necessary.

Do not expose service-role credentials to the browser.

---

# 17. Privacy

Do not include sensitive task descriptions in notifications by default.

For v0.2, the task title may be included.

Avoid including:

* Long descriptions
* Notes
* Reward transaction details
* Other sensitive metadata

Future notification privacy options can be considered if required.

---

# 18. Notification Settings Wireframe

```text
┌─────────────────────────────────┐
│ Notifications                   │
│                                 │
│ Push notifications              │
│                                 │
│ Status                          │
│ Enabled                         │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ Task assigned to me             │
│                        [ ON ]    │
│                                 │
│ Tasks due today                 │
│                        [ ON ]    │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ Device                          │
│ iPhone · Enabled                │
│                                 │
│ [ Disable notifications ]       │
│                                 │
└─────────────────────────────────┘
```

If permission has not yet been granted:

```text
Push notifications

Get notified when another family
member assigns you a task or when
you have tasks due today.

[ Enable notifications ]
```

---

# 19. Assignment Notification Example

Scenario:

```text
Logged in:
Trevor

Creates:
Complete school consent form

Assigned to:
Mum
```

Expected:

Mum's registered device receives:

```text
Family Tasks

Trevor assigned you a task

Complete school consent form
```

Trevor does not receive a notification.

---

# 20. Self-Assignment Example

Scenario:

```text
Trevor creates:

Book MOT

Assigned to:
Trevor
```

Expected:

```text
No push notification
```

The task should still appear normally in My Tasks and Today.

---

# 21. Due-Today Example

Mum has:

```text
Complete school form
Due today

Buy birthday present
Due today

Book dentist
Due Friday
```

At the configured morning notification time she receives:

```text
Family Tasks

2 tasks due today

Tap to view your tasks
```

`Book dentist` is not included because it is not due today.

---

# 22. Acceptance Criteria

## Notification Registration

* [ ] User can deliberately enable push notifications.
* [ ] Browser permission is requested only after explicit user action.
* [ ] A valid push subscription is saved against the logged-in family member.
* [ ] Multiple device subscriptions can exist for the same family member.
* [ ] User can disable notifications on the current device.

## Task Assignment

* [ ] Creating a task assigned to another family member sends that person a notification.
* [ ] Creating a task assigned to self does not send a notification.
* [ ] Creating an unassigned task does not send a notification.
* [ ] Reassigning a task to another family member sends the new assignee a notification.
* [ ] Notification failure does not fail task creation/update.
* [ ] Assignment notification respects user preferences.

## Due Today

* [ ] Scheduled job runs once per day.
* [ ] Only outstanding tasks due today are included.
* [ ] Completed tasks are excluded.
* [ ] Tasks are grouped by assignee.
* [ ] One summary notification is sent per user.
* [ ] Due-today notification respects user preferences.
* [ ] Duplicate reminders are prevented for the same user/date.

## Notification Interaction

* [ ] Tapping an assignment notification opens the relevant task or My Tasks.
* [ ] Tapping a due-today notification opens My Tasks.
* [ ] Existing application windows should be reused where practical.

## Security

* [ ] Push subscriptions are protected by RLS.
* [ ] Users cannot manage subscriptions belonging to another family.
* [ ] VAPID private key is server-only.
* [ ] Supabase service credentials are not exposed client-side.

## Reliability

* [ ] Invalid/expired subscriptions are removed or disabled.
* [ ] Transient notification errors are logged.
* [ ] Push failure never causes task operations to fail.

---

# 23. Testing Requirements

Add automated tests around server-side notification behaviour.

At minimum test:

```text
Task created:
creator == assignee
→ no push
```

```text
Task created:
creator != assignee
→ push requested
```

```text
Task created:
assigned_to == null
→ no push
```

```text
Task reassigned:
old assignee != new assignee
→ new assignee receives push
```

```text
Due job:
3 tasks assigned to same user
→ one summary push
```

```text
Due job:
completed task due today
→ excluded
```

```text
Due job reruns for same date
→ duplicate notification prevented
```

Also manually test:

* Installed iPhone PWA
* Permission allowed
* Permission denied
* PWA removed/reinstalled
* Multiple devices for one user
* Expired subscription
* Notification click behaviour

---

# 24. Out of Scope

Do not add the following as part of this enhancement:

* Overdue recurring reminders
* Reminder snoozing
* User-selected reminder times
* Per-task reminder times
* Email notifications
* SMS
* Notifications when tasks are completed
* Notifications when tasks are deleted
* Notifications when someone comments
* Notification centre / inbox
* AI-generated notifications
* Child-specific notification behaviour
* Calendar notifications

These can be considered separately based on future user feedback.

---

# 25. Implementation Sequence

Claude Code should implement this incrementally.

## Step 1

Review the current Family Tasks codebase and existing PWA implementation.

Identify:

* Existing task creation/update flow
* Existing authentication model
* Existing service worker
* Existing deployment architecture
* Current Supabase schema and RLS

Do not assume the current implementation exactly matches the original product specification.

## Step 2

Propose the notification architecture and identify any changes required to the schema.

## Step 3

Create migrations for:

```text
push_subscriptions
notification_preferences
notification_delivery_log
```

Implement appropriate RLS.

## Step 4

Implement push subscription registration and removal.

## Step 5

Implement service worker push handling.

## Step 6

Implement reusable server-side push service.

## Step 7

Integrate assignment notifications into task create/reassignment flows.

## Step 8

Implement due-today scheduled job.

## Step 9

Implement notification settings UI.

## Step 10

Add automated tests.

## Step 11

Document required environment variables and deployment configuration.

## Step 12

Provide a manual end-to-end test checklist for production.

---

# 26. Definition of Done

This feature is complete when:

> Trevor can create a task for another family member and that person receives a push notification on their installed Family Tasks PWA.

And:

> Each morning, a family member with outstanding tasks due that day receives one useful summary notification.

The implementation should make these two journeys reliable before additional notification types are considered.
