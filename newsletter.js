(() => {
  const section = document.querySelector("#newsletter");
  const form = document.querySelector("#newsletter-form");
  const action = window.TALIA_NEWSLETTER?.formAction?.trim();
  if (!section || !form || !action) return;

  try {
    const url = new URL(action);
    if (url.protocol !== "https:") return;
    form.action = url.href;
    section.hidden = false;
  } catch {
    console.warn("Newsletter form action is invalid; signup remains hidden.");
  }
})();
