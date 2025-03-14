const { faker } = require("@faker-js/faker");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const express = require("express");
require("dotenv").config();
const app = express();
const port = 3000;
const path = require("path");
const methodOverride = require("method-override");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Create and connect to MySQL database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
connection.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL Database");
});

// Home page: display number of users
app.get("/", (req, res) => {
  const q = "SELECT COUNT(*) FROM User";
  connection.query(q, (err, result) => {
    if (err) return res.status(500).send("Error occurred");
    const count = result[0]["COUNT(*)"];
    res.render("home", { count });
  });
});

// Users page: display list of users
app.get("/users", (req, res) => {
  const qCount = "SELECT COUNT(*) FROM User";
  const qUsers = `SELECT id, username, email, DATE_FORMAT(Timestamp, '%Y-%m-%d %H:%i:%s') AS Timestamp 
                  FROM User ORDER BY Timestamp DESC`;
  connection.query(qCount, (err, result) => {
    if (err) return res.status(500).send("Error occurred");
    const count = result[0]["COUNT(*)"];
    connection.query(qUsers, (err, result) => {
      if (err) return res.status(500).send("Error occurred");
      res.render("users", { count, result });
    });
  });
});

// Edit user page
app.get("/users/:id/edit", (req, res) => {
  const { id } = req.params;
  const q = `SELECT * FROM User WHERE id='${id}'`;
  connection.query(q, (err, result) => {
    if (err) return res.status(500).send("Error occurred");
    const users = result[0];
    res.render("edit", { id, users });
  });
});

// Update user data
app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username: newUser, email: newEmail, password: formPass } = req.body;
  const qSelect = `SELECT * FROM User WHERE id='${id}'`;

  connection.query(qSelect, async (err, result) => {
    if (err) return res.status(500).send("Error occurred");
    const user = result[0];

    // Compare provided password with stored hashed password
    const match = await bcrypt.compare(formPass, user.password);
    if (!match) {
      return res.send("Incorrect Password, Please try again!");
    }

    const qUpdate = `UPDATE User SET username='${newUser}', email='${newEmail}', Timestamp = NOW() WHERE id='${id}'`;
    connection.query(qUpdate, (err) => {
      if (err) return res.status(500).send("Error occurred");
      res.redirect("/users");
    });
  });
});

// Add user page
app.get("/users/add", (req, res) => {
  res.render("add");
});

// Add new user
app.post("/users", async (req, res) => {
  const getRandomId = () => faker.string.uuid();
  const id = getRandomId();
  const { username, email, password } = req.body;

  try {
    // Hash the password before storing it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const qInsert = `INSERT INTO User VALUES (?,?,?,?, NOW())`;
    connection.query(qInsert, [id, username, email, hashedPassword], (err) => {
      if (err) return res.status(500).send("Error occurred");
      res.redirect("/users");
    });
  } catch (err) {
    console.error("Error hashing password:", err);
    return res.status(500).send("Error occurred");
  }
});

// Delete confirmation page
app.get("/users/:id/delete", (req, res) => {
  const { id } = req.params;
  const q = `SELECT * FROM User WHERE id='${id}'`;
  connection.query(q, (err, result) => {
    if (err) return res.status(500).send("Error occurred");
    const users = result[0];
    res.render("delete", { id, users });
  });
});

// Delete user
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { email: formEmail, password: formPass } = req.body;
  const qSelect = `SELECT * FROM User WHERE id='${id}'`;

  connection.query(qSelect, async (err, result) => {
    if (err) return res.status(500).send("Error occurred");
    const user = result[0];
    if (formEmail !== user.email) {
      return res.send("Incorrect Email, Please try again!");
    }
    // Compare the provided password with the stored hashed password
    const match = await bcrypt.compare(formPass, user.password);
    if (!match) {
      return res.send("Incorrect Password, Please try again!");
    }
    const qDelete = `DELETE FROM User WHERE id='${id}'`;
    connection.query(qDelete, (err) => {
      if (err) return res.status(500).send("Error occurred");
      res.redirect("/users");
    });
  });
});

// Admin verification middleware
function verifyAdmin(req, res, next) {
  const adminName = process.env.ADMIN_NAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminName || !adminPass) {
    return res.status(500).send("Admin credentials are not configured.");
  }
  const { username, password } = req.body;

  if (username !== adminName && password !== adminPass) {
    return res.send("Incorrect username & password, Please try again!");
  } else if (username !== adminName) {
    return res.send("Incorrect Username, Please try again!");
  } else if (password !== adminPass) {
    return res.send("Incorrect Password, Please try again!");
  }

  next();
}

// Admin page for deletion or insertion actions
app.get("/users/:param/admin", (req, res) => {
  const { param } = req.params;
  const method = param === "delete-all" ? "DELETE" : "POST";
  res.render("admin", { method, param });
});

// Delete all users (admin)
app.delete("/users/delete-all/admin", verifyAdmin, (req, res) => {
  const q = "TRUNCATE TABLE User";
  connection.query(q, (err) => {
    if (err) return res.status(500).send("Error occurred");
    res.redirect("/users");
  });
});

// Insert 5 random users (admin)
app.post("/users/insert-5/admin", verifyAdmin, (req, res) => {
  const getRandomUser = () => {
    const id = faker.string.uuid();
    const username = faker.internet.username();
    const email = faker.internet.email();
    // Synchronously hash the generated password
    const plainPassword = faker.internet.password();
    const hashedPassword = bcrypt.hashSync(plainPassword, 10);
    return [id, username, email, hashedPassword];
  };
  const q = `INSERT INTO User (id, username, email, password) VALUES ?`;
  const users = [];
  for (let i = 0; i < 5; i++) {
    users.push(getRandomUser());
  }
  connection.query(q, [users], (err) => {
    if (err) return res.status(500).send("Error occurred");
    res.redirect("/users");
  });
});

// 404 Page Not Found handler
app.use((req, res) => {
  res.status(404).send("404: Page Not Found");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send("Something broke!");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
