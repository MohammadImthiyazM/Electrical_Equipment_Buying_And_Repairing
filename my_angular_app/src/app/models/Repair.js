import mongoose from 'mongoose';

const repairSchema = new mongoose.Schema({
  equipmentName: { type: String, required: true },
  issueDescription: { type: String, required: true },
  username: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }, // Added
  reviewed: { type: Boolean, default: false }, // Added
  createdAt: { type: Date, default: Date.now }
});

const Repair = mongoose.model('Repair', repairSchema);
export default Repair;