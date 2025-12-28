import multer from 'multer';
import path from 'path';
import fs from 'fs';

function makeDiskStorage(dirRel) {
  const uploadDir = path.join(process.cwd(), 'uploads', dirRel);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
      cb(null, name);
    }
  });
  return { storage, uploadDir };
}

/** ----- ID uploads (images/pdf) ----- */
const { storage: idStorage } = makeDiskStorage('ids');

export const idUpload = multer({
  storage: idStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpe?g|png|pdf)$/i;
    if (allowed.test(file.originalname)) return cb(null, true);
    cb(new Error('Only images (jpeg/png) and pdf are allowed'));
  }
});

/** ----- Resume uploads (pdf/doc/docx) ----- */
const { storage: resumeStorage } = makeDiskStorage('resumes');

export const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx)$/i;
    if (allowed.test(file.originalname)) return cb(null, true);
    cb(new Error('Only PDF, DOC, DOCX resumes are allowed'));
  }
});
