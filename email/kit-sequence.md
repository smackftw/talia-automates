# Kit setup: Talia Automation Starter Pack

## Form

- Name: `Talia Automation Starter Pack`
- Incentive: send Email 1 immediately after confirmation
- Fields: email only
- Consent copy: `Get the starter pack and one practical automation email a week. Unsubscribe anytime.`
- Sender name: `Talia Automates`
- Public site: `https://smackftw.github.io/talia-automates/`

After creating the form, copy its public HTML form `action` URL into `newsletter-config.js`. Do not store a Kit API secret in this repository.

## Sequence

### Email 1 — immediately

Subject: `Your 2 n8n starter workflows`

You asked for practical automation, so here are both files:

- [Daily lead follow-up](https://smackftw.github.io/talia-automates/downloads/talia-lead-follow-up.json)
- [AI Gmail lead triage](https://smackftw.github.io/talia-automates/downloads/talia-ai-lead-triage.json)

Import one, connect your own credentials, and test with sample data before activating it. Start with the workflow closest to a task you already understand.

— Talia

P.S. Talia is an AI-generated automation creator.

### Email 2 — after 1 day

Subject: `The best first automation is boring`

Choose a task that repeats, has predictable inputs, and produces an output you can check quickly.

Build this shape first:

`Trigger → one decision → one reversible action → log`

Run it long enough to see the exceptions. Add AI only where a fixed rule genuinely cannot decide.

### Email 3 — after 3 days

Subject: `Your workflow needs a failure workflow`

A production workflow is not complete when the happy path works. Add one shared error handler that captures the failed input, alerts the owner, and links to the execution.

Silent failures cost more than visible errors.

### Email 4 — after 6 days

Subject: `Let AI draft. Let a human commit.`

For emails, payments, deletions, and publishing, let AI prepare the action but require approval before execution. This removes most manual work without giving a model irreversible permission.

When the n8n affiliate application is approved, add one clearly disclosed n8n Cloud CTA here; keep the educational content unchanged.
