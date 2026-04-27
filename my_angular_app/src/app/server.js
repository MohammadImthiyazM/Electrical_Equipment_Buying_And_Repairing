import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Dynamically import models
const { default: User } = await import('./models/User.js');
const { default: Repair } = await import('./models/Repair.js');
const { default: Order } = await import('./models/Order.js');

dotenv.config({ path: './.env' });
const app = express();

// Define __dirname to project root
const __dirname = 'C:\\Users\\mk975\\Angular_imthi\\my_angular_app';

// Create public directory in project root if it doesn't exist
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
  console.log('Created public directory at:', publicPath);
} else {
  console.log('Public directory exists at:', publicPath);
}

// Configure CORS to allow Angular frontend
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-username']
}));
app.use(express.json());

// Serve static files (images) from public at root URL
app.use('/', express.static(publicPath, { maxAge: 0 }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  sold: { type: Number, default: 0, min: 0 },
  imageUrl: { type: String, required: true }
});
const Product = mongoose.model('Product', productSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true }
  },
  quantity: { type: Number, default: 1, min: 1 },
  addedAt: { type: Date, default: Date.now }
}, {
  indexes: [
    { key: { userId: 1, 'product.productId': 1 }, unique: true }
  ]
});
const Cart = mongoose.model('Cart', cartSchema);

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer saving to:', publicPath);
    cb(null, publicPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Multer generated filename:', filename);
    cb(null, filename);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file || !file.originalname) {
      console.error('Multer fileFilter: Invalid or missing file object', file);
      return cb(new Error('No file provided or invalid file object'), false);
    }
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      console.log('Multer fileFilter: File accepted', {
        originalname: file.originalname,
        mimetype: file.mimetype
      });
      cb(null, true);
    } else {
      console.error('Multer fileFilter: Invalid file type', {
        originalname: file.originalname,
        mimetype: file.mimetype
      });
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('image');

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.message, err.code);
    return res.status(400).json({ message: `File upload error: ${err.message} (${err.code})` });
  }
  if (err) {
    console.error('File upload error:', err.message);
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  next();
};

// Middleware to check admin
const isAdmin = async (req, res, next) => {
  const username = req.headers['x-username'];
  if (!username) {
    console.error('isAdmin: No username provided in x-username header');
    return res.status(401).json({ message: 'Unauthorized: Username is required' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`isAdmin: User not found for username: ${username}`);
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.usertype !== 'admin') {
      console.error(`isAdmin: User ${username} is not an admin`);
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('isAdmin error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error during authentication', error: error.message });
  }
};

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message, err.stack);
  res.status(500).json({ message: 'Unexpected server error', error: err.message });
});

// Function to wait for file to be written
const waitForFile = (filePath, maxAttempts = 10, interval = 100) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkFile = () => {
      if (fs.existsSync(filePath)) {
        console.log('Image verified at:', filePath);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.error('Image not found after max attempts:', filePath);
        reject(new Error('Image file not found after upload'));
      } else {
        attempts++;
        console.log(`Attempt ${attempts}: Waiting for image at ${filePath}`);
        setTimeout(checkFile, interval);
      }
    };
    checkFile();
  });
};

// Signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password, firstName, lastName, phone, usertype, address } = req.body;
  console.log('Signup request:', { username, email, firstName, lastName, phone, usertype, address });
  try {
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid Gmail address (e.g., username@gmail.com)' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!])[A-Za-z\d@#$%^&*!]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@#$%^&*!)' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, firstName, lastName, phone, usertype, address });
    await user.save();
    console.log('User created:', username);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password, usertype } = req.body;
  console.log('Login request:', { email, usertype });
  try {
    if (!email || !password || !usertype) {
      return res.status(400).json({ message: 'Email, password, and user type are required' });
    }
    if (usertype !== 'user' && usertype !== 'admin') {
      return res.status(400).json({ message: 'Invalid user type. Must be "user" or "admin"' });
    }
    const user = await User.findOne({ email, usertype });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email, password, or user type' });
    }
    console.log('Login successful:', user.username, 'usertype:', user.usertype);
    res.status(200).json({
      message: 'Login successful',
      user: { username: user.username, id: user._id, usertype: user.usertype }
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
});

// Get User Details
app.get('/api/user', async (req, res) => {
  const username = req.headers['x-username'];
  console.log('Fetch user details for:', username);
  try {
    if (!username) {
      return res.status(401).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username }, 'address phone');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ address: user.address || '', phone: user.phone || '' });
  } catch (error) {
    console.error('Error fetching user details:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
});

// Get User Email
app.get('/api/user/details', async (req, res) => {
  const username = req.headers['x-username'];
  console.log('Fetch user email for:', username);
  try {
    if (!username) {
      return res.status(401).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username }, 'email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ email: user.email || '' });
  } catch (error) {
    console.error('Error fetching user email:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching user email', error: error.message });
  }
});

// Update User Profile
app.put('/api/user/update', async (req, res) => {
  const username = req.headers['x-username'];
  const { phone, address } = req.body;
  console.log('Update user profile:', { username, phone, address });
  try {
    if (!username) {
      return res.status(401).json({ message: 'Username is required' });
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Valid 10-digit phone number is required' });
    }
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.phone = phone;
    user.address = address;
    await user.save();
    console.log('User profile updated:', username);
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error.message, error.stack);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Get Order by ID
app.get('/api/order/:id', async (req, res) => {
  const { id } = req.params;
  const username = req.headers['x-username'];
  console.log('Fetch order:', { id, username });
  try {
    if (!username) {
      return res.status(401).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const order = await Order.findOne({ _id: id, username });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Get All Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    console.log('Fetched products:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Insert Product (Admin Only)
app.post('/api/products', isAdmin, upload, handleMulterError, async (req, res) => {
  const { name, description, price, stock } = req.body;
  console.log('POST /api/products received:', {
    name,
    description,
    price,
    stock,
    file: req.file ? req.file : 'No file uploaded',
    username: req.headers['x-username']
  });
  try {
    if (!name || name.trim() === '') {
      console.error('Validation failed: Product name is empty');
      return res.status(400).json({ message: 'Product name is required and cannot be empty' });
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      console.error('Validation failed: Invalid price', { price });
      return res.status(400).json({ message: 'Valid price (greater than 0) is required' });
    }
    if (!stock || isNaN(stock) || Number(stock) < 0) {
      console.error('Validation failed: Invalid stock', { stock });
      return res.status(400).json({ message: 'Valid stock (0 or greater) is required' });
    }
    if (!req.file) {
      console.error('Validation failed: No image uploaded');
      return res.status(400).json({ message: 'Image is required' });
    }
    const imageUrl = `/${req.file.filename}`;
    const fullPath = path.join(publicPath, req.file.filename);
    await waitForFile(fullPath);
    const product = new Product({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      stock: Number(stock),
      imageUrl
    });
    await product.save();
    console.log('Product saved:', product);
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Error adding product:', error.message, error.stack);
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }
    res.status(500).json({ message: 'Error adding product to database', error: error.message });
  }
});

// Update Product (Admin Only)
app.put('/api/products/:id', isAdmin, upload, handleMulterError, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;
  console.log('PUT /api/products received:', { id, name, description, price, stock, file: req.file ? req.file : 'No file' });
  try {
    if (!name || name.trim() === '') {
      console.error('Validation failed: Product name is empty');
      return res.status(400).json({ message: 'Product name is required and cannot be empty' });
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      console.error('Validation failed: Invalid price', { price });
      return res.status(400).json({ message: 'Valid price (greater than 0) is required' });
    }
    if (!stock || isNaN(stock) || Number(stock) < 0) {
      console.error('Validation failed: Invalid stock', { stock });
      return res.status(400).json({ message: 'Valid stock (0 or greater) is required' });
    }
    const updateData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      stock: Number(stock)
    };
    if (req.file) {
      updateData.imageUrl = `/${req.file.filename}`;
      const fullPath = path.join(publicPath, req.file.filename);
      await waitForFile(fullPath);
      const product = await Product.findById(id);
      if (product && product.imageUrl) {
        const oldImagePath = path.join(publicPath, product.imageUrl.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Deleted old image:', oldImagePath);
        }
      }
    }
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!product) {
      console.error('Product not found:', id);
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log('Product updated:', product);
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error.message, error.stack);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  console.log('DELETE /api/products received:', { id });
  try {
    const product = await Product.findById(id);
    if (!product) {
      console.error('Product not found:', id);
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.imageUrl) {
      const imagePath = path.join(publicPath, product.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Deleted image:', imagePath);
      }
    }
    await Product.findByIdAndDelete(id);
    await Cart.deleteMany({ 'product.productId': id });
    console.log('Product deleted:', id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error.message, error.stack);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// Add to Cart
app.post('/api/cart', async (req, res) => {
  const { productId } = req.body;
  const username = req.headers['x-username'];
  console.log('POST /api/cart received:', { productId, username });
  try {
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: `Product with ID ${productId} not found` });
    }
    let cartItem = await Cart.findOne({ userId: user._id, 'product.productId': productId });
    if (cartItem) {
      return res.status(400).json({ message: 'Product already in cart', quantity: cartItem.quantity });
    }
    cartItem = new Cart({
      userId: user._id,
      product: {
        productId: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl
      },
      quantity: 1
    });
    await cartItem.save();
    console.log('Cart item added:', cartItem);
    res.status(201).json({ message: 'Item added to cart successfully', quantity: cartItem.quantity });
  } catch (error) {
    console.error('Error adding to cart:', error.message, error.stack);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product already in cart' });
    }
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

// Update Quantity
app.put('/api/cart', async (req, res) => {
  const { productId, quantity } = req.body;
  const username = req.headers['x-username'];
  console.log('PUT /api/cart received:', { productId, quantity, username });
  try {
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product ID or quantity' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const cartItem = await Cart.findOne({ userId: user._id, 'product.productId': productId });
    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    cartItem.quantity = quantity;
    await cartItem.save();
    console.log('Cart item updated:', cartItem);
    res.status(200).json({ message: 'Quantity updated successfully', quantity: cartItem.quantity });
  } catch (error) {
    console.error('Error updating cart:', error.message, error.stack);
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
});

// Remove Single Item
app.delete('/api/cart/item/:productId', async (req, res) => {
  const { productId } = req.params;
  const username = req.headers['x-username'];
  console.log('DELETE /api/cart/item received:', { productId, username });
  try {
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const result = await Cart.deleteOne({ userId: user._id, 'product.productId': productId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    console.log('Cart item removed:', productId);
    res.status(200).json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Error removing cart item:', error.message, error.stack);
    res.status(500).json({ message: 'Error removing item', error: error.message });
  }
});

// Get Cart Counts
app.get('/api/cart/counts', async (req, res) => {
  const username = req.headers['x-username'];
  console.log('GET /api/cart/counts received:', { username });
  try {
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const cartItems = await Cart.find({ userId: user._id });
    const counts = cartItems.reduce((acc, item) => {
      acc[item.product.productId] = item.quantity;
      return acc;
    }, {});
    console.log('Cart counts:', counts);
    res.status(200).json(counts);
  } catch (error) {
    console.error('Error fetching cart counts:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching cart counts', error: error.message });
  }
});

// Get Cart Items
app.get('/api/cart', async (req, res) => {
  const username = req.headers['x-username'];
  console.log('GET /api/cart received:', { username });
  try {
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const cartItems = await Cart.find({ userId: user._id });
    const response = cartItems.map(item => ({
      _id: item.product.productId,
      name: item.product.name,
      description: item.product.description,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity
    }));
    console.log('Cart items fetched:', response.length);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching cart items:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching cart items', error: error.message });
  }
});

// Clear Cart
app.delete('/api/cart', async (req, res) => {
  const username = req.headers['x-username'];
  console.log('DELETE /api/cart received:', { username });
  try {
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await Cart.deleteMany({ userId: user._id });
    console.log('Cart cleared for user:', username);
    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error.message, error.stack);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

// Save Order
app.post('/api/order', async (req, res) => {
  const { username, cartItems, deliveryDetails, paymentMode, paymentDetails, totalPrice, deliveryCharge, finalTotal } = req.body;
  console.log('Order request:', { username, paymentMode, totalPrice, cartItems });
  try {
    if (!username || !cartItems || !deliveryDetails || !paymentMode || !totalPrice || !finalTotal) {
      return res.status(400).json({ message: 'Username, cart items, delivery details, payment mode, total price, and final total are required' });
    }
    if (!['card', 'cod'].includes(paymentMode)) {
      return res.status(400).json({ message: 'Invalid payment mode. Must be "card" or "cod"' });
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart items must be a non-empty array' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const formattedItems = [];
    for (const item of cartItems) {
      if (!item._id) {
        console.error('Invalid cart item: Missing _id', item);
        return res.status(400).json({ message: `Invalid cart item: Missing product ID for ${item.name || 'unknown item'}` });
      }
      let product;
      try {
        product = await Product.findById(item._id);
        console.log(`Found product for _id ${item._id}:`, product);
      } catch (error) {
        console.error(`Error finding product by ID ${item._id}:`, error.message);
        return res.status(400).json({ message: `Invalid product ID: ${item._id}` });
      }
      if (!product) {
        console.error(`Product not found for ID ${item._id}`);
        return res.status(404).json({ message: `Product ${item.name || item._id} not found` });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}: ${item.quantity}` });
      }
      if (product.stock < item.quantity) {
        console.error(`Insufficient stock for ${product.name}: ${product.stock} < ${item.quantity}`);
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }
      product.stock -= item.quantity;
      product.sold = (product.sold || 0) + item.quantity;
      await product.save();
      console.log(`Updated product ${product.name}: stock=${product.stock}, sold=${product.sold}`);
      formattedItems.push(`${product.name} x${item.quantity}`);
    }
    const order = new Order({
      username,
      cartItems,
      items: formattedItems,
      deliveryDetails,
      paymentMode,
      paymentDetails: paymentMode === 'card' ? {
        name: paymentDetails.name,
        lastFourDigits: paymentDetails.cardNumber ? paymentDetails.cardNumber.slice(-4) : '',
        expiry: paymentDetails.expiry,
        cvv: '***'
      } : {},
      totalPrice,
      deliveryCharge: paymentMode === 'cod' ? deliveryCharge : 0,
      finalTotal,
      date: new Date().toISOString().split('T')[0]
    });
    await order.save();
    console.log('Order saved to database:', { orderId: order._id });
    await Cart.deleteMany({ userId: user._id });
    console.log('Order saved:', { username, orderId: order._id });
    res.status(201).json({ message: 'Order saved successfully', orderId: order._id });
  } catch (error) {
    console.error('Error saving order:', error.message, error.stack);
    res.status(500).json({ message: 'Error saving order', error: error.message });
  }
});

// Repair Request
app.get('/api/repair', isAdmin, async (req, res) => {
  try {
    const repairs = await Repair.find();
    console.log('Fetched repairs:', repairs.length);
    res.json(repairs);
  } catch (error) {
    console.error('Error fetching repairs:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching repairs', error: error.message });
  }
});

app.post('/api/repair', async (req, res) => {
  const { equipmentName, issueDescription, username } = req.body;
  console.log('POST /api/repair received:', { equipmentName, issueDescription, username });
  try {
    if (!equipmentName || !issueDescription || !username) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const repair = new Repair({ equipmentName, issueDescription, username });
    await repair.save();
    console.log('Repair request saved:', repair);
    res.status(201).json({ message: 'Repair request submitted' });
  } catch (error) {
    console.error('Error submitting repair:', error.message, error.stack);
    res.status(500).json({ message: 'Error submitting repair', error: error.message });
  }
});

// Get User Notifications
app.get('/api/notify-repair', async (req, res) => {
  const username = req.headers['x-username'];
  console.log('Fetch notifications for:', username);
  try {
    if (!username) {
      return res.status(401).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch order notifications
    const orders = await Order.find({ username }).sort({ createdAt: -1 }).limit(10);
    const orderNotifications = orders.map(order => ({
      type: 'order',
      title: `Order #${order._id.toString().slice(-6)} Confirmed`,
      message: `Your order for ${order.cartItems.length} item(s) has been confirmed. Total: Rs.${order.finalTotal}.`,
      createdAt: order.createdAt
    }));

    // Fetch repair submission notifications
    const repairs = await Repair.find({ username }).sort({ createdAt: -1 }).limit(10);
    const repairSubmissionNotifications = repairs.map(repair => ({
      type: 'repair',
      title: `Repair Request for ${repair.equipmentName}`,
      message: `Your repair request for ${repair.equipmentName} has been submitted. We'll contact you soon.`,
      createdAt: repair.createdAt
    }));

    // Fetch repair status update notifications from user's notifications array
    const userNotifications = (user.notifications || []).map(notification => ({
      type: 'repair',
      title: `Repair Status Update`,
      message: notification.message,
      createdAt: notification.date
    }));

    // Combine all notifications and sort by createdAt
    const notifications = [
      ...orderNotifications,
      ...repairSubmissionNotifications,
      ...userNotifications
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 20);

    console.log('Notifications fetched:', notifications.length, notifications);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Admin Stats Endpoint
app.get('/api/admin-stats', isAdmin, async (req, res) => {
  try {
    const products = await Product.find().select('id name price stock sold');
    const orders = await Order.find().select('username cartItems items date totalPrice finalTotal');
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      sold: product.sold
    }));
    const formattedOrders = orders.map(order => ({
      orderId: order._id.toString(),
      customer: order.username,
      date: order.date,
      total: order.finalTotal,
      items: order.items
    }));
    console.log('Admin stats fetched:', { products: formattedProducts.length, orders: formattedOrders.length });
    res.status(200).json({
      products: formattedProducts,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
  }
});

// Update Repair Status and Notify User
app.put('/api/repair/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log('PUT /api/repair received:', { id, status, username: req.headers['x-username'] });
  try {
    if (!status || !['pending', 'in-progress', 'completed'].includes(status)) {
      console.error('Validation failed: Invalid status', { status });
      return res.status(400).json({ message: 'Valid status is required (pending, in-progress, completed)' });
    }
    const repair = await Repair.findById(id);
    if (!repair) {
      console.error('Repair not found:', id);
      return res.status(404).json({ message: 'Repair request not found' });
    }
    repair.status = status;
    repair.reviewed = true;
    await repair.save();
    console.log('Repair updated:', { id, status, reviewed: repair.reviewed });

    // Notify user for 'in-progress' or 'completed' statuses
    if (['in-progress', 'completed'].includes(status)) {
      const user = await User.findOne({ username: repair.username });
      if (user) {
        console.log('Found user for notification:', user.username);
        user.notifications.push({
          message: `Your repair request for ${repair.equipmentName} has been updated to "${status}".`,
          date: new Date(),
          read: false
        });
        await user.save();
        console.log('Notification added to user:', user.username, user.notifications[user.notifications.length - 1]);
      } else {
        console.error('User not found for username:', repair.username);
      }
    } else {
      console.log('No notification sent for status:', status);
    }

    res.status(200).json({ message: 'Repair status updated and user notified', repair });
  } catch (error) {
    console.error('Error updating repair status:', error.message, error.stack);
    res.status(500).json({ message: 'Error updating repair status', error: error.message });
  }
});

// Delete Repair (Admin Only)
app.delete('/api/repair/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  console.log('DELETE /api/repair received:', { id, username: req.headers['x-username'] });
  try {
    const repair = await Repair.findById(id);
    if (!repair) {
      console.error('Repair not found:', id);
      return res.status(404).json({ message: 'Repair request not found' });
    }
    await Repair.findByIdAndDelete(id);
    console.log('Repair deleted:', id);
    res.status(200).json({ message: 'Repair deleted successfully' });
  } catch (error) {
    console.error('Error deleting repair:', error.message, error.stack);
    res.status(500).json({ message: 'Error deleting repair', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));