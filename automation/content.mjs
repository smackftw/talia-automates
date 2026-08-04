import { readFileSync } from "node:fs";

const mediaBase =
  "https://smackftw.github.io/talia-automates/media/instagram/2026-08";

const fixedQueue = [
  {
    id: "reel-03",
    type: "reel",
    scheduledDate: "2026-08-04",
    videoUrl: `${mediaBase}/reel-03-first-automation.mp4`,
    caption: `Your first automation should be boring.

Choose a task that repeats, has clear inputs and is easy to verify. Build one trigger, one decision and one reversible action. Add AI only after the simple workflow is reliable.

Two free n8n starter templates are available through the link in bio.

#n8n #automation #workflowautomation #freelancer #aiautomation`,
  },
  {
    id: "post-07",
    type: "carousel",
    scheduledDate: "2026-08-06",
    imageUrls: [1, 2, 3].map(
      (slide) => `${mediaBase}/post-07/slide-0${slide}.png`,
    ),
    caption: `Most automation failures are designed in before the workflow is ever switched on.

Three common mistakes:
1. automating a process that is already unclear
2. forgetting duplicate protection
3. having no alert when something fails

Start with sample data, log every important action and keep risky outputs reversible.

Which guardrail has saved you before?

#workflowautomation #n8n #automationtips #solopreneur #smallbusiness`,
  },
  {
    id: "post-08",
    type: "carousel",
    scheduledDate: "2026-08-07",
    imageUrls: [1, 2, 3].map(
      (slide) => `${mediaBase}/post-08/slide-0${slide}.png`,
    ),
    caption: `Your first automation does not need to be impressive. It needs to remove repetition you already understand.

Five strong starting points:
• lead follow-up
• invoice reminders
• meeting notes
• weekly reports
• inbox triage

Pick one task with predictable inputs and an output you can review quickly. Two starter n8n workflows are free through the link in bio.

#n8nworkflow #freelancer #productivity #aiautomation #nocode`,
  },
  {
    id: "post-09",
    type: "carousel",
    scheduledDate: "2026-08-08",
    imageUrls: [1, 2, 3].map(
      (slide) => `${mediaBase}/post-09/slide-0${slide}.png`,
    ),
    caption: `Do not start with an autonomous AI agent.

Start with:
Trigger → one decision → one action → write to a log.

Run the simple version long enough to understand where judgment is actually needed. Then add AI to that specific step — not everywhere.

Reliable first. Intelligent second.

#n8n #workflowdesign #automation #aiagents #buildinpublic`,
  },
];

const approved = JSON.parse(
  readFileSync(new URL("./approved-content.json", import.meta.url), "utf8"),
);

export const publicationQueue = [...fixedQueue, ...(approved.items || [])];
