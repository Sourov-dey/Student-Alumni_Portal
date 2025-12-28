import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", file.fieldname === "avatar" ? "avatars" : "resumes");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safe);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "avatar") {
    const ok = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype);
    return cb(ok ? null : new Error("Invalid avatar type"), ok);
  }
  if (file.fieldname === "resume") {
    const ok = ["application/pdf"].includes(file.mimetype);
    return cb(ok ? null : new Error("Invalid resume type (PDF only)"), ok);
  }
  cb(new Error("Unknown upload field"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
