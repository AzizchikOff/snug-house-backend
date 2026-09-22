import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'

const username = process.env.ADMIN_USERNAME
const password = process.env.ADMIN_PASSWORD

if (!username || !password) {
  console.error('.env faylida ADMIN_USERNAME va ADMIN_PASSWORD ko\u2018rsatilishi kerak')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 10)

const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username)
if (existing) {
  db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(hash, username)
  console.log(`Admin "${username}" paroli yangilandi.`)
} else {
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash)
  console.log(`Admin "${username}" yaratildi.`)
}
