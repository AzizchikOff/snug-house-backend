import { Router } from 'express'
import multer from 'multer'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Faqat rasm fayl yuklash mumkin'))
    cb(null, true)
  },
})

const router = Router()
const FIELDS = ['name', 'code', 'color', 'size', 'price', 'moq', 'lead_time', 'material', 'description']

// Public — list every product, without the (large) image bytes
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.execute(`
    SELECT id, name, code, color, size, price, moq, lead_time, material, description, sort_order,
           (image IS NOT NULL) AS has_image
    FROM products ORDER BY sort_order ASC
  `)
  res.json(rows)
}))

// Public — streams one product's photo
router.get('/:id/image', asyncHandler(async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT image FROM products WHERE id = ?', args: [req.params.id] })
  if (!rows[0]?.image) return res.status(404).end()
  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.send(Buffer.from(rows[0].image))
}))

// Admin — create. Multipart: text fields + optional "image" file.
router.post('/', requireAdmin, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message })
      const { id, sort_order = 0 } = req.body || {}
      if (!id || !req.body?.name) return res.status(400).json({ error: 'id va name talab qilinadi' })

      const cols = ['id', 'sort_order', ...FIELDS]
      const vals = [id, sort_order, ...FIELDS.map((f) => req.body[f] || '')]
      if (req.file) {
        cols.push('image')
        vals.push(req.file.buffer)
      }
      await db.execute({
        sql: `INSERT INTO products (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
        args: vals,
      })
      res.status(201).json({ ok: true })
    } catch (dbErr) {
      if (String(dbErr.message).includes('UNIQUE')) {
        return res.status(409).json({ error: 'Bu id bilan mahsulot allaqachon mavjud' })
      }
      next(dbErr)
    }
  })
})

// Admin — update. Same shape; image only replaced if a new file is sent.
router.put('/:id', requireAdmin, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message })
      const { rows } = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [req.params.id] })
      const existing = rows[0]
      if (!existing) return res.status(404).json({ error: 'Mahsulot topilmadi' })

      const merged = { ...existing, ...req.body }
      const cols = ['name', 'code', 'color', 'size', 'price', 'moq', 'lead_time', 'material', 'description', 'sort_order']
      const setSql = cols.map((c) => `${c} = ?`).join(', ')
      const vals = cols.map((c) => merged[c])

      let sql = `UPDATE products SET ${setSql}`
      if (req.file) sql += ', image = ?'
      sql += ' WHERE id = ?'
      const args = req.file ? [...vals, req.file.buffer, req.params.id] : [...vals, req.params.id]

      await db.execute({ sql, args })
      res.json({ ok: true })
    } catch (dbErr) {
      next(dbErr)
    }
  })
})

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [req.params.id] })
  res.json({ ok: true })
}))

export default router
