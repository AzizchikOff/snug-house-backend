import { Router } from 'express'
import multer from 'multer'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

<<<<<<< HEAD
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

=======
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => ALLOWED_IMAGE_TYPES.has(file.mimetype) ? cb(null, true) : cb(new Error('Faqat JPG, PNG, WEBP yoki GIF rasm yuklash mumkin')) })
const router = Router()
const FIELDS = ['category_id','name','name_uz','name_en','name_ru','code','color','color_uz','color_en','color_ru','size','price','moq','lead_time','material','material_uz','material_en','material_ru','description','description_uz','description_en','description_ru']

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.execute(`SELECT id, ${FIELDS.join(', ')}, sort_order, (image IS NOT NULL) AS has_image FROM products ORDER BY sort_order ASC, name ASC`)
  res.json(rows)
}))

router.get('/:id/image', asyncHandler(async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT image, image_mime FROM products WHERE id = ?', args: [req.params.id] })
  if (!rows[0]?.image) return res.status(404).end()
  res.setHeader('Content-Type', rows[0].image_mime || 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(Buffer.from(rows[0].image))
}))

router.post('/', requireAdmin, (req, res, next) => upload.single('image')(req, res, async (err) => {
  try {
    if (err) return res.status(400).json({ error: err.message })
    const { id, sort_order = 0 } = req.body || {}
    const fallbackName = req.body?.name || req.body?.name_uz || req.body?.name_en || req.body?.name_ru
    if (!id || !fallbackName) return res.status(400).json({ error: 'id va kamida bitta mahsulot nomi talab qilinadi' })
    const normalized = { ...req.body, name: fallbackName }
    const cols = ['id', 'sort_order', ...FIELDS]
    const vals = [id, Number(sort_order) || 0, ...FIELDS.map((f) => normalized[f] || '')]
    if (req.file) { cols.push('image', 'image_mime'); vals.push(req.file.buffer, req.file.mimetype) }
    await db.execute({ sql: `INSERT INTO products (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, args: vals })
    res.status(201).json({ ok: true })
  } catch (e) { if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Bu id bilan mahsulot allaqachon mavjud' }); next(e) }
}))

router.put('/:id', requireAdmin, (req, res, next) => upload.single('image')(req, res, async (err) => {
  try {
    if (err) return res.status(400).json({ error: err.message })
    const { rows } = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [req.params.id] })
    if (!rows[0]) return res.status(404).json({ error: 'Mahsulot topilmadi' })
    const merged = { ...rows[0], ...req.body }
    merged.name = merged.name || merged.name_uz || merged.name_en || merged.name_ru
    const cols = [...FIELDS, 'sort_order']
    let sql = `UPDATE products SET ${cols.map((c) => `${c} = ?`).join(', ')}`
    const args = cols.map((c) => c === 'sort_order' ? (Number(merged[c]) || 0) : (merged[c] ?? ''))
    if (req.file) { sql += ', image = ?, image_mime = ?'; args.push(req.file.buffer, req.file.mimetype) }
    sql += ' WHERE id = ?'; args.push(req.params.id)
    await db.execute({ sql, args }); res.json({ ok: true })
  } catch (e) { next(e) }
}))

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => { await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [req.params.id] }); res.json({ ok: true }) }))
>>>>>>> d4e8bbb (chat)
export default router
