// Endpoint demo (Vercel Function): menerima laporan lapangan dan mengembalikan { ok, serverId }.
// Tidak menyimpan apa pun; hanya memvalidasi dan mengakui.
import { tanganiSinkron } from '../src/lib/syncServer.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Gunakan POST' })
  }
  const { status, json } = tanganiSinkron(req.body)
  return res.status(status).json(json)
}
