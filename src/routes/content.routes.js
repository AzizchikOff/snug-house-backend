import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()

const getContent = async (key) => {
  const { rows } = await db.execute({ sql: 'SELECT value FROM site_content WHERE key = ?', args: [key] })
  return rows[0] ? JSON.parse(rows[0].value) : null
}

const setContent = async (key, value) => {
  await db.execute({
    sql: `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [key, JSON.stringify(value)],
  })
}

// Public — anyone visiting the site can read this
router.get('/about', asyncHandler(async (req, res) => res.json(await getContent('about'))))
router.get('/contact', asyncHandler(async (req, res) => res.json(await getContent('contact'))))

// Admin-only — this is the only way this data changes now, no code edits needed
router.put('/about', requireAdmin, asyncHandler(async (req, res) => {
  await setContent('about', req.body)
  res.json({ ok: true })
}))

router.put('/contact', requireAdmin, asyncHandler(async (req, res) => {
  await setContent('contact', req.body)
  res.json({ ok: true })
}))

export default router
