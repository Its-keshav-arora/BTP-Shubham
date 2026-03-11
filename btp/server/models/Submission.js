import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  proteinName: { type: String, required: true },
  ligandName: { type: String, required: true },
  proteinFile: {
    url: { type: String, required: true },
    publicId: { type: String },
    filename: { type: String },
  },
  ligandFile: {
    url: { type: String, required: true },
    publicId: { type: String },
    filename: { type: String },
  },
  results: { type: Object, default: {} },
  termsAccepted: { type: Boolean, default: true },
}, { timestamps: true });

submissionSchema.index({ user: 1 });
submissionSchema.index({ createdAt: -1 });

export default mongoose.model('Submission', submissionSchema);
