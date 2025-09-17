function t(el) {
  return (el?.innerText || el?.textContent || "").trim();
}

function findIssueContainer() {
  // Full page issue view
  let c = document.querySelector(
    '[data-testid="issue-view"], [data-test-id="issue.views.root"]'
  );
  if (c) return c;

  // Agile board/backlog side panel (modal/drawer)
  c = document.querySelector(
    '[data-testid="issue-view-layout"], [data-testid="issue-view-root"], [role="dialog"] [data-testid="issue-view"]'
  );
  if (c) return c;

  // Fallback to main region
  return document.querySelector('main,[role="main"]') || document.body;
}

// Light redaction
function redact(s) {
  if (!s) return "";
  s = s.replace(/\b[0-9]{16,}\b/g, (m) => m.slice(0, 4) + "…" + m.slice(-4));
  s = s.replace(
    /\b[a-f0-9-]{24,}\b/gi,
    (m) => m.slice(0, 6) + "…" + m.slice(-4)
  );
  s = s.replace(/\b([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi, "***@***");
  return s;
}

function extractJira() {
  const root = findIssueContainer();

  // Key: try from visible UI then fallback from URL
  let key =
    t(
      root.querySelector(
        '[data-testid="issue-key"], [data-test-id="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]'
      )
    ) ||
    (location.pathname.match(/\/([A-Z]+-\d+)\b/i)?.[1] ?? "");

  // Title / Summary
  const title = t(
    root.querySelector(
      '[data-test-id="issue.views.issue-base.foundation.summary.heading"],[data-testid="issue.views.issue-base.foundation.summary.heading"], h1'
    )
  );

  // Description
  const desc = t(
    root.querySelector(
      '[data-test-id="issue.views.field.rich-text"], [data-testid="issue.views.issue-details.foundation.description"], [data-test-id="issue.activity.description"]'
    )
  );

  // Acceptance Criteria: look for nearby header or common blocks
  let ac = "";
  const headers = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  for (const h of headers) {
    if (/acceptance\s*criteria/i.test(h.innerText)) {
      const sib = h.parentElement?.nextElementSibling || h.nextElementSibling;
      ac = t(sib) || "";
      break;
    }
  }
  // Common custom field label variant
  if (!ac) {
    const acField = Array.from(
      root.querySelectorAll('[data-testid="issue-field"]')
    ).find((el) => /acceptance\s*criteria/i.test(el.innerText));
    if (acField) ac = t(acField);
  }

  return { key, title, description: desc, ac };
}

function buildPrompt(d, name, latestQuestion, threadPreview) {
  return `Write a reply comment as ${name}, in first person, addressing the latest question directed at me on this Jira issue.

Issue
- Key: ${d.key}
- Title: ${d.title}

Latest question for me
"""
${latestQuestion || "(No explicit question detected; provide a brief helpful update)"}
"""

Recent thread (most recent first, redacted)
"""
${threadPreview}
"""

Guidelines
- Sound like a human teammate; do not include AI/meta language.
- Be concise, specific, and action-oriented; keep to 2–6 short sentences or 3–6 bullets.
- If information is missing, ask one precise clarifying question and propose a next step.
- If a commitment is needed, state it plainly (e.g., what I will check or by when).
- Output only the comment body with no preface or labels.`;
}

async function getStore(keys) {
  return await new Promise((res) => chrome.storage.sync.get(keys, res));
}

function findCommentNodes() {
  const selector = [
    '[data-testid="issue.activity.comment"]',
    '[data-test-id="issue.activity.comment"]',
    '[data-testid*="comment"][role="article"]',
    '[data-testid*="comment"]',
    '.activity-item[data-test-id*="comment"]',
    '[data-testid="issue-view-activity-item.comment"]',
  ].join(',');
  const nodes = Array.from(document.querySelectorAll(selector));
  return nodes.filter((n) => !n.querySelector('[contenteditable="true"]'));
}

function extractCommentsText(nodes, limit = 6) {
  const list = [];
  for (const n of nodes.slice(-limit).reverse()) {
    const text = t(n);
    if (!text) continue;
    list.push(redact(text));
  }
  return list;
}

function findLatestQuestionForMe(name) {
  const nodes = findCommentNodes();
  const namePattern = new RegExp(`(^|\n|\s|@)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\b`, 'i');
  // Also catch just first name mention
  const first = name.split(' ')[0];
  const firstPattern = new RegExp(`(^|\n|\s|@)${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\b`, 'i');

  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const text = t(n);
    if (!text) continue;
    const hasQ = text.includes('?');
    if (!hasQ) continue;
    const mentions = namePattern.test(text) || firstPattern.test(text) ||
      Array.from(n.querySelectorAll('[data-mention-id]')).some((m) =>
        new RegExp(name, 'i').test(m.textContent || '')
      );
    if (mentions) return redact(text);
  }
  // Fallback: return latest question from anyone
  for (let i = nodes.length - 1; i >= 0; i--) {
    const text = t(nodes[i]);
    if (text && text.includes('?')) return redact(text);
  }
  return '';
}

function findCommentEditor() {
  // Jira Cloud uses ProseMirror. Prefer explicit IDs/roles when present.
  const sel = [
    // ProseMirror comment editor
    '#ak-editor-textarea',
    '.ProseMirror[role="textbox"]',
    '[role="textbox"][contenteditable="true"]',
    '[aria-label^="Comment"][contenteditable="true"]',
    // Legacy/alt selectors
    '[data-test-id="issue.activity.comment.editor"] textarea',
    '[data-testid="issue.activity.comment.editor"] textarea',
    'textarea[aria-label="Add a comment"]',
    '[contenteditable="true"][data-testid*="comment"]',
    '[contenteditable="true"]',
  ].join(',');
  return document.querySelector(sel);
}

async function ensureCommentEditor() {
  let editor = findCommentEditor();
  if (editor) return editor;

  // Try to reveal the editor by clicking a likely trigger
  const clickTargets = [
    'button[aria-label="Add a comment"]',
    '[data-testid*="add-comment"][role="button"]',
    '[data-testid*="comment-button"]',
  ];
  for (const s of clickTargets) {
    const btn = document.querySelector(s);
    if (btn) {
      btn.click();
      break;
    }
  }

  // Poll briefly for the editor to mount
  const start = Date.now();
  while (Date.now() - start < 2000) {
    editor = findCommentEditor();
    if (editor) return editor;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

function findTopBar() {
  // Place the button near the issue header area (works in both views)
  return (
    document.querySelector(
      '[data-testid="issue-view"] header, ' +
        '[data-test-id="issue.views.issue-base.foundation.summary.heading"]'
    ) || findIssueContainer()
  );
}

function addButton() {
  if (document.getElementById("ai-jira-draft")) return;

  const container = findTopBar();
  const btn = document.createElement("button");
  btn.id = "ai-jira-draft";
  btn.textContent = "AI draft comment";
  Object.assign(btn.style, {
    margin: "8px",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  });

  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "Drafting...";
    try {
      const d = extractJira();
      const { MY_NAME } = await getStore(["MY_NAME"]);
      const myName = (MY_NAME || "Alex Ivanov").trim();
      // Build thread context
      const nodes = findCommentNodes();
      const latestQuestion = findLatestQuestionForMe(myName);
      const threadPreview = extractCommentsText(nodes, 6).join("\n---\n");
      if (!d.title && !d.description)
        throw new Error(
          "Could not read the issue. Open the issue panel fully and try again."
        );
      const prompt = buildPrompt(d, myName, latestQuestion, threadPreview);
      const resp = await chrome.runtime.sendMessage({
        type: "DRAFT_COMMENT",
        prompt,
      });
      if (!resp.ok) throw new Error(resp.error || "Unknown error");

      const editor = await ensureCommentEditor();
      if (editor?.tagName === "TEXTAREA") {
        editor.value = resp.comment;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        editor.scrollIntoView({ block: "center" });
        editor.focus();
      } else if (editor?.getAttribute?.("contenteditable") === "true") {
        editor.focus();
        // ProseMirror usually accepts insertText. As fallback, replace content.
        const ok = document.execCommand("insertText", false, resp.comment);
        if (!ok) {
          // Fallback for environments where execCommand may be blocked
          try {
            editor.textContent = resp.comment;
          } catch {}
        }
      } else {
        await navigator.clipboard.writeText(resp.comment);
        alert(
          "Draft copied to clipboard (comment editor not found). Paste it manually."
        );
      }
    } catch (e) {
      alert(String(e));
    } finally {
      btn.disabled = false;
      btn.textContent = "AI draft comment";
    }
  };

  // Prefer header; if not found, prepend to container
  container.prepend
    ? container.prepend(btn)
    : container.insertBefore(btn, container.firstChild);
}

// Re-inject on dynamic navigation
const obs = new MutationObserver(() => addButton());
obs.observe(document.documentElement, { childList: true, subtree: true });
addButton();
