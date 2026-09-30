import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = process.env.TURSO_DATABASE_URL || "file:data.sqlite";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url,
  authToken,
});

async function addColumnIfMissing(table, column, definition) {
  const { rows } = await db.execute(`PRAGMA table_info(${table})`);
  const exists = rows.some((row) => row.name === column);

  if (!exists) {
    console.log(`Migration: ${table}.${column} qo'shilmoqda...`);
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function initDb() {
  // =========================
  // ADMINS
  // =========================
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // =========================
  // SITE CONTENT
  // =========================
  await db.execute(`
    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // =========================
  // CATEGORIES
  // =========================
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name_uz TEXT DEFAULT '',
      name_en TEXT DEFAULT '',
      name_ru TEXT DEFAULT '',
      desc_uz TEXT DEFAULT '',
      desc_en TEXT DEFAULT '',
      desc_ru TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `);

  // =========================
  // PRODUCTS
  // =========================
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,

      category_id TEXT DEFAULT '',

      name TEXT NOT NULL DEFAULT '',
      name_uz TEXT DEFAULT '',
      name_en TEXT DEFAULT '',
      name_ru TEXT DEFAULT '',

      code TEXT DEFAULT '',

      color TEXT DEFAULT '',
      color_uz TEXT DEFAULT '',
      color_en TEXT DEFAULT '',
      color_ru TEXT DEFAULT '',

      size TEXT DEFAULT '',
      price TEXT DEFAULT '',
      moq TEXT DEFAULT '',
      lead_time TEXT DEFAULT '',

      material TEXT DEFAULT '',
      material_uz TEXT DEFAULT '',
      material_en TEXT DEFAULT '',
      material_ru TEXT DEFAULT '',

      description TEXT DEFAULT '',
      description_uz TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      description_ru TEXT DEFAULT '',

      image BLOB,
      image_mime TEXT,

      sort_order INTEGER DEFAULT 0,

      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // =========================
  // CATALOG PDF
  // =========================
  await db.execute(`
    CREATE TABLE IF NOT EXISTS catalog_file (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      filename TEXT NOT NULL,
      content BLOB NOT NULL
    )
  `);

  // ============================================
  // MIGRATIONS FOR EXISTING DATABASE
  // ============================================
  //
  // Agar eski Turso database mavjud bo'lsa,
  // CREATE TABLE IF NOT EXISTS yangi ustunlarni
  // qo'shmaydi.
  //
  // Shu sababli eski products jadvaliga yangi
  // ustunlarni avtomatik qo'shamiz.
  // ============================================

  const productColumns = [
    ["category_id", "TEXT DEFAULT ''"],

    ["name_uz", "TEXT DEFAULT ''"],
    ["name_en", "TEXT DEFAULT ''"],
    ["name_ru", "TEXT DEFAULT ''"],

    ["color_uz", "TEXT DEFAULT ''"],
    ["color_en", "TEXT DEFAULT ''"],
    ["color_ru", "TEXT DEFAULT ''"],

    ["material_uz", "TEXT DEFAULT ''"],
    ["material_en", "TEXT DEFAULT ''"],
    ["material_ru", "TEXT DEFAULT ''"],

    ["description_uz", "TEXT DEFAULT ''"],
    ["description_en", "TEXT DEFAULT ''"],
    ["description_ru", "TEXT DEFAULT ''"],

    ["image_mime", "TEXT"],
  ];

  for (const [column, definition] of productColumns) {
    await addColumnIfMissing("products", column, definition);
  }

  // =========================
  // DEFAULT SITE CONTENT
  // =========================

  const defaultContent = {
    about: {
      uz: "",
      en: "",
      ru: "",
    },

    contact: {
      phone: "",
      email: "",
      address: "",
      instagram: "",
      telegram: "",
      whatsapp: "",
    },

    catalog: {
      path: null,
      updated: null,
    },
  };

  for (const [key, value] of Object.entries(defaultContent)) {
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO site_content
        (key, value)
        VALUES (?, ?)
      `,
      args: [key, JSON.stringify(value)],
    });
  }

  // =========================
  // DEFAULT CATEGORIES
  // =========================

  const categories = [
    {
      id: "carpets",
      name_uz: "Gilamlar",
      name_en: "Carpets",
      name_ru: "Ковры",
      sort_order: 1,
    },
    {
      id: "covers",
      name_uz: "Qoplamalar",
      name_en: "Covers",
      name_ru: "Чехлы",
      sort_order: 2,
    },
    {
      id: "bags",
      name_uz: "Sumkalar",
      name_en: "Bags",
      name_ru: "Сумки",
      sort_order: 3,
    },
    {
      id: "placemats",
      name_uz: "Stol tagliklari",
      name_en: "Placemats",
      name_ru: "Салфетки",
      sort_order: 4,
    },
  ];

  for (const category of categories) {
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO categories (
          id,
          name_uz,
          name_en,
          name_ru,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        category.id,
        category.name_uz,
        category.name_en,
        category.name_ru,
        category.sort_order,
      ],
    });
  }

  // =========================
  // ADMIN
  // =========================

  const adminUsername = process.env.ADMIN_USERNAME || "admin";

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn("DIQQAT: ADMIN_PASSWORD environment variable berilmagan.");
  } else {
    const { rows } = await db.execute({
      sql: `
        SELECT id, password_hash
        FROM admins
        WHERE username = ?
      `,
      args: [adminUsername],
    });

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    if (!rows[0]) {
      await db.execute({
        sql: `
          INSERT INTO admins (
            username,
            password_hash
          )
          VALUES (?, ?)
        `,
        args: [adminUsername, passwordHash],
      });

      console.log(`Admin yaratildi: ${adminUsername}`);
    } else {
      const passwordMatches = await bcrypt.compare(
        adminPassword,
        rows[0].password_hash,
      );

      if (!passwordMatches) {
        await db.execute({
          sql: `
            UPDATE admins
            SET password_hash = ?
            WHERE username = ?
          `,
          args: [passwordHash, adminUsername],
        });

        console.log(`Admin paroli yangilandi: ${adminUsername}`);
      }
    }
  }

  console.log("Database tayyor.");
}
