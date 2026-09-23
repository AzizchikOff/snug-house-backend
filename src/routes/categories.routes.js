import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
const FIELDS = ['icon', 'name_uz', 'name_en', 'name_ru', 'desc_uz', 'desc_en', 'desc_ru']

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all()
  res.json(rows)
})

router.post('/', requireAdmin, (req, res) => {
  const { id, sort_order = 0 } = req.body || {}
  const missing = !id || FIELDS.some((f) => !req.body?.[f])
  if (missing) {
    return res.status(400).json({ error: `id va ${FIELDS.join(', ')} maydonlari talab qilinadi` })
  }
  try {
    db.prepare(
      `INSERT INTO categories (id, icon, name_uz, name_en, name_ru, desc_uz, desc_en, desc_ru, sort_order)
       VALUES (@id, @icon, @name_uz, @name_en, @name_ru, @desc_uz, @desc_en, @desc_ru, @sort_order)`
    ).run({ id, sort_order, ...Object.fromEntries(FIELDS.map((f) => [f, req.body[f]])) })
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(409).json({ error: 'Bu id bilan kategoriya allaqachon mavjud' })
  }
})

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Kategoriya topilmadi' })

  const merged = { ...existing, ...req.body, id: req.params.id }
  db.prepare(
    `UPDATE categories SET icon=@icon, name_uz=@name_uz, name_en=@name_en, name_ru=@name_ru,
     desc_uz=@desc_uz, desc_en=@desc_en, desc_ru=@desc_ru, sort_order=@sort_order WHERE id=@id`
  ).run(merged)
  res.json({ ok: true })
})

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
