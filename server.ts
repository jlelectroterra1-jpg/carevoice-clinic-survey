import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import cors from "cors";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Allowed cross-origin frontends. The GitHub Pages site (patient-facing) and
// local dev servers need explicit CORS access since they run on a different
// origin than this API. Same-origin requests (e.g. the Render-hosted
// frontend) are never subject to CORS checks, so this list only matters for
// the separated-frontend deployment.
const ALLOWED_ORIGINS = [
  "https://jlelectroterra1-jpg.github.io",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.EXTRA_ALLOWED_ORIGIN ? [process.env.EXTRA_ALLOWED_ORIGIN] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/non-browser requests (no Origin header) and any
    // explicitly allowlisted origin. No credentials are used (auth is via a
    // Bearer token, not cookies), so a strict origin allowlist is enough.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Enable JSON parsing
app.use(express.json());

// Lightweight health/status endpoint. The GitHub Pages frontend polls this
// on startup to detect when Render's free-tier instance has finished waking
// up from sleep, without exposing any implementation detail to the client.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Setup Data Directories
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const SUBMISSIONS_PATH = path.join(DATA_DIR, "submissions.json");

// Cryptographical Encryption/Decryption Helpers for SMTP Passwords (so they are never stored in plain text)
const SESSION_SECRET = process.env.SESSION_SECRET || "arrie-nel-pharmacy-sunningdale-secret-key-32-chars!!";
const key = crypto.createHash("sha256").update(SESSION_SECRET).digest();

function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(text: string): string {
  if (!text) return "";
  try {
    const [ivHex, encryptedHex] = text.split(":");
    if (!ivHex || !encryptedHex) return "";
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return "";
  }
}

// Default settings initialization
const DEFAULT_SETTINGS = {
  adminUsername: process.env.ADMIN_USERNAME || "ArrieNel",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("sunningdale", 10),
  brevoApiKeyEncrypted: process.env.BREVO_API_KEY ? encrypt(process.env.BREVO_API_KEY) : "",
  fromEmail: process.env.FROM_EMAIL || "arrienelsunningdaleclinic@gmail.com",
  branchName: "ARRIE NEL PHARMACY SUNNINGDALE CLINIC",
  branchEmail: "sunningdale@arrienel.co.za",
  headOfficeEmail: process.env.HEAD_OFFICE_EMAIL || "arrienelsunningdaleclinic@gmail.com",
  developmentMode: false
};

// Sends an email via Brevo's HTTP API (port 443) instead of raw SMTP, since
// Render's free tier blocks all outbound traffic on SMTP ports 25/465/587.
async function sendBrevoEmail(params: {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": params.apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { name: params.fromName, email: params.fromEmail },
      to: [{ email: params.to }],
      ...(params.cc ? { cc: [{ email: params.cc }] } : {}),
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errBody}`);
  }
}

function getSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    
    // Automatically migrate from old default 'admin' account to 'ArrieNel'/'sunningdale' for development ease
    if (parsed.adminUsername === "admin") {
      parsed.adminUsername = "ArrieNel";
      parsed.adminPasswordHash = bcrypt.hashSync("sunningdale", 10);
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(parsed, null, 2));
    }
    
    // Ensure developmentMode exists in stored settings
    if (parsed.developmentMode === undefined) {
      parsed.developmentMode = true;
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(parsed, null, 2));
    }

    // Merge potential missing default keys to protect upgrades
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: any) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

function getSubmissions() {
  if (!fs.existsSync(SUBMISSIONS_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(SUBMISSIONS_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveSubmissionRecord(sub: any) {
  const list = getSubmissions();
  // Ensure we generate a unique ID
  const newRecord = {
    id: sub.id || crypto.randomUUID(),
    timestamp: sub.timestamp || new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" }),
    emailStatus: sub.emailStatus || "pending",
    ...sub
  };
  list.push(newRecord);
  fs.writeFileSync(SUBMISSIONS_PATH, JSON.stringify(list, null, 2));
  return newRecord;
}

function updateSubmissionRecord(id: string, updates: Partial<any>) {
  const list = getSubmissions();
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    fs.writeFileSync(SUBMISSIONS_PATH, JSON.stringify(list, null, 2));
    return list[idx];
  }
  return null;
}

function clearSubmissionsRecords() {
  fs.writeFileSync(SUBMISSIONS_PATH, JSON.stringify([], null, 2));
}

// Session Management Store
interface Session {
  token: string;
  username: string;
  lastActive: number;
}
const activeSessions = new Map<string, Session>();
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes inactivity timeout

function validateAndRefreshSession(token: string): Session | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  
  if (Date.now() - session.lastActive > SESSION_TIMEOUT_MS) {
    activeSessions.delete(token);
    return null;
  }
  
  session.lastActive = Date.now();
  return session;
}

// Auth Middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized. Authentication is required." });
  }
  
  const token = authHeader.split(" ")[1];
  const session = validateAndRefreshSession(token);
  if (!session) {
    return res.status(401).json({ success: false, message: "Session expired or invalid. Please log in again." });
  }
  
  next();
}

// Authentication API Endpoints
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }

  const settings = getSettings();
  const usernameMatch = username.trim().toLowerCase() === settings.adminUsername.toLowerCase();
  
  if (!usernameMatch) {
    return res.status(401).json({ success: false, message: "Invalid administrator credentials." });
  }

  const passwordValid = await bcrypt.compare(password, settings.adminPasswordHash);
  if (!passwordValid) {
    return res.status(401).json({ success: false, message: "Invalid administrator credentials." });
  }

  // Create a new session
  const token = crypto.randomUUID();
  const session: Session = {
    token,
    username: settings.adminUsername,
    lastActive: Date.now()
  };
  activeSessions.set(token, session);

  return res.json({
    success: true,
    token,
    username: session.username
  });
});

app.post("/api/admin/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: "Logged out successfully." });
});

app.get("/api/admin/check-session", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ active: false });
  }
  const token = authHeader.split(" ")[1];
  const session = validateAndRefreshSession(token);
  return res.json({ active: !!session, username: session?.username });
});

// Admin Submissions Management
app.get("/api/admin/submissions", requireAdmin, (req, res) => {
  const submissions = getSubmissions();
  return res.json({ success: true, submissions });
});

app.delete("/api/admin/submissions", requireAdmin, (req, res) => {
  clearSubmissionsRecords();
  return res.json({ success: true, message: "Local database submissions cleared successfully." });
});

// Admin Settings Management
app.get("/api/admin/settings", requireAdmin, (req, res) => {
  const settings = getSettings();
  
  // Return settings with API key masked for security
  return res.json({
    success: true,
    settings: {
      adminUsername: settings.adminUsername,
      brevoApiKeyConfigured: !!settings.brevoApiKeyEncrypted,
      fromEmail: settings.fromEmail,
      branchName: settings.branchName,
      branchEmail: settings.branchEmail,
      headOfficeEmail: settings.headOfficeEmail,
      developmentMode: settings.developmentMode !== false
    }
  });
});

app.post("/api/admin/settings", requireAdmin, async (req, res) => {
  const {
    adminUsername,
    adminPassword,
    brevoApiKey,
    fromEmail,
    branchName,
    branchEmail,
    headOfficeEmail,
    developmentMode
  } = req.body;

  const settings = getSettings();

  if (adminUsername && adminUsername.trim() !== "") {
    settings.adminUsername = adminUsername.trim();
  }

  if (adminPassword && adminPassword.trim() !== "") {
    if (adminPassword.length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters long." });
    }
    settings.adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  }

  // Only encrypt new Brevo API key if it's updated and not the masked placeholder
  if (brevoApiKey !== undefined && brevoApiKey !== "" && brevoApiKey !== "********") {
    settings.brevoApiKeyEncrypted = encrypt(brevoApiKey);
  }

  settings.fromEmail = fromEmail !== undefined ? fromEmail.trim() : settings.fromEmail;
  settings.branchName = branchName !== undefined ? branchName.trim() : settings.branchName;
  settings.branchEmail = branchEmail !== undefined ? branchEmail.trim() : settings.branchEmail;
  settings.headOfficeEmail = headOfficeEmail !== undefined ? headOfficeEmail.trim() : settings.headOfficeEmail;
  settings.developmentMode = developmentMode !== undefined ? !!developmentMode : settings.developmentMode;

  saveSettings(settings);

  return res.json({
    success: true,
    message: "Settings updated successfully on the server."
  });
});

// Send Test Email Endpoint
app.post("/api/admin/test-email", requireAdmin, async (req, res) => {
  const settings = getSettings();
  const { testRecipient } = req.body;
  const recipient = testRecipient || settings.headOfficeEmail || "headoffice@arrienel.co.za";

  const apiKey = decrypt(settings.brevoApiKeyEncrypted);
  const from = settings.fromEmail || "no-reply@arrienel.co.za";

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      message: "Brevo configuration is incomplete. Please set the Brevo API key first."
    });
  }

  try {
    await sendBrevoEmail({
      apiKey,
      fromEmail: from,
      fromName: "ARRIE NEL PHARMACY Test",
      to: recipient,
      subject: `🔧 TEST EMAIL: ARRIE NEL PHARMACY SUNNINGDALE CLINIC Survey`,
      text: `Connection Successful! This test email confirms that your Brevo configuration is correctly set up and the survey system can automatically deliver patient reports to the Head Office. Sender Email: ${from}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background-color: #1B365D; border-bottom: 5px solid #E31B23; padding: 25px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">ARRIE NEL PHARMACY</h1>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #93c5fd;">Brevo Test Notification</p>
          </div>
          <div style="padding: 30px; background-color: white;">
            <h3 style="color: #1B365D; margin-top: 0;">Connection Successful!</h3>
            <p style="font-size: 14px; line-height: 1.5; color: #374151;">
              This test email confirms that your Brevo configuration is correctly set up and the survey system can automatically deliver patient reports to the Head Office.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; color: #4b5563; background-color: #f9fafb; border-radius: 8px;">
              <tr><td style="padding: 10px; font-weight: bold;">Sender Email:</td><td style="padding: 10px;">${from}</td></tr>
            </table>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
            <p>© ${new Date().getFullYear()} ARRIE NEL PHARMACY. All rights reserved.</p>
          </div>
        </div>
      `
    });

    return res.json({ success: true, message: `Test email successfully sent to ${recipient}` });
  } catch (error: any) {
    console.error("Test email sending failed:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to deliver test email: ${error.message || String(error)}`
    });
  }
});

// Main Survey POST Submission Endpoint
app.post("/api/survey", async (req, res) => {
  try {
    const {
      branchId,
      branchName,
      branchEmail,
      headOfficeEmail,
      overallExperience,
      efficiencyAccess,
      qualityCare,
      clarityCommunication,
      patientComment,
      serviceCategory,
      serviceReceived,
      isAnonymous,
      patientName,
      patientSurname,
      contactNumber
    } = req.body;

    // Server-side enforcement: never persist or email identity details when
    // the patient chose to remain anonymous, regardless of what the client sent.
    const finalIsAnonymous = isAnonymous !== false;
    const finalPatientName = finalIsAnonymous ? "" : (patientName || "").trim();
    const finalPatientSurname = finalIsAnonymous ? "" : (patientSurname || "").trim();
    const finalContactNumber = finalIsAnonymous ? "" : (contactNumber || "").trim();

    // Validate minimum required fields
    if (!branchId || !overallExperience || !efficiencyAccess || !serviceCategory || !serviceReceived) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. Please ensure service selection and experience ratings are complete."
      });
    }

    // Load active settings to override/supplement client-passed values
    const settings = getSettings();
    const finalBranchName = settings.branchName || branchName || "ARRIE NEL PHARMACY SUNNINGDALE CLINIC";
    const finalBranchEmail = settings.branchEmail || branchEmail || "sunningdale@arrienel.co.za";
    const finalHeadOfficeEmail = settings.headOfficeEmail || headOfficeEmail || "headoffice@arrienel.co.za";

    // Determine urgency: Overall experience <= 2, or quality of care is No
    const isUrgent = overallExperience <= 2 || qualityCare === "No";

    // Unique reference per submission so Gmail treats each as its own email
    // instead of grouping them into one conversation thread (identical subject
    // lines are what trigger Gmail's threading behavior).
    const submissionId = crypto.randomUUID();
    const referenceCode = submissionId.slice(0, 8).toUpperCase();

    // Subject line (correct name spelling is ARRIE NEL PHARMACY)
    const subjectPrefix = isUrgent ? "🚨 URGENT: Poor Clinic Experience" : "New Patient Clinic Survey";
    const subject = `${subjectPrefix} – ${finalBranchName} [Ref #${referenceCode}]`;

    // Format current Johannesburg timestamp
    const submissionTime = new Date().toLocaleString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      dateStyle: "full",
      timeStyle: "medium"
    });

    // Save submission locally to our secure backend database file
    const savedRecord = saveSubmissionRecord({
      id: submissionId,
      branchId,
      branchName: finalBranchName,
      overallExperience,
      efficiencyAccess,
      qualityCare,
      clarityCommunication,
      patientComment,
      serviceCategory,
      serviceReceived,
      isUrgent,
      isAnonymous: finalIsAnonymous,
      patientName: finalPatientName,
      patientSurname: finalPatientSurname,
      contactNumber: finalContactNumber
    });

    // Create styled HTML email template matching Arrie Nel Pharmacy Sunningdale Clinic
    const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f3f4f6;
          color: #1f2937;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
        }
        .header {
          background-color: #1B365D; /* Arrie Nel Dark Blue */
          padding: 30px;
          text-align: center;
          color: #ffffff;
          border-bottom: 5px solid #E31B23; /* Arrie Nel Bright Red */
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
          text-transform: uppercase;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 14px;
          color: #93c5fd;
          font-weight: 500;
        }
        .urgent-banner {
          background-color: #fee2e2;
          border-left: 6px solid #e11d48;
          color: #991b1b;
          padding: 16px 20px;
          font-weight: bold;
          font-size: 15px;
          margin: 20px;
          border-radius: 6px;
        }
        .content {
          padding: 30px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1B365D;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 8px;
          margin-top: 0;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .metric-grid {
          margin-bottom: 25px;
        }
        .metric-card {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 12px;
          border: 1px solid #f3f4f6;
        }
        .metric-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .metric-value-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .metric-value {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .rating-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .rating-excellent { background-color: #dcfce7; color: #166534; }
        .rating-good { background-color: #e0f2fe; color: #0369a1; }
        .rating-fair { background-color: #fef9c3; color: #854d0e; }
        .rating-poor { background-color: #fee2e2; color: #991b1b; }
        
        .answer-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        .answer-yes { background-color: #dcfce7; color: #15803d; }
        .answer-no { background-color: #fee2e2; color: #b91c1c; }
        .answer-somewhat { background-color: #fef3c7; color: #b45309; }

        .comment-box {
          background-color: #f9fafb;
          border-left: 4px solid #1B365D;
          padding: 15px 20px;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #374151;
          margin-top: 15px;
          line-height: 1.6;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 25px;
          font-size: 13px;
          color: #4b5563;
          background-color: #f9fafb;
          border-radius: 8px;
          overflow: hidden;
        }
        .meta-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .meta-table td:first-child {
          font-weight: 600;
          color: #1b365d;
          width: 35%;
        }
        .footer {
          background-color: #f3f4f6;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }
        .footer a {
          color: #1B365D;
          text-decoration: none;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ARRIE NEL PHARMACY</h1>
          <p>Clinic Nurse Survey Report</p>
        </div>

        ${isUrgent ? `
        <div class="urgent-banner">
          ⚠️ URGENT ACTION REQUIRED: This response indicates a poor experience or concern regarding the clinic nursing services.
        </div>
        ` : ""}

        <div class="content">
          <h2 class="section-title">Patient Clinic Visit</h2>
          <table class="meta-table" style="margin-top: 0; margin-bottom: 25px;">
            <tr>
              <td>Clinic Branch:</td>
              <td><strong>${finalBranchName}</strong></td>
            </tr>
            <tr>
              <td>Service Category:</td>
              <td><strong>${serviceCategory}</strong></td>
            </tr>
            <tr>
              <td>Service Received:</td>
              <td><strong>${serviceReceived}</strong></td>
            </tr>
            <tr>
              <td>Patient:</td>
              <td>
                ${finalIsAnonymous
                  ? `<span style="color: #6b7280; font-style: italic;">Anonymous submission</span>`
                  : `<strong>${[finalPatientName, finalPatientSurname].filter(Boolean).join(" ") || "Name not provided"}</strong>${finalContactNumber ? ` &middot; ${finalContactNumber}` : ""}`
                }
              </td>
            </tr>
          </table>

          <h2 class="section-title">Clinic Survey Results</h2>
          
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">1. Overall Clinic Experience</div>
              <div class="metric-value-row">
                <div class="metric-value">${overallExperience} / 5</div>
                <div>
                  <span class="rating-badge ${
                    overallExperience >= 4 ? "rating-excellent" :
                    overallExperience === 3 ? "rating-good" :
                    overallExperience === 2 ? "rating-fair" : "rating-poor"
                  }">
                    ${
                      overallExperience === 5 ? "Excellent" :
                      overallExperience === 4 ? "Good" :
                      overallExperience === 3 ? "Average" :
                      overallExperience === 2 ? "Poor" : "Very Poor"
                    }
                  </span>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">2. Efficiency and Access</div>
              <div class="metric-value-row">
                <div class="metric-value">${efficiencyAccess} / 5</div>
                <div>
                  <span class="rating-badge ${
                    efficiencyAccess >= 4 ? "rating-excellent" :
                    efficiencyAccess === 3 ? "rating-good" :
                    efficiencyAccess === 2 ? "rating-fair" : "rating-poor"
                  }">
                    ${
                      efficiencyAccess === 5 ? "Excellent" :
                      efficiencyAccess === 4 ? "Good" :
                      efficiencyAccess === 3 ? "Average" :
                      efficiencyAccess === 2 ? "Poor" : "Very Poor"
                    }
                  </span>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">3. Quality of Nursing Care</div>
              <div class="metric-value-row">
                <div class="metric-value" style="font-size: 14px; font-weight: 550; color: #4b5563;">Treat with care, respect, and competence?</div>
                <div>
                  <span class="answer-pill ${
                    qualityCare === "Yes" ? "answer-yes" :
                    qualityCare === "No" ? "answer-no" : "answer-somewhat"
                  }">
                    ${qualityCare || "Not Answered"}
                  </span>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">4. Clarity and Communication</div>
              <div class="metric-value-row">
                <div class="metric-value" style="font-size: 14px; font-weight: 550; color: #4b5563;">Explanation of treatment, medication, next steps?</div>
                <div>
                  <span class="answer-pill ${
                    clarityCommunication === "Yes" ? "answer-yes" :
                    clarityCommunication === "No" ? "answer-no" : "answer-somewhat"
                  }">
                    ${clarityCommunication || "Not Answered"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h2 class="section-title">5. Patient Feedback</h2>
          <div>
            ${patientComment ? `
              <div class="comment-box">
                "${patientComment}"
              </div>
            ` : `
              <p style="color: #6b7280; font-style: italic; margin: 0;">No improvement comments written by patient.</p>
            `}
          </div>
        </div>

        <div class="footer">
          <p>This automated clinic notification was securely sent on behalf of <strong>${finalBranchName}</strong>.</p>
          <p>© ${new Date().getFullYear()} <a href="https://arrienel.co.za">ARRIE NEL PHARMACY</a>. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Configure Brevo API credentials
    const apiKey = decrypt(settings.brevoApiKeyEncrypted);
    const from = settings.fromEmail || "arrienelsunningdaleclinic@gmail.com";

    // Recipient dynamic resolution (read from admin setting)
    const recipientEmail = settings.headOfficeEmail || finalHeadOfficeEmail || "arrienelsunningdaleclinic@gmail.com";

    console.log(`Sending clinic survey result for ${finalBranchName} to: ${recipientEmail}`);

    // If the Brevo API key is missing, mark email as failed with explanatory note
    if (!apiKey) {
      const unconfiguredMsg = "Brevo API key not configured in Admin Console.";
      console.warn(`⚠️ [BREVO UNCONFIGURED] ${unconfiguredMsg}`);
      updateSubmissionRecord(savedRecord.id, {
        emailStatus: "failed",
        emailError: unconfiguredMsg,
        recipientEmail
      });

      return res.json({
        success: true,
        emailSent: false,
        recordId: savedRecord.id,
        warning: unconfiguredMsg,
        message: "Survey submitted and stored successfully. (Brevo API key is required for email dispatch)."
      });
    }

    try {
      // Send the email via Brevo's HTTP API
      await sendBrevoEmail({
        apiKey,
        fromEmail: from,
        fromName: finalBranchName,
        to: recipientEmail,
        cc: finalBranchEmail || undefined,
        subject: subject,
        html: htmlEmail,
        text: `
        ARRIE NEL PHARMACY - Patient Experience Survey Report
        ========================================================
        
        Clinic Branch:
        ${finalBranchName}
        
        Service Category:
        ${serviceCategory}
        
        Service Received:
        ${serviceReceived}

        Patient:
        ${finalIsAnonymous ? "Anonymous submission" : `${[finalPatientName, finalPatientSurname].filter(Boolean).join(" ") || "Name not provided"}${finalContactNumber ? ` (${finalContactNumber})` : ""}`}

        --------------------------------------------------------
        Submitted: ${submissionTime}
        ${isUrgent ? "⚠️ ACTION NEEDED: Poor clinic experience reported." : ""}
        
        1. Overall Clinic Experience: ${overallExperience} / 5
        2. Efficiency and Access: ${efficiencyAccess} / 5
        3. Quality of Nursing Care: ${qualityCare || "Not Answered"}
        4. Clarity and Communication: ${clarityCommunication || "Not Answered"}
        
        5. Patient Feedback:
        ${patientComment ? `"${patientComment}"` : "None."}
        
        --------------------------------------------------------
        This automated survey was sent securely on behalf of ${finalBranchName}.
        `
      });

      console.log(`✅ Brevo email successfully sent to ${recipientEmail}`);
      updateSubmissionRecord(savedRecord.id, {
        emailStatus: "sent",
        recipientEmail,
        sentAt: new Date().toISOString()
      });

      return res.json({
        success: true,
        emailSent: true,
        recordId: savedRecord.id,
        message: `Survey submitted and email feedback report delivered to ${recipientEmail}!`
      });
    } catch (emailError: any) {
      const errDetail = emailError.message || String(emailError);
      console.error("❌ Brevo email dispatch failed:", emailError);
      updateSubmissionRecord(savedRecord.id, {
        emailStatus: "failed",
        emailError: errDetail,
        recipientEmail
      });

      return res.json({
        success: true,
        emailSent: false,
        recordId: savedRecord.id,
        warning: `Email delivery failed: ${errDetail}`,
        message: "Survey submitted and saved successfully. (Email delivery error logged)."
      });
    }
  } catch (error: any) {
    console.error("❌ Failed to process survey submission:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while processing the survey.",
      error: error.message || String(error)
    });
  }
});

// Configure Vite or Static Asset Serving
async function initApp() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with dynamic Vite rebuilds
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded successfully.");
  } else {
    // Production mode - serve compiled assets from 'dist'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving production build from: ${distPath}`);
  }

  // Bind server to port 3000 and 0.0.0.0
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(`  ARRIE NEL PHARMACY Survey app server running on port ${PORT}`);
    console.log(`  Active environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`=======================================================`);
  });
}

initApp();
