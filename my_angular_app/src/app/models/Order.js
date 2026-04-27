import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  username: { type: String, required: true },
  cartItems: [{
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  items: [String],
  deliveryDetails: {
    address: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentMode: { type: String, required: true },
  paymentDetails: {
    name: String,
    lastFourDigits: String,
    expiry: String,
    cvv: String
  },
  totalPrice: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  finalTotal: { type: Number, required: true },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;