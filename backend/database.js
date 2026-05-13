const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pharmacy.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Initialize Tables
        db.serialize(() => {
            // Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                address TEXT,
                isAdmin INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Medicines Table
            db.run(`CREATE TABLE IF NOT EXISTS medicines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                image TEXT,
                requiresPrescription INTEGER DEFAULT 0
            )`);

            // Orders Table
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                customerName TEXT NOT NULL,
                customerEmail TEXT,
                customerAddress TEXT NOT NULL,
                totalAmount REAL NOT NULL,
                status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Shipped', 'Rejected')),
                prescriptionImage TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, () => {
                // Safely add userId if table already existed structurally
                db.run("ALTER TABLE orders ADD COLUMN userId INTEGER", (err) => {});
            });

            // Order Items Table
            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                orderId INTEGER,
                medicineId INTEGER,
                quantity INTEGER,
                price REAL,
                FOREIGN KEY(orderId) REFERENCES orders(id),
                FOREIGN KEY(medicineId) REFERENCES medicines(id)
            )`);

            // Seed initial data if empty
            db.get("SELECT count(*) as count FROM medicines", (err, row) => {
                if (row.count === 0) {
                    const stmt = db.prepare("INSERT INTO medicines (name, description, price, category, image, requiresPrescription) VALUES (?, ?, ?, ?, ?, ?)");
                    stmt.run("Paracetamol 500mg", "Relieves pain and fever", 5.99, "Pain Relief", "https://via.placeholder.com/150", 0);
                    stmt.run("Amoxicillin 250mg", "Antibiotic for bacterial infections", 15.50, "Antibiotics", "https://via.placeholder.com/150", 1);
                    stmt.run("Vitamin C Supplements", "Immune system support", 12.00, "Supplements", "https://via.placeholder.com/150", 0);
                    stmt.run("Ibuprofen 400mg", "Anti-inflammatory pain relief", 8.49, "Pain Relief", "https://via.placeholder.com/150", 0);
                    stmt.run("Cough Syrup", "Relieves dry cough", 20.00, "Cold & Flu", "https://via.placeholder.com/150", 0);
                    stmt.finalize();
                    console.log("Seeded initial medicines.");
                }
            });
        });
    }
});

module.exports = db;
