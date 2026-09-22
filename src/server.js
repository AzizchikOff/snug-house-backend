import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import './db/index.js'

import authRoutes from './routes/auth.routes.js'
import contentRoutes from './routes/content.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import catalogRoutes from './routes/catalog.routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }))
app.use(express.json())

// uploaded PDFs are served as plain static files — reading them needs no login,
// only *replacing* them does (that check lives in catalog.routes.js)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/admin', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/catalog', catalogRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Snug House backend ${port}-portda ishga tushdi`))
