import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Submission from '../models/Submission.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
const uploadReturn = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB for admin-returned results

async function uploadToCloudinary(buffer, folder, filename) {
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

// Admin: upload returned results (stored on Cloudinary, visible to user on their portal)
router.post(
  '/admin/:id/return',
  authenticate,
  requireAdmin,
  uploadReturn.single('returnedFile'),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file?.buffer) {
        return res.status(400).json({ message: 'Result file is required' });
      }
      const sub = await Submission.findById(req.params.id);
      if (!sub) return res.status(404).json({ message: 'Submission not found' });

      const uploaded = await uploadToCloudinary(file.buffer, 'returned', file.originalname);

      if (sub.returnedFile?.publicId) {
        try {
          await cloudinary.uploader.destroy(sub.returnedFile.publicId, { resource_type: 'raw' });
        } catch (_) {
          /* ignore cleanup errors */
        }
      }

      sub.returnedFile = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        filename: file.originalname,
      };
      sub.returnedAt = new Date();
      await sub.save();

      const populated = await Submission.findById(sub._id).populate('user', 'email name').lean();
      res.json(populated);
    } catch (err) {
      res.status(500).json({ message: err.message || 'Upload failed' });
    }
  }
);

// User: signed download metadata for returned results (ownership checked)
router.get('/:id/returned-file', authenticate, async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(404).json({ message: 'Not found' });
    }
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    if (!sub.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!sub.returnedFile?.url) {
      return res.status(404).json({ message: 'No results returned yet' });
    }
    res.json({
      url: sub.returnedFile.url,
      filename: sub.returnedFile.filename || 'results',
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed' });
  }
});

export default router;
