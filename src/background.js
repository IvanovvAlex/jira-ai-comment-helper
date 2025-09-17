async function getStore(keys) {
  return await new Promise((res) => chrome.storage.sync.get(keys, res));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function draftComment(prompt) {
  const { OPENAI_KEY, MODEL } = await getStore(["OPENAI_KEY", "MODEL"]);
  if (!OPENAI_KEY) throw new Error("Missing OpenAI key in Options.");
  const model = MODEL || "gpt-5";

  const body = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You write Jira comments exactly like a thoughtful human teammate who has personally reviewed the ticket. Use first person (\"I\"). Be natural, concise, and specific. Offer concrete, actionable suggestions and next steps. Prefer short bullets where helpful. Do not include any AI disclaimers, meta commentary, or restating the instructions. No prefaces like 'Here is'—return only the comment text.",
      },
      { role: "user", content: prompt },
    ],
  };

  // Small retry for rate limiting
  let attempt = 0;
  let res;
  while (true) {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (res.status !== 429 || attempt >= 1) break; // retry once on 429
    const retryAfter = Number(res.headers.get("retry-after")) || 2;
    await sleep(Math.max(1, retryAfter) * 1000);
    attempt++;
  }

  if (!res.ok) {
    const txt = await res.text();
    // Friendlier errors for common cases:
    if (res.status === 401)
      throw new Error("Unauthorized: check your API key.");
    if (res.status === 403)
      throw new Error("Forbidden: your key may not have access to this model.");
    if (res.status === 404)
      throw new Error(
        "Model not found: verify the model name (e.g., gpt-5) and access."
      );
    if (res.status === 429) {
      // Build a more helpful message with RL headers
      const hdr = (k) => res.headers.get(k) || "";
      const limitReq = hdr("x-ratelimit-limit-requests");
      const remReq = hdr("x-ratelimit-remaining-requests");
      const resetReq = hdr("x-ratelimit-reset-requests");
      const limitTok = hdr("x-ratelimit-limit-tokens");
      const remTok = hdr("x-ratelimit-remaining-tokens");
      const resetTok = hdr("x-ratelimit-reset-tokens");
      const retryAfter = hdr("retry-after");
      const detail = [
        retryAfter && `retry in ~${retryAfter}s`,
        limitReq && `requests/min: ${remReq || 0}/${limitReq}`,
        limitTok && `tokens/min: ${remTok || 0}/${limitTok}`,
        resetReq && `reset req in ${resetReq}s`,
        resetTok && `reset tok in ${resetTok}s`,
      ]
        .filter(Boolean)
        .join("; ");

      throw new Error(
        `Rate limit or quota exceeded${detail ? ` — ${detail}` : ""}.`
      );
    }
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// Listen for requests from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return; // not our message

  if (msg.type === "DRAFT_COMMENT") {
    (async () => {
      try {
        const comment = await draftComment(msg.prompt || "");
        sendResponse({ ok: true, comment });
      } catch (e) {
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    return true; // keep the message channel open for async response
  }
});
