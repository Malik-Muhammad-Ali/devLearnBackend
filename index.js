const express = require("express");
const cors = require("cors");

// Custom modules
const connect = require("./config/dbConfig");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const quizRoutes = require("./routes/quizRoutes");

const app = express();
const PORT = 6001;

// Database connection
connect();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/quiz', quizRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
