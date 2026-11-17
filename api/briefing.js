// Vercel Function: briefing situasi dari Gemini. Kunci API hanya dibaca dari environment variable.
import { tanganiBriefing } from '../src/lib/gemini.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'metode' }) }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'anon'
  const { status, json } = await tanganiBriefing(req.body, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, ip })
  return res.status(status).json(json)
}
