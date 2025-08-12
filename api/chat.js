// api/chat.js — Vercel Serverless Function (CommonJS)
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args)).catch(()=>global.fetch(...args));

function bioToFacts(bio = {}) {
  const lines = [];
  lines.push(`Name: ${bio.name || "N/A"}`);
  lines.push(`Headline: ${bio.headline || "N/A"}`);
  lines.push(`Location: ${bio.location || "N/A"}`);
  lines.push(`Work authorization: ${bio.workAuth || "N/A"}`);
  lines.push(`Relocation: ${bio.relocation || "N/A"}`);
  lines.push(`Notice: ${bio.notice || "N/A"}`);
  lines.push(`Target roles: ${bio.roles || "N/A"}`);
  if (bio.gapNote) lines.push(`Gap explanation: ${bio.gapNote}`);
  if (Array.isArray(bio.highlights) && bio.highlights.length) {
    lines.push("Highlights:");
    bio.highlights.forEach((h, i) => lines.push(`  - ${h}`));
  }
  if (Array.isArray(bio.experience) && bio.experience.length) {
    lines.push("Experience:");
    bio.experience.forEach((x) => {
      const clients = x.clients && x.clients.length ? ` | Clients: ${x.clients.join(", ")}` : "";
      lines.push(`  - ${x.company} — ${x.role} (${x.duration}) | ${x.scope || ""}${clients}`);
    });
  }
  return lines.join("\n");
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { message, bio } = req.body || {};
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const facts = bioToFacts(bio);

    const system = `
You are ${bio?.name || "the candidate"}’s AI assistant. Answer in FIRST PERSON as the candidate.
Be concise (2–5 sentences), professional, and helpful. Use ONLY the facts provided below.
If a detail isn't present, state you'll follow up. Avoid sharing private data not in facts.

FACTS:\n${facts}

Answering rules:
- “Why the gap?” → explain the India family emergency + continued AI/RAG/agents work (Hugging Face, LangChain, n8n).
- “Visa/work authorization?” → use Work authorization + Relocation lines.
- Prefer concrete outcomes (engagement lift, conversion/CAC improvements) when asked about impact.
- For role fit questions, tie back to target roles & strengths.
`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 220,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: message }
        ]
      })
    });

    const json = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json(json);
    }

    const answer = json.choices?.[0]?.message?.content?.trim() || 'Sorry, I have no answer.';
    return res.status(200).json({ answer });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
};
