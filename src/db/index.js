import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', '..', 'data.sqlite')

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  -- generic JSON content store: 'about', 'contact', 'catalog'
  CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    icon TEXT NOT NULL,
    name_uz TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    desc_uz TEXT NOT NULL DEFAULT '',
    desc_en TEXT NOT NULL DEFAULT '',
    desc_ru TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
`)

// seed default content once, only if empty, so first run isn't blank.
// Text below mirrors what used to be hardcoded in translations.js, so the
// live site looks the same on day one — from here on it's admin-editable.
const seedIfMissing = (key, value) => {
  const row = db.prepare('SELECT key FROM site_content WHERE key = ?').get(key)
  if (!row) {
    db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)').run(key, JSON.stringify(value))
  }
}

seedIfMissing('contact', {
  telegramUsername: 'snughouse_export',
  whatsappNumber: '998901234567',
  phone: '+998 90 123 45 67',
  email: 'export@snughouse.uz',
  address: 'Tashkent, Uzbekistan — Yangihayot district, weaving workshop No. 4',
})

seedIfMissing('about', {
  uz: {
    p1: 'Snug House GilamArt nomi ostida mahalliy bozor uchun gilam to\u2018qiydigan kichik oilaviy ustaxona sifatida boshlangan. Chet ellik hamkorlardan talab oshgach, ustaxona ishlab chiqarish liniyasi, hujjatlashtirish va sifat nazoratini bitta maqsad atrofida qayta qurdi: ulgurji xaridorlarga eksport miqyosida ishonchli yetkazib berish.',
    p2: 'Har bir buyum hozir ham avlodlar davomida o\u2018tib kelgan mahorat egalari tomonidan qo\u2018lda to\u2018qiladi. O\u2018zgargani \u2014 to\u2018quvni o\u2018rab turgan jarayonlar: kuzatiladigan xomashyo, tekshirilgan mahsulot va birinchi safar bojxonadan o\u2018tadigan hujjatlar.',
    values: [
      { title: 'Barqaror muddatlar', desc: 'Tasdiqlangan buyurtmalar asosida tuzilgan va yozma shaklda bildiriladigan ishlab chiqarish jadvali.' },
      { title: 'Avval namuna, keyin buyurtma', desc: 'Birinchi katta buyurtmadan oldin jismoniy namunalar yuboriladi.' },
      { title: 'Shaxsiy brendga tayyor', desc: 'So\u2018rov bo\u2018yicha maxsus yorliq, qadoqlash va parvarish yo\u2018riqnomasi.' },
    ],
  },
  en: {
    p1: 'Snug House began as a small hand-weaving workshop producing rugs for the local market under the name GilamArt. As demand grew from partners abroad, the workshop rebuilt its production line, documentation and quality control around one goal: supplying wholesale buyers reliably, at export scale.',
    p2: 'Every piece is still woven by hand, on looms operated by artisans with decades of technique passed through the same families. What changed is what surrounds the weaving \u2014 traceable materials, tested output, and paperwork that clears customs the first time.',
    values: [
      { title: 'Consistent lead times', desc: 'Production schedules built around confirmed purchase orders, communicated in writing.' },
      { title: 'Sample-first ordering', desc: 'Physical samples shipped before first bulk order confirmation.' },
      { title: 'Private label ready', desc: 'Custom labelling, packaging and care-instruction inserts on request.' },
    ],
  },
  ru: {
    p1: 'Snug House \u043d\u0430\u0447\u0438\u043d\u0430\u043b\u0430\u0441\u044c \u043a\u0430\u043a \u043d\u0435\u0431\u043e\u043b\u044c\u0448\u0430\u044f \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u043a\u0430\u044f \u0440\u0443\u0447\u043d\u043e\u0433\u043e \u0442\u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0430, \u0432\u044b\u043f\u0443\u0441\u043a\u0430\u0432\u0448\u0430\u044f \u043a\u043e\u0432\u0440\u044b \u0434\u043b\u044f \u043c\u0435\u0441\u0442\u043d\u043e\u0433\u043e \u0440\u044b\u043d\u043a\u0430 \u043f\u043e\u0434 \u0438\u043c\u0435\u043d\u0435\u043c GilamArt. \u0421 \u0440\u043e\u0441\u0442\u043e\u043c \u0441\u043f\u0440\u043e\u0441\u0430 \u043e\u0442 \u0437\u0430\u0440\u0443\u0431\u0435\u0436\u043d\u044b\u0445 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u043e\u0432 \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u043a\u0430\u044f \u043f\u0435\u0440\u0435\u0441\u0442\u0440\u043e\u0438\u043b\u0430 \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u043e, \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u043e\u0431\u043e\u0440\u043e\u0442 \u0438 \u043a\u043e\u043d\u0442\u0440\u043e\u043b\u044c \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0430 \u0432\u043e\u043a\u0440\u0443\u0433 \u043e\u0434\u043d\u043e\u0439 \u0446\u0435\u043b\u0438 \u2014 \u043d\u0430\u0434\u0451\u0436\u043d\u043e \u043f\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0442\u044c \u043e\u043f\u0442\u043e\u0432\u044b\u043c \u043f\u043e\u043a\u0443\u043f\u0430\u0442\u0435\u043b\u044f\u043c \u0432 \u044d\u043a\u0441\u043f\u043e\u0440\u0442\u043d\u044b\u0445 \u043e\u0431\u044a\u0451\u043c\u0430\u0445.',
    p2: '\u041a\u0430\u0436\u0434\u043e\u0435 \u0438\u0437\u0434\u0435\u043b\u0438\u0435 \u043f\u043e-\u043f\u0440\u0435\u0436\u043d\u0435\u043c\u0443 \u0442\u043a\u0451\u0442\u0441\u044f \u0432\u0440\u0443\u0447\u043d\u0443\u044e \u043c\u0430\u0441\u0442\u0435\u0440\u0430\u043c\u0438, \u0447\u044c\u0451 \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u0442\u0432\u043e \u043f\u0435\u0440\u0435\u0434\u0430\u0432\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u043a\u043e\u043b\u0435\u043d\u0438\u044f\u043c\u0438 \u043e\u0434\u043d\u0438\u0445 \u0438 \u0442\u0435\u0445 \u0436\u0435 \u0441\u0435\u043c\u0435\u0439. \u0418\u0437\u043c\u0435\u043d\u0438\u043b\u043e\u0441\u044c \u0442\u043e, \u0447\u0442\u043e \u043e\u043a\u0440\u0443\u0436\u0430\u0435\u0442 \u0442\u043a\u0430\u0447\u0435\u0441\u0442\u0432\u043e: \u043f\u0440\u043e\u0441\u043b\u0435\u0436\u0438\u0432\u0430\u0435\u043c\u043e\u0435 \u0441\u044b\u0440\u044c\u0451, \u043f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u0430\u044f \u043f\u0440\u043e\u0434\u0443\u043a\u0446\u0438\u044f \u0438 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b, \u043f\u0440\u043e\u0445\u043e\u0434\u044f\u0449\u0438\u0435 \u0442\u0430\u043c\u043e\u0436\u043d\u044e \u0441 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0440\u0430\u0437\u0430.',
    values: [
      { title: '\u0421\u0442\u0430\u0431\u0438\u043b\u044c\u043d\u044b\u0435 \u0441\u0440\u043e\u043a\u0438', desc: '\u0413\u0440\u0430\u0444\u0438\u043a \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u0430 \u0441\u0442\u0440\u043e\u0438\u0442\u0441\u044f \u043d\u0430 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d\u043d\u044b\u0445 \u0437\u0430\u043a\u0430\u0437\u0430\u0445 \u0438 \u0441\u043e\u043e\u0431\u0449\u0430\u0435\u0442\u0441\u044f \u0432 \u043f\u0438\u0441\u044c\u043c\u0435\u043d\u043d\u043e\u043c \u0432\u0438\u0434\u0435.' },
      { title: '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043e\u0431\u0440\u0430\u0437\u0435\u0446, \u043f\u043e\u0442\u043e\u043c \u0437\u0430\u043a\u0430\u0437', desc: '\u0424\u0438\u0437\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u043e\u0431\u0440\u0430\u0437\u0446\u044b \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u044e\u0442\u0441\u044f \u0434\u043e \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u043a\u0440\u0443\u043f\u043d\u043e\u0433\u043e \u0437\u0430\u043a\u0430\u0437\u0430.' },
      { title: '\u0413\u043e\u0442\u043e\u0432\u043d\u043e\u0441\u0442\u044c \u043a \u0447\u0430\u0441\u0442\u043d\u043e\u0439 \u043c\u0430\u0440\u043a\u0435', desc: '\u0418\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u044b\u0435 \u044d\u0442\u0438\u043a\u0435\u0442\u043a\u0438, \u0443\u043f\u0430\u043a\u043e\u0432\u043a\u0430 \u0438 \u0432\u043a\u043b\u0430\u0434\u044b\u0448\u0438 \u043f\u043e \u0443\u0445\u043e\u0434\u0443 \u2014 \u043f\u043e \u0437\u0430\u043f\u0440\u043e\u0441\u0443.' },
    ],
  },
})

seedIfMissing('catalog', { path: null, updated: null })

const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c
if (catCount === 0) {
  const insert = db.prepare(
    `INSERT INTO categories (id, icon, name_uz, name_en, name_ru, desc_uz, desc_en, desc_ru, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const defaults = [
    ['carpets', 'Grid3x3', 'Gilamlar', 'Carpets', '\u041a\u043e\u0432\u0440\u044b',
      'An\u2019anaviy va zamonaviy naqshlarda qo\u2018lda to\u2018qilgan jun va aralash gilamlar.',
      'Hand-knotted wool and wool-blend rugs in traditional and contemporary patterns.',
      '\u041a\u043e\u0432\u0440\u044b \u0440\u0443\u0447\u043d\u043e\u0439 \u0440\u0430\u0431\u043e\u0442\u044b \u0438\u0437 \u0448\u0435\u0440\u0441\u0442\u0438 \u0438 \u0441\u043c\u0435\u0441\u043e\u0432\u043e\u0439 \u043f\u0440\u044f\u0436\u0438 \u0432 \u0442\u0440\u0430\u0434\u0438\u0446\u0438\u043e\u043d\u043d\u044b\u0445 \u0438 \u0441\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u044b\u0445 \u0443\u0437\u043e\u0440\u0430\u0445.'],
    ['covers', 'Car', 'Chexollar', 'Covers', '\u0410\u0432\u0442\u043e\u0447\u0435\u0445\u043b\u044b',
      'Yetakchi avtomobil modellariga mos to\u2018qilgan va steganoy chexollar.',
      'Tailored woven and quilted covers, sized to major vehicle models.',
      '\u0422\u043a\u0430\u043d\u044b\u0435 \u0438 \u0441\u0442\u0451\u0433\u0430\u043d\u044b\u0435 \u0447\u0435\u0445\u043b\u044b \u043f\u043e \u0440\u0430\u0437\u043c\u0435\u0440\u0430\u043c \u043e\u0441\u043d\u043e\u0432\u043d\u044b\u0445 \u043c\u043e\u0434\u0435\u043b\u0435\u0439 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0435\u0439.'],
    ['bags', 'ShoppingBag', 'Sumkalar', 'Bags', '\u0421\u0443\u043c\u043a\u0438',
      'Tabiiy jun va paxta aralashmasidan to\u2018qilgan sumkalar.',
      'Woven tote and shoulder bags in natural wool and cotton blends.',
      '\u0422\u043a\u0430\u043d\u044b\u0435 \u0441\u0443\u043c\u043a\u0438 \u0438\u0437 \u043d\u0430\u0442\u0443\u0440\u0430\u043b\u044c\u043d\u043e\u0439 \u0448\u0435\u0440\u0441\u0442\u0438 \u0438 \u0445\u043b\u043e\u043f\u043a\u043e\u0432\u044b\u0445 \u0441\u043c\u0435\u0441\u0435\u0439.'],
    ['placemats', 'Circle', 'Salfetkalar', 'Placemats', '\u0421\u0430\u043b\u0444\u0435\u0442\u043a\u0438',
      'Mehmonxona va chakana savdo kolleksiyalariga mos to\u2018qilgan dasturxon to\u2018plamlari.',
      'Table sets woven to match hospitality and retail collections.',
      '\u041a\u043e\u043c\u043f\u043b\u0435\u043a\u0442\u044b \u0434\u043b\u044f \u0441\u0435\u0440\u0432\u0438\u0440\u043e\u0432\u043a\u0438, \u0441\u043e\u0442\u043a\u0430\u043d\u043d\u044b\u0435 \u043f\u043e\u0434 \u043a\u043e\u043b\u043b\u0435\u043a\u0446\u0438\u0438 \u043e\u0442\u0435\u043b\u0435\u0439 \u0438 \u0440\u043e\u0437\u043d\u0438\u0446\u044b.'],
  ]
  defaults.forEach(([id, icon, uz, en, ru, duz, den, dru], i) => insert.run(id, icon, uz, en, ru, duz, den, dru, i))
}
