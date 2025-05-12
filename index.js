const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Replace with your Railway MySQL info or use environment variables
const db = mysql.createConnection({
  host: "yamanote.proxy.rlwy.net",
  port: 20415,
  user: "root",
  password: "WQLMOVWXcZkTRFnqahLWEpcrFygljZAS",
  database: "railway"
});

// Test DB connection
db.connect(err => {
  if (err) throw err;
  console.log("✅ Connected to MySQL");
});

// GET all products
app.get('/products', (req, res) => {
  db.query('SELECT * FROM Products', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET product images
app.get('/products/:id/images', (req, res) => {
  db.query(
    'SELECT ImageUrl FROM ProductImages WHERE ProductId = ?',
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results.map(row => row.ImageUrl));
    }
  );
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
