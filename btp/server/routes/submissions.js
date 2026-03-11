import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import Submission from '../models/Submission.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

function getCloudinaryConfig() {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
  cloudinary.config(config);
  return config;
}

async function uploadToCloudinary(buffer, folder, filename) {
  getCloudinaryConfig(); // config at request time, after dotenv has run
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: `btp/${folder}`,
        public_id: filename?.replace(/\.pdb$/i, '') || `file_${Date.now()}`,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// User: create submission with file upload
router.post(
  '/',
  authenticate,
  upload.fields([
    { name: 'proteinFile', maxCount: 1 },
    { name: 'ligandFile', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { proteinName, ligandName, results, termsAccepted } = req.body;
      const proteinFile = req.files?.proteinFile?.[0];
      const ligandFile = req.files?.ligandFile?.[0];

      if (!proteinName || !ligandName) {
        return res.status(400).json({ message: 'Protein name and ligand name required' });
      }
      if (!proteinFile || !ligandFile) {
        return res.status(400).json({ message: 'Both protein (.pdb) and ligand (.pdb) files required' });
      }
      const pdb = /\.pdb$/i;
      if (!pdb.test(proteinFile.originalname) || !pdb.test(ligandFile.originalname)) {
        return res.status(400).json({ message: 'Only .pdb files are allowed' });
      }

      const [proteinRes, ligandRes] = await Promise.all([
        uploadToCloudinary(proteinFile.buffer, 'protein', proteinFile.originalname),
        uploadToCloudinary(ligandFile.buffer, 'ligand', ligandFile.originalname),
      ]);

      let resultsObj = {};
      if (results && typeof results === 'string') {
        try {
          resultsObj = JSON.parse(results);
        } catch (_) {}
      } else if (results && typeof results === 'object') {
        resultsObj = results;
      }

      const submission = await Submission.create({
        user: req.user._id,
        proteinName,
        ligandName,
        proteinFile: {
          url: proteinRes.secure_url,
          publicId: proteinRes.public_id,
          filename: proteinFile.originalname,
        },
        ligandFile: {
          url: ligandRes.secure_url,
          publicId: ligandRes.public_id,
          filename: ligandFile.originalname,
        },
        results: resultsObj,
        termsAccepted: termsAccepted === true || termsAccepted === 'true',
      });

      res.status(201).json(submission);
    } catch (err) {
      res.status(500).json({ message: err.message || 'Upload failed' });
    }
  }
);

// User: get own submissions
router.get('/my', authenticate, async (req, res) => {
  try {
    const list = await Submission.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch' });
  }
});

// Admin: get all submissions (with user info)
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const list = await Submission.find()
      .populate('user', 'email name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch' });
  }
});

// Admin: download URL for a file (returns secure_url which is usable for download)
router.get('/admin/:id/file/:type', authenticate, requireAdmin, async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    const type = req.params.type;
    const file = type === 'protein' ? sub.proteinFile : sub.ligandFile;
    if (!file?.url) return res.status(404).json({ message: 'File not found' });
    res.json({ url: file.url, filename: file.filename || `${type}.pdb` });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed' });
  }
});

export default router;
