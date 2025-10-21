const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Verification } = require('../models');
const authenticate = require('../middleware/authenticate');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/', authenticate, upload.fields([{ name: 'document' }, { name: 'selfie'}]), async (req,res) => {
  const { idType, idNumber } = req.body;
  const doc = req.files['document'] ? req.files['document'][0].path : null;
  const selfie = req.files['selfie'] ? req.files['selfie'][0].path : null;
  const v = await Verification.create({
    userId: req.user.id,
    idType,
    idNumberEncrypted: idNumber ? Buffer.from(idNumber).toString('base64') : null,
    documentUrl: doc,
    selfieUrl: selfie,
    result: 'pending'
  });
  // stub: call KYC provider here (async). For now set pending and admin will approve.
  res.json({ ok: true, verification: v });
});

module.exports = router;

