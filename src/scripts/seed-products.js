import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, initDb } from '../db/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const imagesDir = path.join(__dirname, '..', '..', 'seed-images')

const products = [
  { id: 'circle-1', name: 'Circle 1', code: '#102', size: '80 cm', price: '$13.41', moq: '500pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'circle-2', name: 'Circle 2', code: '#103', size: '80 cm', price: '$13.41', moq: '500pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'circle-3', name: 'Circle 3', code: '#104', size: '80 cm', price: '$13.41', moq: '500pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'circle-4', name: 'Circle 4', code: '#105', size: '80 cm', price: '$13.41', moq: '500pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'circle-5', name: 'Circle 5', code: '#106', size: '80 cm', price: '$13.41', moq: '500pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'euro', name: 'Euro', code: '#107', size: '120*65cm', price: '$19.41', moq: '400pcs', lead_time: '40 days', material: 'Polyester & Cotton' },
  { id: 'oval', name: 'Oval', code: '#108', size: '80*50 cm', price: '$10.21', moq: '500pcs', lead_time: '20 days', material: 'Polyester & Cotton' },
  { id: 'circle-7', name: 'Circle 7', code: '#109', color: 'Blue', size: '80 cm', price: '$13.41', moq: '500pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'mini', name: 'Mini', code: '#110', size: '70*50cm', price: '$9.45', moq: '500pcs', lead_time: '20 days', material: 'Polyester & Cotton' },
  { id: 'toilet-mat', name: 'Toilet Mat', code: '#111', size: '-', price: '$10.11', moq: '600pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'a-lot', name: 'A Lot', code: '#112', size: '80 cm', price: '$12.51', moq: '500pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'double', name: 'Double', code: '#113', color: 'Blue / Beige', size: '120*65cm', price: '$18.41', moq: '300pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'big', name: 'Big', code: '#114', size: '70*90 cm', price: '$20.99', moq: '420pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'evro-2', name: 'Evro 2', code: '#121', color: 'Blue / Beige', size: '100*100 cm', price: '$26.99', moq: '420pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'black', name: 'Black', code: '#115', color: 'Black', size: 'standart', price: '$13.99 for pcs', moq: '350pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'grey', name: 'Grey', code: '#116', color: 'Grey', size: 'standart', price: '$13.99 for pcs', moq: '350pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'jeans', name: 'Jeans', code: '#117', color: 'Denim blue', size: 'standart', price: '$13.99 for pcs', moq: '350pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'orange', name: 'Orange', code: '#118', color: 'Orange', size: 'standart', price: '$13.99 for pcs', moq: '350pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'red-line', name: 'Red Line', code: '#119', color: 'Black / Red', size: 'standart', price: '$13.99 for pcs', moq: '350pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
  { id: 'dark-red', name: 'Dark Red', code: '#120', color: 'Dark red', size: 'standart', price: '$13.99 for pcs', moq: '350pcs', lead_time: '30 days', material: 'Polyester & Cotton' },
]

const RUG_DESC = 'Handcrafted cord rug designed for modern residential and commercial interiors. Available in a range of colors and sizes, with custom production options available upon request.'
const COVER_DESC = 'Tailored car seat cover set, front and rear, made for wholesale and private-label orders with custom sizing available on request.'

async function main() {
  await initDb()
  console.log(`${products.length} ta mahsulot yozilmoqda...`)

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const isCover = ['black', 'grey', 'jeans', 'orange', 'red-line', 'dark-red'].includes(p.id)
    const imgPath = path.join(imagesDir, `${p.id}.jpg`)
    const image = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null

    const existing = await db.execute({ sql: 'SELECT id FROM products WHERE id = ?', args: [p.id] })
    if (existing.rows.length > 0) {
      console.log(`  ${p.id}: allaqachon mavjud, o'tkazib yuborildi`)
      continue
    }

    await db.execute({
      sql: `INSERT INTO products (id, name, code, color, size, price, moq, lead_time, material, description, image, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.id, p.name, p.code, p.color || '', p.size, p.price, p.moq, p.lead_time, p.material,
        isCover ? COVER_DESC : RUG_DESC, image, i,
      ],
    })
    console.log(`  ${p.id}: qo'shildi${image ? ' (rasm bilan)' : ' (rasmsiz)'}`)
  }
  console.log('Tayyor.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
