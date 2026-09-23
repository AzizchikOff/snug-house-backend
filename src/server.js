import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db/index.js'

import authRoutes from './routes/auth.routes.js'
import contentRoutes from './routes/content.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import catalogRoutes from './routes/catalog.routes.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }))
app.use(express.json())

app.use('/api/admin', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/catalog', catalogRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const port = process.env.PORT || 4000

initDb()
  .then(() => {
    app.listen(port, () => console.log(`Snug House backend ${port}-portda ishga tushdi`))
  })
  .catch((err) => {
    console.error('Bazani ishga tushirishda xato:', err)
    process.exit(1)
  })
