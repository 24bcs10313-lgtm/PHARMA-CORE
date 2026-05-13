const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'pharma_secret_key_123';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for File Uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid Token' });
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (!req.user || req.user.isAdmin !== 1) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, address } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const isAdmin = email.toLowerCase() === 'admin@pharma.com' ? 1 : 0;

        db.run(`INSERT INTO users (name, email, password, address, isAdmin) VALUES (?, ?, ?, ?, ?)`, 
        [name, email, hashedPassword, address || '', isAdmin], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) return res.status(400).json({ error: 'Email already exists' });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully!' });
        });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, name: user.name, isAdmin: user.isAdmin, address: user.address, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, address: user.address, isAdmin: user.isAdmin } });
    });
});

// 1. Get all medicines
app.get('/api/medicines', (req, res) => {
    db.all("SELECT * FROM medicines", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. Submit an order (with optional prescription upload)
app.post('/api/orders', authenticateToken, upload.single('prescription'), (req, res) => {
    const { customerName, customerEmail, customerAddress, totalAmount, cartItems } = req.body;
    const prescriptionImage = req.file ? `/uploads/${req.file.filename}` : null;
    const userId = req.user.id;

    if (!customerName || !customerAddress || !totalAmount || !cartItems) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.run(
        `INSERT INTO orders (userId, customerName, customerEmail, customerAddress, totalAmount, prescriptionImage) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, customerName, customerEmail, customerAddress, totalAmount, prescriptionImage],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const orderId = this.lastID;
            
            // Insert order items
            try {
                const items = JSON.parse(cartItems);
                const stmt = db.prepare(`INSERT INTO order_items (orderId, medicineId, quantity, price) VALUES (?, ?, ?, ?)`);
                items.forEach(item => {
                    stmt.run([orderId, item.id, item.quantity, item.price]);
                });
                stmt.finalize();
                res.status(201).json({ message: 'Order placed successfully', orderId });
            } catch (error) {
                res.status(500).json({ error: 'Failed to process cart items' });
            }
        }
    );
});

// 3. Get all orders (for Admin/Pharmacist) with their items
app.get('/api/orders', requireAdmin, (req, res) => {
    db.all("SELECT * FROM orders ORDER BY createdAt DESC", [], (err, orders) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (orders.length === 0) {
            return res.json([]);
        }

        db.all(`
            SELECT oi.orderId, oi.quantity, oi.price, m.name 
            FROM order_items oi 
            JOIN medicines m ON oi.medicineId = m.id
        `, [], (err, allItems) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const ordersWithItems = orders.map(order => {
                const itemsForOrder = allItems.filter(item => item.orderId === order.id);
                return { ...order, items: itemsForOrder };
            });
            
            res.json(ordersWithItems);
        });
    });
});

app.post('/api/medicines', requireAdmin, (req, res) => {
    const { name, description, price, category, image, requiresPrescription } = req.body;
    db.run(
        `INSERT INTO medicines (name, description, price, category, image, requiresPrescription) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description, price || 0, category || 'Others', image || 'https://placehold.co/400x400/E2E8F0/1E293B?text=Medicine', requiresPrescription ? 1 : 0],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Medicine added successfully', id: this.lastID });
        }
    );
});

// 4. Update order status
app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Approved', 'Shipped', 'Rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    db.run(
        `UPDATE orders SET status = ? WHERE id = ?`,
        [status, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }
            res.json({ message: 'Order status updated successfully' });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
