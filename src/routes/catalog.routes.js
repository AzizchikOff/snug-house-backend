import { Router } from 'express'
import multer from 'multer'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'

// Memory storage on purpose: this backend may run on hosts with no
// persistent disk (e.g. Render's free tier), so the PDF bytes go straight
// into Turso as a BLOB instead of a local file that would vanish on restart.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Faqat PDF fayl yuklash mumkin'))
    }
    cb(null, true)
  },
})

const router = Router()

router.get('/', async (req, res) => {
  const { rows } = await db.execute("SELECT value FROM site_content WHERE key = 'catalog'")
  res.json(rows[0] ? JSON.parse(rows[0].value) : { path: null, updated: null })
})

// Streams the stored PDF back out. Public — reading the catalog needs no
// login, only replacing it does.
router.get('/file', async (req, res) => {
  const { rows } = await db.execute('SELECT filename, content FROM catalog_file WHERE id = 1')
  if (!rows[0]) return res.status(404).json({ error: 'Katalog hali yuklanmagan' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${rows[0].filename}"`)
  res.send(Buffer.from(rows[0].content))
})

router.post('/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Fayl topilmadi' })

    await db.execute(`
      CREATE TABLE IF NOT EXISTS catalog_file (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        filename TEXT NOT NULL,
        content BLOB NOT NULL
      )
    `)

    await db.execute({
      sql: `INSERT INTO catalog_file (id, filename, content) VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET filename = excluded.filename, content = excluded.content`,
      args: [req.file.originalname || 'catalog.pdf', req.file.buffer],
    })

    const value = { path: '/api/catalog/file', updated: new Date().toISOString().slice(0, 10) }
    await db.execute({
      sql: `INSERT INTO site_content (key, value, updated_at) VALUES ('catalog', ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [JSON.stringify(value)],
    })

    res.status(201).json(value)
  })
})

export default router
