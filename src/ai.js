// Backend API client — all AI runs on the FastAPI server (no browser keys).
// RAVI works fully offline via the curated answers dataset; if the server
// has GEMINI_API_KEY set, it upgrades automatically.

// Production-aware API base. The live site (ds-galaxy-1.onrender.com) is a
// static Vite build; it calls the backend service (ds-galaxy.onrender.com)
// directly — CORS is open on the backend. Locally it stays on :8000.
const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://ds-galaxy.onrender.com" : "http://127.0.0.1:8000");

async function req(path, options = {}) {
  // Free-tier hosting (Render) spins down when idle; the first call after a
  // nap can take ~40s. Surface a friendly notice instead of dead silence.
  const ctrl = new AbortController();
  const kill = setTimeout(() => ctrl.abort(), 60000);
  const wake = setTimeout(
    () => window.dispatchEvent(new CustomEvent("api-slow")),
    9000
  );
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `API_${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(kill);
    clearTimeout(wake);
  }
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
