import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Login va parol kiritilishi shart' })
  }

  const { rows } = await db.execute({ sql: 'SELECT * FROM admins WHERE username = ?', args: [username] })
  const admin = rows[0]
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Login yoki parol noto\u2018g\u2018ri' })
  }

  const token = jwt.sign({ sub: admin.id, username: admin.username }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  })
  res.json({ token, username: admin.username })
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: req.admin.username })
})

export default router
