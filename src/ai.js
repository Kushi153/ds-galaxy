// Backend API client — all AI runs on the FastAPI server (no browser keys).
// RAVI works fully offline via the curated answers dataset; if the server
// has GEMINI_API_KEY set, it upgrades automatically.

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function req(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API_${res.status}`);
  }
  return res.json();
}

export async function getAnswer(qid) {
  return req(`/api/answer/${qid}`);
}

export async function raviChat(message, history, questionId) {
  const data = await req("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, history, questionId }),
  });
  return data; // { reply, sources }
}

export async function evaluateAnswer(questionId, answer) {
  const data = await req("/api/evaluate", {
    method: "POST",
    body: JSON.stringify({ questionId, answer }),
  });
  return data; // { feedback, verdict, mode, hasModel }
}

export async function health() {
  return req("/api/health");
}
