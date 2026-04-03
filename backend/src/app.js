const express = require("express");

const { corsMiddleware } = require("./config/cors");
const errorHandler = require("./middleware/error.middleware");
const rateLimiter = require("./middleware/rateLimit.middleware");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const recordRoutes = require("./routes/record.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.use("/api", rateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "LedgerGuard",
    docs: "See README for routes and roles",
  });
});

app.use(errorHandler);

module.exports = app;
