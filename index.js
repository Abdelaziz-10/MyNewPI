const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "yamanote.proxy.rlwy.net",
  port: 20415,
  user: "root",
  password: "WQLMOVWXcZkTRFnqahLWEpcrFygljZAS",
  database: "railway",
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to MySQL");
});

// Root route
app.get("/", (req, res) => {
  res.send("🚀 API is running. Use /products to get data.");
});

// GET /products or /products?ProductBarcode=...
app.get("/products", (req, res) => {
  const { ProductBarcode } = req.query;

  let query = "SELECT * FROM Products";
  const params = [];

  if (ProductBarcode) {
    query += " WHERE ProductBarcode = ?";
    params.push(ProductBarcode);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json(err);

    const productIds = results.map((p) => p.Id);
    if (productIds.length === 0) return res.json([]);

    const placeholders = productIds.map(() => "?").join(",");

    db.query(
      `SELECT ProductId, ImageUrl FROM ProductImages WHERE ProductId IN (${placeholders})`,
      productIds,
      (imgErr, imgResults) => {
        if (imgErr) return res.status(500).json(imgErr);

        results.forEach((p) => {
          p.Images = imgResults
            .filter((img) => img.ProductId === p.Id)
            .map((img) => img.ImageUrl);
        });

        res.json(results);
      }
    );
  });
});

// GET product images
app.get("/products/:id/images", (req, res) => {
  db.query(
    "SELECT ImageUrl FROM ProductImages WHERE ProductId = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results.map((row) => row.ImageUrl));
    }
  );
});

// Add a Product
app.post("/products", (req, res) => {
  const {
    ProductName,
    ProductBarcode,
    Description,
    Price,
    Normal_price,
    Vendor,
  } = req.body;

  const query = `
    INSERT INTO Products (ProductName, ProductBarcode, Description, Price, Normal_price, Vendor)
    VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(
    query,
    [ProductName, ProductBarcode, Description, Price, Normal_price, Vendor],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ id: result.insertId, message: "Product added" });
    }
  );
});

// Add image to product
app.post("/products/:id/images", (req, res) => {
  const { ImageUrl } = req.body;
  const ProductId = req.params.id;

  db.query(
    "INSERT INTO ProductImages (ProductId, ImageUrl) VALUES (?, ?)",
    [ProductId, ImageUrl],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ id: result.insertId, message: "Image added" });
    }
  );
});

// Update product
app.put("/products/:id", (req, res) => {
  const {
    ProductName,
    ProductBarcode,
    Description,
    Price,
    Normal_price,
    Vendor,
  } = req.body;
  const ProductId = req.params.id;

  const query = `
    UPDATE Products SET 
    ProductName = ?, ProductBarcode = ?, Description = ?, Price = ?, Normal_price = ?, Vendor = ?
    WHERE Id = ?`;

  db.query(
    query,
    [
      ProductName,
      ProductBarcode,
      Description,
      Price,
      Normal_price,
      Vendor,
      ProductId,
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Product updated" });
    }
  );
});

// Delete product
app.delete("/products/:id", (req, res) => {
  const ProductId = req.params.id;

  db.query("DELETE FROM Products WHERE Id = ?", [ProductId], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Product deleted" });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
