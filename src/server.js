import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db/index.js'

import authRoutes from './routes/auth.routes.js'
import contentRoutes from './routes/content.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import catalogRoutes from './routes/catalog.routes.js'
import productsRoutes from './routes/products.routes.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }))
app.use(express.json())

app.use('/api/admin', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/products', productsRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Global error handler — without this, an error thrown inside an async
// route (a bad DB query, a missing Turso credential, etc.) had nowhere to
// go and the request would hang or return nothing. Now it always comes
// back as a JSON 500 with a message, and always gets logged so it shows
// up in Render's Logs tab.
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}] xato:`, err)
  res.status(500).json({ error: err.message || 'Serverda kutilmagan xato yuz berdi' })
})

const port = process.env.PORT || 4000

console.log('Baza manzili:', process.env.TURSO_DATABASE_URL ? 'Turso (' + process.env.TURSO_DATABASE_URL + ')' : 'lokal fayl (data.sqlite) — TURSO_DATABASE_URL bo\u2018sh!')

initDb()
  .then(() => {
    app.listen(port, () => console.log(`Snug House backend ${port}-portda ishga tushdi`))
  })
  .catch((err) => {
    console.error('Bazani ishga tushirishda xato:', err)
    process.exit(1)
  })
