import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'catalog')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `catalog-${Date.now()}.pdf`),
})

// Only PDFs, only through this admin-only endpoint. No public upload exists.
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Faqat PDF fayl yuklash mumkin'))
    }
    cb(null, true)
  },
})

const router = Router()

router.get('/', (req, res) => {
  const row = db.prepare("SELECT value FROM site_content WHERE key = 'catalog'").get()
  res.json(row ? JSON.parse(row.value) : { path: null, updated: null })
})

router.post('/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Fayl topilmadi' })

    // remove the previous catalog file so uploads don't pile up on disk
    const prev = db.prepare("SELECT value FROM site_content WHERE key = 'catalog'").get()
    if (prev) {
      const prevData = JSON.parse(prev.value)
      if (prevData.path) {
        const prevFile = path.join(uploadDir, path.basename(prevData.path))
        fs.unlink(prevFile, () => {})
      }
    }

    const publicPath = `/uploads/catalog/${req.file.filename}`
    const value = { path: publicPath, updated: new Date().toISOString().slice(0, 10) }
    db.prepare(
      `INSERT INTO site_content (key, value, updated_at) VALUES ('catalog', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).run(JSON.stringify(value))

    res.status(201).json(value)
  })
})

export default router
