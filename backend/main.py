"""DS Galaxy backend — RAVI assistant + Q&A + answer evaluation.

Runs fully offline by default: RAVI answers questions using the curated
answers dataset with TF-IDF retrieval. If GEMINI_API_KEY is set in the
environment (server-side only, never shipped to the browser), RAVI
upgrades to Gemini-powered answers and feedback.
"""
from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA = BASE_DIR / "src" / "data"

MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

app = FastAPI(title="DS Galaxy API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev server; tighten for production deploy
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------- data


def _load_answers() -> dict[str, str]:
    answers: dict[str, str] = {}
    for name in ("answers-core.json", "answers-ai.json"):
        with open(DATA / name, encoding="utf-8") as f:
            answers.update(json.load(f))
    return answers


ANSWERS = _load_answers()

with open(DATA / "questions.json", encoding="utf-8") as f:
    BANK = json.load(f)

# Flat index: id -> {question, section, note, refLink}
QINDEX: dict[str, dict] = {}
for s in BANK["sections"]:
    for q in s["questions"]:
        QINDEX[q["id"]] = {
            "id": q["id"],
            "text": q["text"],
            "section": s["title"],
            "num": q.get("num"),
            "note": q.get("note"),
            "refLink": q.get("refLink"),
        }

# ------------------------------------------------- concept knowledge base


def _load_kb() -> list[dict]:
    entries: list[dict] = []
    here = Path(__file__).resolve().parent
    for name in ("kb-ds.json", "kb-ai.json", "kb-umbrella.json", "kb-fill.json", "kb-fill2.json"):
        with open(here / name, encoding="utf-8") as f:
            entries.extend(json.load(f))
    for e in entries:
        e["_kw"] = [k.lower() for k in e["kw"]]
    return entries


KB = _load_kb()

with open(Path(__file__).resolve().parent / "kb-hr.json", encoding="utf-8") as f:
    HR_FRAMEWORKS = json.load(f)["frameworks"]

BEHAVIORAL_SECTIONS = (
    "hr interview", "behavioral", "project-based", "business case",
    "senior-level", "production ml scenarios",
)

STAR_GUIDE = (
    "This is an experience question — the interviewer wants a real story from your "
    "work or projects, not a theory lecture. Build your answer with STAR: "
    "Situation — one sentence of context (the project, the team, the stakes). "
    "Task — what YOU were responsible for. "
    "Action — three or four concrete steps you took and why (this is 60% of the answer). "
    "Result — the measurable outcome, plus what you learned. "
    "Pick a real example, write these four beats as bullet notes, then practice saying "
    "it out loud in under 90 seconds."
)


def _stem(tok: str) -> str:
    """Cheap suffix stripper so 'pythons' ~ 'python', 'features' ~ 'feature'."""
    for suf in ("ies", "es", "s"):
        if len(tok) > 4 and tok.endswith(suf):
            return tok[: -len(suf)] if suf != "s" else tok[:-1]
    if len(tok) > 4 and tok.endswith("ing"):
        return tok[:-3]
    return tok


def _kb_match(text: str, threshold: float = 1.0) -> Optional[dict]:
    """Best KB concept for free text. Longer (more specific) keywords score more.
    Multi-word keywords match word-by-word with light stemming, so phrasing
    differences ('pythons main features' vs 'python main feature') still hit."""
    toks = [_stem(t) for t in re.findall(r"[a-z0-9]+", text.lower())]
    tokset = set(toks)
    best, best_sc = None, 0.0
    for e in KB:
        sc = 0.0
        for kw in e["_kw"]:
            kw_toks = [_stem(t) for t in kw.split()]
            if len(kw_toks) > 1:
                hits = sum(1 for kt in kw_toks if kt in tokset)
                if hits == len(kw_toks):
                    sc += 2.0 + min(2.0, len(kw) / 10.0)
                elif hits >= 2 and hits == len(kw_toks) - 1:
                    sc += 1.2  # near-match phrase
            else:
                if kw_toks[0] in tokset:
                    sc += 1.0
        if sc > best_sc:
            best, best_sc = e, sc
    return best if best_sc >= threshold else None


def _hr_framework(text: str, section: str) -> Optional[dict]:
    """HR framework matched by keywords; HR Interview section gets a fallback."""
    low = text.lower()
    best, best_sc = None, 0
    for f in HR_FRAMEWORKS:
        sc = sum(2 for kw in f["kw"] if kw in low)
        if sc > best_sc:
            best, best_sc = f, sc
    if best:
        return best
    if "hr interview" in section.lower():
        return HR_FRAMEWORKS[0]  # Present-Past-Future as the general HR shape
    return None


@lru_cache(maxsize=4096)
def _resolve_answer(qid: str) -> tuple[Optional[str], str]:
    """Best available answer for a question id.
    Order: curated dataset > concept KB > HR framework > STAR guide > closest notes."""
    item = QINDEX.get(qid)
    if not item:
        return None, "none"
    text, section = item["text"], item["section"]
    if qid in ANSWERS:
        return ANSWERS[qid], "curated"
    hr = _hr_framework(text, section)
    if hr:
        return (
            hr["guide"]
            + "\n\nThis one has no single correct answer — it tests how you present "
            "YOUR story. Build yours on this framework with a real example from your "
            "own projects, and practice saying it out loud once.",
            "framework:" + hr["name"],
        )
    kb = _kb_match(text + " " + section)
    if kb:
        return kb["a"], "kb:" + kb["k"]
    if any(s in section.lower() for s in BEHAVIORAL_SECTIONS):
        return STAR_GUIDE, "star"
    if item.get("note"):
        return item["note"] + "\n\n(Full explanation: open the reference link on the question card.)", "note"
    return None, "none"


def _closest_notes(text: str, k: int = 3) -> list[dict]:
    """Related bank questions that DO have a resolvable answer."""
    out = []
    for h in search(text, k=k + 2):
        a, src = _resolve_answer(h["id"])
        if a and not src.startswith("framework") and src != "star":
            out.append({"id": h["id"], "text": h["text"], "section": h["section"],
                        "answer": a, "score": h["score"]})
        if len(out) >= k:
            break
    return out

STOP = set(
    """a an and are as at be by for from has have how i in is it its of on or
    that the this to was what when where which who why will with vs do does
    did not you your we they he she can could should would about into over
    between more most other some such only own same than too very""".split()
)

TOKEN_RE = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> list[str]:
    return [t for t in TOKEN_RE.findall(text.lower()) if t not in STOP and len(t) > 1]


# ------------------------------------------------------------- schemas


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    questionId: Optional[str] = None


class EvaluateRequest(BaseModel):
    questionId: str
    answer: str


class ChatReply(BaseModel):
    reply: str
    sources: list[dict] = []


# ------------------------------------------------------------ retrieval


@lru_cache(maxsize=1)
def _corpus():
    """Weighted token corpus: question text counts 3x so query terms that
    match the question itself outrank incidental matches inside answers."""
    docs: list[str] = []
    tokens: list[list[str]] = []
    df: dict[str, float] = {}
    for qid, item in QINDEX.items():
        q_toks = tokenize(item["text"]) * 3
        s_toks = tokenize(item["section"])
        a_toks = tokenize(ANSWERS.get(qid, ""))
        toks = q_toks + s_toks + a_toks
        docs.append(qid)
        tokens.append(toks)
        for t in set(toks):
            df[t] = df.get(t, 0) + 1
    n = len(docs)
    idf = {t: (1.0 + n / (1.0 + c)) for t, c in df.items()}
    return docs, tokens, idf


def _score(query_tokens: list[str], doc_tokens: list[str], idf: dict[str, float]) -> float:
    if not doc_tokens:
        return 0.0
    tf: dict[str, int] = {}
    for t in doc_tokens:
        tf[t] = tf.get(t, 0) + 1
    s = 0.0
    for t in query_tokens:
        if t in tf:
            s += tf[t] * idf.get(t, 1.0)
    norm = 1.0 + len(doc_tokens) ** 0.5 / 40.0
    return s / norm


def search(query: str, k: int = 5) -> list[dict]:
    qt = tokenize(query)
    if not qt:
        return []
    ql = query.lower()
    docs, toks, idf = _corpus()
    scored = sorted(
        ((qid, _score(qt, dt, idf)) for qid, dt in zip(docs, toks)),
        key=lambda x: -x[1],
    )
    hits = []
    for qid, sc in scored[: k * 2]:
        if sc <= 0:
            break
        item = QINDEX[qid]
        # Strong phrase bonus: question text appears verbatim in the query
        qtext = item["text"].lower().rstrip("?")
        if len(qtext) > 12 and (qtext in ql or ql in qtext):
            sc *= 3.0
        elif all(w in ql for w in item["text"].lower().split()[:4]):
            sc *= 1.5
        # Query-coverage boost: hits whose QUESTION text contains the query
        # terms outrank ones that only matched inside an answer body — this is
        # what stops 'p value' from ranking 'Expected value' first. Raw words
        # (single letters kept, stopwords dropped) so 'p-value' matches 'p value'.
        qw = {w for w in re.findall(r"[a-z0-9]+", ql) if w not in STOP}
        tw = {
            w[:-1] if len(w) > 3 and w.endswith("s") else w
            for w in re.findall(r"[a-z0-9]+", item["text"].lower())
            if w not in STOP
        }
        qw = {w[:-1] if len(w) > 3 and w.endswith("s") else w for w in qw}
        cov = len(qw & tw) / max(1, len(qw))
        sc *= 0.4 + 1.6 * cov
        hits.append(
            {
                "id": qid,
                "text": item["text"],
                "section": item["section"],
                "hasAnswer": qid in ANSWERS,
                "score": round(sc, 3),
            }
        )
    hits.sort(key=lambda h: -h["score"])
    return hits[:k]


# ------------------------------------------------------------ optional LLM


def _gemini(system: str, contents: list[dict], temperature: float = 0.6) -> str:
    if not GEMINI_KEY:
        raise RuntimeError("no server key")
    import urllib.request

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_KEY}"
    body = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": {"temperature": temperature, "maxOutputTokens": 1024},
    }
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        data = json.loads(r.read().decode())
    text = "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"])
    if not text:
        raise RuntimeError("empty")
    return text


# --------------------------------------------------------------- routes


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "questions": len(QINDEX),
        "answers": len(ANSWERS),
        "kb": len(KB),
        "ai": bool(GEMINI_KEY),
    }


@app.get("/api/answer/{qid}")
def get_answer(qid: str):
    item = QINDEX.get(qid)
    if not item:
        raise HTTPException(404, "unknown question id")
    answer, source = _resolve_answer(qid)
    if not answer:
        notes = _closest_notes(item["text"])
        if notes:
            bullets = "\n".join(
                f"• {n['text'].rstrip('?')} — {n['answer'].split('.')[0]}"
                for n in notes
            )
            answer = (
                "I do not have a dedicated note for this exact phrasing yet, but these "
                "are the closest concepts interviewers connect to it:\n\n" + bullets +
                "\n\nOpen any of them below — and if you tell me the specific part that "
                "puzzles you, I will break it down from first principles."
            )
            source = "closest"
    related = search(item["text"], k=4)
    return {
        "id": qid,
        "question": item["text"],
        "section": item["section"],
        "note": item.get("note"),
        "refLink": item.get("refLink"),
        "answer": answer,
        "source": source,
        "related": [h for h in related if h["id"] != qid][:3],
    }


@app.post("/api/chat", response_model=ChatReply)
def chat(req: ChatRequest):
    msg = req.message.strip()
    if not msg:
        raise HTTPException(400, "empty message")

    hits = search(msg, k=3)

    # Small talk & suggestion-chip intents (work with or without LLM)
    intent = _classify_intent(msg, req.questionId)
    if intent:
        return intent

    # KB-first: does the message itself name a concept I can teach?
    kb_direct = _kb_match(msg)
    top = hits[0] if hits else None
    direct = top and top["score"] >= 25

    # If the message clearly names a banked question, teach its resolved answer
    teach = None
    teach_src = ""
    if kb_direct and (not direct or (top and not top["hasAnswer"])):
        teach = kb_direct["a"]
        teach_src = "kb:" + kb_direct["k"]
    elif top:
        a, s = _resolve_answer(top["id"])
        if a:
            teach, teach_src = a, s
        elif kb_direct:
            teach, teach_src = kb_direct["a"], "kb:" + kb_direct["k"]

    if teach:
        if teach_src.startswith("framework"):
            opener = "Good one — this is a personal question, so here is the framework top performers use:"
        elif teach_src.startswith("kb"):
            opener = "Great question! Let me explain it clearly:"
        elif teach_src == "star":
            opener = "This one is about YOUR story — here is how to structure it:"
        else:
            opener = f"Great question! Here is the clear way to think about {top['text'].rstrip('?')}:"
        parts = [opener, teach]
        parts.append(
            "Want me to explain it more simply, give another example, or show how to say it "
            "in an interview? Just ask."
        )
        if hits[1:3]:
            rel = " · ".join(f'({h["section"]}) {h["text"]}' for h in hits[1:3])
            parts.append(f"Related in the bank: {rel}")
        return ChatReply(reply="\n\n".join(parts), sources=hits)

    # Nothing conclusive: teach the closest notes directly in the chat
    notes = _closest_notes(msg)
    if notes:
        parts = [
            "That exact phrasing is not in my notes, but here are the concepts interviewers "
            "connect to it — and how each works:",
        ]
        for n in notes[:3]:
            parts.append(f"**{n['text'].rstrip('?')}** — {n['answer']}")
        parts.append(
            "If you tell me which angle you meant, I will go deeper on that one."
        )
        return ChatReply(reply="\n\n".join(parts), sources=[
            {"id": n["id"], "text": n["text"], "section": n["section"],
             "hasAnswer": True, "score": n["score"]} for n in notes
        ])

    # Server-side LLM path (no key ever touches the browser)
    if GEMINI_KEY:
        ctx_items = []
        for h in hits:
            ans = ANSWERS.get(h["id"], "(no curated answer)")
            ctx_items.append(f'[{h["id"]}] ({h["section"]}) {h["text"]}\n{ans}')
        cur = QINDEX.get(req.questionId or "")
        cur_line = (
            f'The user is currently viewing question [{cur["id"]}] from {cur["section"]}: "{cur["text"]}".'
            if cur
            else "The user is browsing the galaxy with no specific question open."
        )
        system = (
            "You are RAVI, the warm, encouraging teacher inside DS Galaxy, a 3D interview-prep "
            "site for Data Science and AI Engineering. You talk like a friendly senior mentor: "
            "simple words first, a short analogy or example when helpful, praise effort, and "
            "never make the student feel small for asking. Keep replies under 200 words in "
            "short paragraphs, and end with a gentle nudge offering to go deeper, give an "
            "example, or show how to say it in an interview. Ground factual claims on the "
            "knowledge base entries when relevant; if they lack the answer, teach from general "
            "knowledge.\n\n"
            f"{cur_line}\n\nKnowledge base entries:\n" + "\n\n".join(ctx_items or ["(none found)"])
        )
        contents = [{"role": "user" if m.role == "user" else "model", "parts": [{"text": m.content}]}
                    for m in req.history[-12:]]
        contents.append({"role": "user", "parts": [{"text": msg}]})
        try:
            reply = _gemini(system, contents)
            return ChatReply(reply=reply, sources=hits)
        except Exception:
            pass  # fall through to offline mode

    return ChatReply(
        reply=(
            "Hmm, I could not pin that one down. No worries — try rephrasing with the key "
            "term (like 'p-value', 'KV cache', or 'RAG chunking'), or open a topic planet "
            "and ask me right from there. We will get it."
        ),
        sources=[],
    )


def _classify_intent(msg: str, question_id: Optional[str]) -> Optional[ChatReply]:
    """Small talk + the three suggestion chips, answered like a friendly teacher."""
    low = msg.lower().strip()
    cur = QINDEX.get(question_id or "")

    if re.match(r"^(hi+|hii+|hello+|hey+|namaste|good\s*(morning|afternoon|evening))\b", low):
        anchor = (
            f" I see you have '{cur['text']}' open — want to start there?"
            if cur
            else " Open any planet that catches your eye and ask away."
        )
        return ChatReply(
            reply=(
                "Hello! RAVI here, your study buddy for this galaxy."
                + anchor
                + " Or just type any doubt — big or small, all questions are welcome."
            ),
            sources=[],
        )
    if re.search(r"\b(thanks?|thankyou|thank you|tq)\b", low):
        return ChatReply(
            reply=(
                "You are very welcome! Keep the doubts coming — every question you ask now "
                "is one less surprise in the interview room."
            ),
            sources=[],
        )
    if re.search(r"\b(bye|goodbye|good night|see you)\b", low):
        return ChatReply(
            reply="All the best for your preparation! Come back anytime a doubt pops up — I will be right here.",
            sources=[],
        )

    # Suggestion-chip intents, anchored to the currently open question
    if cur:
        qid = cur["id"]
        answer = ANSWERS.get(qid, "")
        title = cur["text"].rstrip("?")
        src = [{"id": qid, "text": cur["text"], "section": cur["section"], "hasAnswer": bool(answer), "score": 0}]
        if re.search(r"\b(simply|simpler|simple words|eli5|easy)\b", low) and answer:
            sentences = re.split(r"(?<=[.!?])\s+", answer)
            core = " ".join(sentences[:2])
            return ChatReply(
                reply=(
                    f"Sure! {title}, in simple words:\n\n{core}\n\nThat is the core idea — "
                    "everything else is detail on top of it. Shall I build it up one level deeper?"
                ),
                sources=src,
            )
        if re.search(r"\b(example|for instance)\b", low) and answer:
            m = re.search(
                r"([^.?!]*\b(?:for example|such as|e\.g\.|like|use[dr]? (?:for|in|when))\b[^.?!]*[.?!])",
                answer,
                re.I,
            )
            if m:
                return ChatReply(
                    reply=(
                        f"Here is a concrete example for {title}:\n\n{m.group(1).strip()}\n\n"
                        "Examples make answers stick in interviews — keep one ready for every concept."
                    ),
                    sources=src,
                )
            sentences = re.split(r"(?<=[.!?])\s+", answer)
            return ChatReply(
                reply=(
                    f"For {title}, think of it this way: {sentences[0] if sentences else answer} "
                    "Picture a real dataset where that plays out — walking through one concrete "
                    "case out loud is the best practice."
                ),
                sources=src,
            )
        if (
            re.search(r"\b(interview|in an interview|how to (say|answer))\b", low)
            and answer
        ):
            sentences = re.split(r"(?<=[.!?])\s+", answer)
            tight = " ".join(sentences[:2])
            return ChatReply(
                reply=(
                    f"In an interview, keep {title} to 30-45 seconds: definition first, two or "
                    f"three key points, then one example. A tight version you can adapt:\n\n{tight}\n\n"
                    "Say it out loud once now — your future self in the interview room will thank you."
                ),
                sources=src,
            )
    return None


@app.post("/api/evaluate")
def evaluate(req: EvaluateRequest):
    item = QINDEX.get(req.questionId)
    if not item:
        raise HTTPException(404, "unknown question id")
    answer = req.answer.strip()
    if len(answer) < 10:
        raise HTTPException(400, "answer too short to evaluate")

    model_answer, model_src = _resolve_answer(req.questionId)

    # Server-side LLM path: real coaching
    if GEMINI_KEY:
        system = (
            "You are RAVI, an expert interview coach for Data Science and AI Engineering roles. "
            "Evaluate the candidate's answer honestly and constructively. For behavioral/project "
            "questions check STAR coverage (Situation, Task, Action, Result); for technical "
            "questions check correctness, completeness, and clarity. Reference the model answer "
            "when provided. Reply with: 2-4 sentences of feedback, then a final line exactly like "
            "VERDICT: good|partial|wrong."
        )
        model_line = f"\n\nReference model answer:\n{model_answer}" if model_answer else ""
        user = f'Question ({item["section"]}): {item["text"]}\n\nCandidate answer:\n{answer}{model_line}'
        try:
            raw = _gemini(system, [{"role": "user", "parts": [{"text": user}]}], temperature=0.3)
            m = re.search(r"VERDICT:\s*(good|partial|wrong)", raw, re.I)
            verdict = m.group(1).lower() if m else "partial"
            feedback = re.sub(r"VERDICT:.*$", "", raw, flags=re.I).strip()
            return {"feedback": feedback, "verdict": verdict, "mode": "ai", "hasModel": bool(model_answer)}
        except Exception:
            pass  # fall through to offline

    # Offline evaluation against the resolved reference answer
    if not model_answer:
        return {
            "feedback": (
                "That one is still beyond my notes — but your answer got real structure "
                "practice in, and that counts. Try rephrasing your answer with a clear "
                "definition, the mechanism, and one example, then ask me again."
            ),
            "verdict": "partial",
            "mode": "structure",
            "hasModel": False,
        }

    if model_src.startswith("framework") or model_src == "star":
        low = answer.lower()
        has_s = bool(re.search(r"\b(project|team|company|internship|college|during|when i)\b", low))
        has_t = bool(re.search(r"\b(my (role|task|job|responsibility)|i was (asked|responsible)|needed to|i had to)\b", low))
        has_a = bool(re.search(r"\b(i (built|created|wrote|designed|led|organized|analyzed|cleaned|implemented|proposed|negotiated|debugged|migrated|handled))\b", low))
        has_r = bool(re.search(r"\b(result|outcome|improved|reduced|increased|saved|achieved|learned|\d+%|\d+ hours|\d+ users)\b", low))
        parts = ["Here is how your story reads against the STAR structure:"]
        if has_s: parts.append("Situation: set — I could picture the context.")
        else: parts.append("Situation: missing — open with one line of context (project, team, stakes).")
        if has_t: parts.append("Task: present — your responsibility is clear.")
        else: parts.append("Task: unclear — state what YOU were responsible for.")
        if has_a: parts.append("Action: strong — concrete verbs show what you did.")
        else: parts.append("Action: thin — use concrete 'I built / I analyzed / I led' verbs.")
        if has_r: parts.append("Result: visible — numbers and outcomes land well.")
        else: parts.append("Result: missing — close with the outcome, ideally with a number.")
        n_star = sum([has_s, has_t, has_a, has_r])
        verdict = "good" if n_star >= 3 else "partial" if n_star >= 2 else "wrong"
        parts.append("The framework guide on the right shows the full shape — fill the missing beats and this story will shine.")
        return {"feedback": " ".join(parts), "verdict": verdict, "mode": "star", "hasModel": True}

    qt = set(tokenize(item["text"] + " " + model_answer))
    at = set(tokenize(answer))
    overlap = len(qt & at) / max(1, len(qt))
    length_ok = len(answer.split()) >= 30
    has_example = bool(re.search(r"\b(for example|e\.g\.|such as|like|use case|instance)\b", answer, re.I))
    has_structure = len(answer.split(". ")) >= 3 or "\n" in answer

    if overlap >= 0.28 and length_ok and has_structure:
        verdict = "good"
    elif overlap >= 0.12 or length_ok:
        verdict = "partial"
    else:
        verdict = "wrong"

    bits = []
    if verdict == "good":
        bits.append("Solid answer — it covers the key concepts and reads with structure.")
    else:
        bits.append("Here is how your answer compares to the model answer.")
    if not length_ok:
        bits.append("Add more depth: aim for at least 2-3 sentences with the mechanism, not just the definition.")
    if not has_structure:
        bits.append("Structure helps: define first, then explain how/why, then give an example or trade-off.")
    if not has_example:
        bits.append("A concrete example or use case would make it land better in an interview.")
    if verdict != "good" and not model_src.startswith("framework") and model_src != "star":
        bits.append("Model answer for comparison is on the right side of this panel.")
    feedback = " ".join(bits)

    return {"feedback": feedback, "verdict": verdict, "mode": "heuristic", "hasModel": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
