const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { db } = require("./db");
dotenv.config();
const bodyParser = require("body-parser");
const Router = require("./routers/userdataroutes");

const cron = require("node-cron");
const moment = require("moment-timezone");
// const httpLogger = require("./httpLogger");
const errorHandler = require("./errorHandler");
const { scheduleDailyBackups, doBackupOnce } = require("./backupJobs");
const authenticate = require("./Middleware/authMiddleware");

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// app.use(httpLogger);

app.use(express.static(path.join(__dirname, "build")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use("/api", Router);

app.use("/Assets", express.static(path.join(__dirname, "Assets")));
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

app.get("/api/download-sample-bulk-lead", (req, res) => {
  const filePath = path.join(
    __dirname,
    "sample-file",
    "sample_leads_upload.xlsx",
  );

  res.download(filePath, "sample_leads_upload.xlsx", (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("Could not download the file.");
    }
  });
});

app.get("/api/download-sample-bulk-unit", (req, res) => {
  const filePath = path.join(
    __dirname,
    "sample-file",
    "sample_bulk_units_upload.xlsx",
  );

  res.download(filePath, "sample_bulk_units_upload.xlsx", (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("Could not download the file.");
    }
  });
});

app.get("*", (req, res, next) => {
  if (req.url.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.post("/api/admin/backup-now", async (req, res) => {
  try {
    await doBackupOnce();
    res.json({ success: true, message: "Backup created successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

scheduleDailyBackups();

// app.use(authenticate);

app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
