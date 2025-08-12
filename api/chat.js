// api/chat.js — Vercel Serverless Function (Node 18+ has fetch built in)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { message } = req.body || {};
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Missing message' });

    // Facts kept server-side (short + relevant)
    const FACTS = `
Name: Vimal Ramakrishnan
Summary: Experienced project/AI product leader integrating AI into products and workflows.
Core: GenAI, RAG, agents (Hugging Face, LangChain), n8n automations; Python, SQL; delivery & stakeholder mgmt.
Experience:
- Mu Sigma: Analytics Consultant → Apprentice Leader/Delivery Head (4 yrs). Managed 22 data scientists. Clients: Suncorp (AU), Nike (US/EU), Microsoft (US), AbbVie (Pharma).
- TravelTriangle: Senior Data Scientist (growth/product analytics, experimentation).
- IE University: MBA + MS; later Senior Associate Director.
- Payflow: Head of Data (3 months).
- Founder: AI consultancy building agentic workflows and RAG automations.
Recent: Returned to India for a family emergency; last 2 yrs building AI/RAG/agents with HF/LangChain/n8n.
Work authorization: India; EU Blue Card; open to sponsorship where needed.
Relocation: Anywhere in Europe, Bengaluru, Dubai. Notice: Immediate.
Target roles: AI Product Manager / AI Solutions Lead / GenAI Engineer (RAG/Agents); managerial roles in AI.
Preferred tone: warm, a touch of humor, but professional.
    `.trim();

    const system = `
You are Vimal Ramakrishnan's AI assistant. Speak in FIRST PERSON as Vimal.
Keep it concise (2–5 sentences), warm, a little humorous but professional.
Use ONLY the FACTS. If a detail isn't in FACTS, say you'll follow up.

FACTS:
${FACTS}
`.trim();

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
    if (!resp.ok) return res.status(resp.status).json(json);

    const answer = (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content || '').trim();

    // ✅ Always return a string
    return res.status(200).json({ answer: answer || 'I’ll follow up with details shortly.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
};
