import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

const getContent = (key) => {
  const row = db.prepare('SELECT value FROM site_content WHERE key = ?').get(key)
  return row ? JSON.parse(row.value) : null
}

const setContent = (key, value) => {
  db.prepare(
    `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, JSON.stringify(value))
}

// Public — anyone visiting the site can read this
router.get('/about', (req, res) => res.json(getContent('about')))
router.get('/contact', (req, res) => res.json(getContent('contact')))

// Admin-only — this is the only way this data changes now, no code edits needed
router.put('/about', requireAdmin, (req, res) => {
  setContent('about', req.body)
  res.json({ ok: true })
})

router.put('/contact', requireAdmin, (req, res) => {
  setContent('contact', req.body)
  res.json({ ok: true })
})

export default router
