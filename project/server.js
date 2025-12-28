import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const OWNER_EMAIL = 'canteen@vit.edu';

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailRegex = /^[a-zA-Z]+\.[0-9]+@vit\.edu$/;
    if (!emailRegex.test(email) && email !== OWNER_EMAIL) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const prnFromEmail = email === OWNER_EMAIL ? 'canteen' : email.split('.')[1].split('@')[0];
    if (password !== prnFromEmail) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const result = await pool.query(
      'SELECT id, email, role, full_name FROM users WHERE email = $1 AND prn_hash = $2',
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create order endpoint
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, items, total, paymentMethod, paymentStatus } = req.body;
    if (!userId || !items || !total) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const userResult = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [userId]);
    const userData = userResult.rows[0];
    const paymentTime = new Date().toISOString();
    const validTillTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const paymentData = {
      studentName: userData?.full_name || 'Student',
      studentEmail: userData?.email || '',
    };
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, items, total, status, payment_method, payment_status, payment_time, valid_till_time, payment_data)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8) RETURNING *`,
      [userId, JSON.stringify(items), total, paymentMethod || 'CASH', paymentStatus || 'CASH', paymentTime, validTillTime, JSON.stringify(paymentData)]
    );
    const order = orderResult.rows[0];
    const receipt = {
      studentName: userData?.full_name || 'Student',
      studentEmail: userData?.email || '',
      orderId: order.id,
      items,
      totalAmount: total,
      paymentMethod: paymentMethod || 'CASH',
      paymentStatus: paymentStatus === 'PAID' ? 'SUCCESS' : 'PENDING',
      paymentTime,
      validTillTime,
    };
    res.status(201).json({ success: true, order, receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get ALL orders endpoint - MUST BE BEFORE :userId route
app.get('/api/orders/all', async (req, res) => {
  try {
    const ownerEmail = req.headers['x-owner-email'];
    if (ownerEmail !== OWNER_EMAIL) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Get user's orders endpoint - AFTER /all route
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Update order status endpoint
app.patch('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const ownerEmail = req.headers['x-owner-email'];
    if (ownerEmail !== OWNER_EMAIL) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!['ACCEPTED', 'READY', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, orderId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Health check
app.get('/api/healthz', (req, res) => {
  res.json({ status: 'ok', message: 'API running' });
});

// Serve React app for all unmatched routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`App running on port ${PORT}`));
