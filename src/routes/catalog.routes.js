import { Router } from "express";
import multer from "multer";
import { db } from "../db/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Faqat PDF fayl yuklash mumkin"));
    }
    cb(null, true);
  },
});

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await db.execute(
      "SELECT value FROM site_content WHERE key = 'catalog'",
    );
    res.json(
      rows[0] ? JSON.parse(rows[0].value) : { path: null, updated: null },
    );
  }),
);

router.get(
  "/file",
  asyncHandler(async (req, res) => {
    const { rows } = await db.execute(
      "SELECT filename, content FROM catalog_file WHERE id = 1",
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Katalog hali yuklanmagan" });
    }

    const disposition = req.query.download === "1" ? "attachment" : "inline";
    const safeName = String(rows[0].filename || "catalog.pdf").replace(
      /[\r\n"]/g,
      "",
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${safeName}"`,
    );
    res.send(Buffer.from(rows[0].content));
  }),
);

router.post("/upload", requireAdmin, (req, res, next) => {
  upload.single("file")(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "Fayl topilmadi" });

      await db.execute(`
        CREATE TABLE IF NOT EXISTS catalog_file (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          filename TEXT NOT NULL,
          content BLOB NOT NULL
        )
      `);

      await db.execute({
        sql: `INSERT INTO catalog_file (id, filename, content) VALUES (1, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                filename = excluded.filename,
                content = excluded.content`,
        args: [req.file.originalname || "catalog.pdf", req.file.buffer],
      });

      const value = {
        path: "/api/catalog/file",
        updated: new Date().toISOString().slice(0, 10),
      };

      await db.execute({
        sql: `INSERT INTO site_content (key, value, updated_at)
              VALUES ('catalog', ?, datetime('now'))
              ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at`,
        args: [JSON.stringify(value)],
      });

      res.status(201).json(value);
    } catch (dbErr) {
      next(dbErr);
    }
  });
});

export default router;
