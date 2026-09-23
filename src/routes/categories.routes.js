import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
const FIELDS = ['icon', 'name_uz', 'name_en', 'name_ru', 'desc_uz', 'desc_en', 'desc_ru']

router.get('/', async (req, res) => {
  const { rows } = await db.execute('SELECT * FROM categories ORDER BY sort_order ASC')
  res.json(rows)
})

router.post('/', requireAdmin, async (req, res) => {
  const { id, sort_order = 0 } = req.body || {}
  const missing = !id || FIELDS.some((f) => !req.body?.[f])
  if (missing) {
    return res.status(400).json({ error: `id va ${FIELDS.join(', ')} maydonlari talab qilinadi` })
  }
  try {
    await db.execute({
      sql: `INSERT INTO categories (id, icon, name_uz, name_en, name_ru, desc_uz, desc_en, desc_ru, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, req.body.icon, req.body.name_uz, req.body.name_en, req.body.name_ru, req.body.desc_uz, req.body.desc_en, req.body.desc_ru, sort_order],
    })
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(409).json({ error: 'Bu id bilan kategoriya allaqachon mavjud' })
  }
})

router.put('/:id', requireAdmin, async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [req.params.id] })
  const existing = rows[0]
  if (!existing) return res.status(404).json({ error: 'Kategoriya topilmadi' })

  const merged = { ...existing, ...req.body }
  await db.execute({
    sql: `UPDATE categories SET icon=?, name_uz=?, name_en=?, name_ru=?, desc_uz=?, desc_en=?, desc_ru=?, sort_order=? WHERE id=?`,
    args: [merged.icon, merged.name_uz, merged.name_en, merged.name_ru, merged.desc_uz, merged.desc_en, merged.desc_ru, merged.sort_order, req.params.id],
  })
  res.json({ ok: true })
})

router.delete('/:id', requireAdmin, async (req, res) => {
  await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [req.params.id] })
  res.json({ ok: true })
})

export default router
