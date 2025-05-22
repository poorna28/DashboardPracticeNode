
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create an Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // 👈 necessary to parse JSON bodies


// MySQL configuration
const dbConfig = {
  host: '20.64.249.116',
  user: 'charan',
  password: 'charan', // Add your MySQL password if set
  database: 'user_management'
};

// Create MySQL connection pool (better than single connection)
const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
});

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err.stack);
    process.exit(1);
  }
  
  console.log('Connected to MySQL database');
  connection.release(); // Release the connection back to the pool
  
  // Set up routes
  setupRoutes();
});

function setupRoutes() {
  // API Routes

// Update the /users endpoint to include password
app.post('/users', (req, res) => {
  const { name, email, password, mobile_number } = req.body;
  
  if (!name || !email || !password || !mobile_number) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = 'INSERT INTO users (name, email, password, mobile_number) VALUES (?, ?, ?, ?)';
  
  pool.query(query, [name, email, password, mobile_number], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error adding user', error: err.message });
    }
    res.status(201).json({ 
      message: 'User added successfully', 
      userId: result.insertId 
    });
  });
});

  // Get all users (GET request)
  app.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';
    
    pool.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching users', error: err.message });
      }
      res.status(200).json(results);
    });
  });

  // Get user by ID (GET request)
  app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT * FROM users WHERE id = ?';
    
    pool.query(query, [userId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching user', error: err.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(results[0]);
    });
  });

  // Update user (PUT request)
  app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, email, mobile_number } = req.body;
    
    if (!name || !email || !mobile_number) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = 'UPDATE users SET name = ?, email = ?, mobile_number = ? WHERE id = ?';
    
    pool.query(query, [name, email, mobile_number, userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error updating user', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User updated successfully' });
    });
  });

  // Delete user (DELETE request)
  app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'DELETE FROM users WHERE id = ?';
    
    pool.query(query, [userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error deleting user', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
    });
  });

  app.post('/login', (req, res) => {
    const { email, password } = req.body; // Only need email & password
  
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
  
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    
    pool.query(query, [email, password], (err, results) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ 
          success: false, 
          message: 'Database error' 
        });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
  
      // Success: Return user data (excluding password)
      const user = results[0];
      delete user.password;
      
      res.status(200).json({ 
        success: true, 
        user: user 
      });
    });
  });

// New Signup Route (POST /signup)
// Backend signup route
app.post('/signup', (req, res) => {
  const { name, email, password, mobile_number } = req.body;

  if (!name || !email || !password || !mobile_number) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Check if the email already exists
  const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
  pool.query(checkEmailQuery, [email], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Email check error:", checkErr);
      return res.status(500).json({ success: false, message: 'Database error during email check' });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Insert new user with password
    const insertQuery = 'INSERT INTO users (name, email, password, mobile_number) VALUES (?, ?, ?, ?)';
    pool.query(insertQuery, [name, email, password, mobile_number], (insertErr, result) => {
      if (insertErr) {
        console.error("Signup insert error:", insertErr);
        return res.status(500).json({ success: false, message: 'Error registering user' });
      }

      res.status(201).json({ 
        success: true, 
        message: 'User registered successfully', 
        userId: result.insertId 
      });
    });
  });
});

// Get all students
app.get('/students', (req, res) => {
  const query = 'SELECT * FROM students';

  pool.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error fetching students', error: err.message });
    }
    res.status(200).json(results);
  });
});

// Add a new student
app.post('/students', (req, res) => {
  const { name, email, mobile_number } = req.body;

  // Check required fields (do NOT include id here)
  if (!name || !email || !mobile_number) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Insert query without id (assuming id is auto-increment primary key)
  const query = 'INSERT INTO students (name, email, mobile_number) VALUES (?, ?, ?)';

  pool.query(query, [name, email, mobile_number], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error adding student', error: err.message });
    }
    res.status(201).json({ 
      message: 'Student added successfully', 
      studentId: result.insertId 
    });
  });
});

// Update a student
app.put('/students/:id', (req, res) => {
  const studentId = req.params.id;
  const { name, email, mobile_number } = req.body;

  if (!name || !email || !mobile_number) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = 'UPDATE students SET name = ?, email = ?, mobile_number = ? WHERE id = ?';

  pool.query(query, [name, email, mobile_number, studentId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error updating student', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student updated successfully' });
  });
});

// Delete a student
app.delete('/students/:id', (req, res) => {
  const studentId = req.params.id;
  const query = 'DELETE FROM students WHERE id = ?';

  pool.query(query, [studentId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error deleting student', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted successfully' });
  });
});





  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  // Start the server
  const PORT = process.env.PORT || 3034;
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://20.64.249.116:${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully');
    server.close(() => {
      pool.end(() => {
        console.log("gitaccess")
        console.log('Database pool closed');
        process.exit(0);
      });
    });
  });
}