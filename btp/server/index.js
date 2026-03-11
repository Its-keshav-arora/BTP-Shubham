import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import submissionRoutes from './routes/submissions.js';
import { ensureAdmin } from './utils/seedAdmin.js';


const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/btp-protein-ligand')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

// Ensure default admin exists
ensureAdmin();

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
