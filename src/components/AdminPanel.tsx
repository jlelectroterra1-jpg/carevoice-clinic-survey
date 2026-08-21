import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Trash2, 
  Lock, 
  Unlock,
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  Building2,
  Mail,
  Server,
  User,
  KeyRound,
  LogOut,
  RefreshCw,
  Check,
  CheckCircle2,
  XCircle,
  Play
} from "lucide-react";
import { SurveySubmission } from "../types";
import { downloadCSV } from "../utils/storage";
import { apiUrl } from "../utils/api";
import { Branch } from "../branches";

interface AdminPanelProps {
  activeBranch: Branch;
  onRefreshTrigger?: number; // Reload trigger from submissions
}

type AdminTab = "submissions" | "settings" | "diagnostics";

export default function AdminPanel({ activeBranch, onRefreshTrigger = 0 }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("admin");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active console tab
  const [activeTab, setActiveTab] = useState<AdminTab>("submissions");

  // Submissions database state
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  // Settings form state
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchEmail, setBranchEmail] = useState("");
  const [headOfficeEmail, setHeadOfficeEmail] = useState("");
  const [developmentMode, setDevelopmentMode] = useState(true);
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Diagnostics state
  const [testRecipient, setTestRecipient] = useState("");
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Inactivity timeout reference
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial load: Check for active session token in sessionStorage
  useEffect(() => {
    const token = sessionStorage.getItem("arrie_nel_survey_session_token");
    if (token) {
      setSessionToken(token);
      checkSession(token);
    }
  }, []);

  // 2. Poll/Reload submissions when the console opens, tab changes, or survey is submitted
  useEffect(() => {
    if (isAuthenticated && sessionToken && isOpen) {
      if (activeTab === "submissions") {
        fetchSubmissions();
      } else if (activeTab === "settings") {
        fetchSettings();
      }
    }
  }, [isAuthenticated, sessionToken, isOpen, activeTab, onRefreshTrigger]);

  // 3. Setup client inactivity timeout listener (15 minutes)
  useEffect(() => {
    if (isAuthenticated) {
      resetInactivityTimer();
      
      const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
      const handleUserActivity = () => resetInactivityTimer();

      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });

      return () => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [isAuthenticated]);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    // 15 minutes timeout
    inactivityTimer.current = setTimeout(() => {
      handleLogout("Session logged out due to 15 minutes of inactivity.");
    }, 15 * 60 * 1000);
  };

  // Check active session status on server
  const checkSession = async (token: string) => {
    try {
      const res = await fetch(apiUrl("/api/admin/check-session"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.active) {
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem("arrie_nel_survey_session_token");
        setSessionToken(null);
      }
    } catch (e) {
      console.error("Session verification failed:", e);
    }
  };

  // Handle Admin login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials.");
      }

      sessionStorage.setItem("arrie_nel_survey_session_token", data.token);
      setSessionToken(data.token);
      setIsAuthenticated(true);
      setLoginPassword(""); // Clear security credential
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle logout
  const handleLogout = async (message?: string) => {
    if (sessionToken) {
      try {
        await fetch(apiUrl("/api/admin/logout"), {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
      } catch (e) {
        console.error("Logout request failure:", e);
      }
    }
    
    sessionStorage.removeItem("arrie_nel_survey_session_token");
    setSessionToken(null);
    setIsAuthenticated(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (message) alert(message);
  };

  // Fetch Submissions Database
  const fetchSubmissions = async () => {
    if (!sessionToken) return;
    setIsLoadingSubmissions(true);
    setSubError(null);

    try {
      const res = await fetch(apiUrl("/api/admin/submissions"), {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });

      if (res.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setSubError(err.message || "Failed to fetch submissions.");
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Fetch Settings Configuration
  const fetchSettings = async () => {
    if (!sessionToken) return;
    setSettingsError(null);

    try {
      const res = await fetch(apiUrl("/api/admin/settings"), {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });

      if (res.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await res.json();
      if (data.success) {
        const s = data.settings;
        setAdminUser(s.adminUsername);
        setFromEmail(s.fromEmail || "");
        setBranchName(s.branchName || "");
        setBranchEmail(s.branchEmail || "");
        setHeadOfficeEmail(s.headOfficeEmail || "");
        setTestRecipient(s.headOfficeEmail || "");
        setAdminPass(""); // Keep security fields empty
        setBrevoApiKey(s.brevoApiKeyConfigured ? "********" : "");
        setDevelopmentMode(s.developmentMode !== false);
      }
    } catch (err: any) {
      setSettingsError("Failed to fetch settings from server.");
    }
  };

  // Save Settings configuration
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;
    setIsSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          adminUsername: adminUser,
          adminPassword: adminPass,
          brevoApiKey,
          fromEmail,
          branchName,
          branchEmail,
          headOfficeEmail,
          developmentMode
        })
      });

      if (res.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setSettingsSuccess("Settings saved successfully to server.");
        setAdminPass(""); // Clear password field
        if (brevoApiKey && brevoApiKey !== "********") {
          setBrevoApiKey("********");
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setSettingsError(err.message || "Failed to update configurations.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Run SMTP connection test
  const handleTestEmail = async () => {
    if (!sessionToken) return;
    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const res = await fetch(apiUrl("/api/admin/test-email"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ testRecipient })
      });

      if (res.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await res.json();
      setTestResult({
        success: res.ok && data.success,
        message: data.message
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to connect to Brevo."
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Trigger CSV export
  const handleExportCSV = () => {
    downloadCSV(submissions, branchName || activeBranch.name);
  };

  // Wipe remote DB logs
  const handleClearAll = async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(apiUrl("/api/admin/submissions"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` }
      });

      if (res.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setSubmissions([]);
        setShowClearConfirm(false);
      }
    } catch (e) {
      console.error("Failed to clear database:", e);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto border-t border-slate-200 pt-8 mt-10 pb-12">
      {/* Console trigger button */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          id="btn-toggle-admin-panel"
          className="flex items-center gap-2 py-2.5 px-5 bg-slate-200/50 hover:bg-slate-200 active:bg-slate-300 text-slate-500 hover:text-slate-700 font-extrabold text-[11px] rounded-full transition-all shadow-xs cursor-pointer select-none border border-slate-200/40"
        >
          {isAuthenticated ? (
            <Unlock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>Administration Console</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mt-6"
          >
            {/* If NOT authenticated, show password gate */}
            {!isAuthenticated ? (
              <div className="p-6 bg-white border border-slate-150 rounded-3xl space-y-5 shadow-md">
                <div className="text-center space-y-1.5 pb-2">
                  <span className="p-3 bg-[#1B365D]/5 text-[#1B365D] rounded-full inline-block">
                    <Lock className="w-6 h-6 text-[#E31B23]" />
                  </span>
                  <h4 className="text-xl font-black text-[#1B365D] font-display">Console Protected</h4>
                  <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
                    Access to survey records, email settings, and branch configs is restricted to clinic administrators.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold"
                    >
                      <XCircle className="w-4.5 h-4.5 text-[#E31B23] shrink-0" />
                      <span>{loginError}</span>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#1B365D] uppercase tracking-wider block">
                        Admin Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          placeholder="e.g. admin"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-sm focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#1B365D] uppercase tracking-wider block">
                        Admin Password
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-sm focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 bg-[#1B365D] hover:bg-[#1B365D]/95 text-white font-black rounded-xl text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-98 shadow-sm"
                  >
                    {isLoggingIn ? "Verifying..." : "Access Console"}
                  </button>
                </form>
              </div>
            ) : (
              /* Authenticated View: Admin Tabs and Controls */
              <div className="p-6 bg-white border border-slate-150 rounded-3xl space-y-6 shadow-md relative">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xl font-black text-[#1B365D] flex items-center gap-1.5 font-display">
                      <Unlock className="w-5 h-5 text-emerald-500" />
                      Administration Console
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      ARRIE NEL PHARMACY SUNNINGDALE CLINIC
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleLogout()}
                    className="self-start sm:self-center py-1.5 px-3 bg-red-50 hover:bg-red-100 text-[#E31B23] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none border border-red-100/50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-100 text-xs sm:text-sm font-bold">
                  <button
                    onClick={() => setActiveTab("submissions")}
                    className={`flex-1 pb-3 text-center border-b-2 transition-all cursor-pointer ${
                      activeTab === "submissions"
                        ? "border-[#E31B23] text-[#E31B23] font-black"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Submissions ({submissions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`flex-1 pb-3 text-center border-b-2 transition-all cursor-pointer ${
                      activeTab === "settings"
                        ? "border-[#E31B23] text-[#E31B23] font-black"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    System Settings
                  </button>
                  <button
                    onClick={() => setActiveTab("diagnostics")}
                    className={`flex-1 pb-3 text-center border-b-2 transition-all cursor-pointer ${
                      activeTab === "diagnostics"
                        ? "border-[#E31B23] text-[#E31B23] font-black"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Email Diagnostics
                  </button>
                </div>

                {/* Tab 1: Submissions Database */}
                {activeTab === "submissions" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Clinic Submissions Database
                      </span>
                      <button
                        onClick={fetchSubmissions}
                        disabled={isLoadingSubmissions}
                        className="p-1 text-[#1B365D] hover:bg-slate-50 rounded-md transition-colors"
                        title="Reload Submissions"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {isLoadingSubmissions ? (
                      <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
                        <svg className="animate-spin h-6 w-6 text-[#1B365D] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>Loading database entries...</p>
                      </div>
                    ) : subError ? (
                      <div className="text-center py-8 text-rose-500 font-bold text-xs">
                        <XCircle className="w-7 h-7 mx-auto mb-2 text-[#E31B23]" />
                        <p>{subError}</p>
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-500">Database is empty</p>
                        <p className="text-xs">No clinic survey submissions have been captured on this device or server yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Actions Row */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={handleExportCSV}
                            id="btn-export-csv"
                            className="flex-1 py-3 px-4 bg-[#1B365D] hover:bg-[#1B365D]/90 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer select-none text-xs sm:text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export Database (CSV)</span>
                          </button>

                          <button
                            onClick={() => setShowClearConfirm(true)}
                            id="btn-confirm-clear"
                            className="py-3 px-4 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none text-xs sm:text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Wipe Database</span>
                          </button>
                        </div>

                        {/* Submissions List */}
                        <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 text-[11px] sm:text-xs">
                          <div className="p-3 bg-slate-50 font-bold text-slate-500 grid grid-cols-12 gap-2">
                            <span className="col-span-2">Date &amp; Time</span>
                            <span className="col-span-3">Clinic Service</span>
                            <span className="col-span-2 text-center">Scores</span>
                            <span className="col-span-2 text-center">Email Status</span>
                            <span className="col-span-3">Patient Feedback</span>
                          </div>
                          {submissions.slice(-6).reverse().map((sub) => (
                            <div key={sub.id} className={`p-3 grid grid-cols-12 gap-2 text-slate-700 font-medium items-center ${sub.overallExperience <= 2 || sub.qualityCare === "No" ? "bg-rose-50/40" : ""}`}>
                              <span className="col-span-2 text-[10px] text-slate-400 flex flex-col justify-center gap-0.5">
                                <span className="font-semibold text-slate-600">{sub.timestamp ? sub.timestamp.split(",")[0] : "N/A"}</span>
                                {sub.isAnonymous || !sub.patientName ? (
                                  <span className="italic text-slate-400">Anonymous</span>
                                ) : (
                                  <span className="font-bold text-[#1B365D] truncate" title={sub.contactNumber || ""}>
                                    {sub.patientName} {sub.patientSurname || ""}
                                  </span>
                                )}
                              </span>
                              <span className="col-span-3 flex flex-col truncate pr-1">
                                <span className="font-extrabold text-[#1B365D] text-[10px] truncate">
                                  {sub.serviceReceived || "N/A"}
                                </span>
                                <span className="text-[9px] text-slate-400 truncate font-semibold">
                                  {sub.serviceCategory || "N/A"}
                                </span>
                              </span>
                              <span className="col-span-2 text-center font-extrabold text-[#1B365D] font-mono text-[10px]">
                                {sub.overallExperience}/{sub.efficiencyAccess}
                              </span>
                              <span className="col-span-2 text-center flex justify-center items-center">
                                {sub.emailStatus === "sent" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    Sent
                                  </span>
                                ) : sub.emailStatus === "failed" ? (
                                  <span 
                                    title={sub.emailError || "Email sending failed"}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                                  >
                                    <XCircle className="w-2.5 h-2.5 text-rose-600" />
                                    Failed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                                    Pending
                                  </span>
                                )}
                              </span>
                              <span className="col-span-3 truncate italic text-slate-400 font-medium text-[10px]">
                                {sub.patientComment ? `"${sub.patientComment}"` : "None"}
                              </span>
                            </div>
                          ))}
                        </div>
                        {submissions.length > 6 && (
                          <p className="text-[10px] text-slate-400 text-center italic font-semibold">
                            Displaying 6 most recent records. The full list of {submissions.length} is saved in your CSV export.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Wipe database confirmation drawer */}
                    <AnimatePresence>
                      {showClearConfirm && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-3"
                        >
                          <div className="flex gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <h5 className="font-extrabold text-rose-950 text-sm">Clear database permanently?</h5>
                              <p className="text-xs text-rose-700 leading-relaxed font-semibold">
                                This deletes all {submissions.length} patient clinic responses permanently on the server. This cannot be undone.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setShowClearConfirm(false)}
                              className="py-1.5 px-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleClearAll}
                              className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                            >
                              Confirm Wipe
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Tab 2: System Settings Panel */}
                {activeTab === "settings" && (
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    {settingsSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold"
                      >
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                        <span>{settingsSuccess}</span>
                      </motion.div>
                    )}

                    {settingsError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-800 text-xs font-bold"
                      >
                        <XCircle className="w-4.5 h-4.5 text-[#E31B23] shrink-0" />
                        <span>{settingsError}</span>
                      </motion.div>
                    )}

                    {/* Section A: Admin Credentials */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 text-xs font-black text-[#1B365D] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                        <User className="w-3.5 h-3.5 text-[#E31B23]" />
                        <span>Administrator Account</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">
                            Change Username
                          </label>
                          <input
                            type="text"
                            value={adminUser}
                            onChange={(e) => setAdminUser(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">
                            Change Password (Optional)
                          </label>
                          <input
                            type="password"
                            value={adminPass}
                            onChange={(e) => setAdminPass(e.target.value)}
                            placeholder="Leave blank to keep same"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section B: Clinic & Branch Settings */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 text-xs font-black text-[#1B365D] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#E31B23]" />
                        <span>Clinic branch settings</span>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">
                            Clinic Branch Wording
                          </label>
                          <input
                            type="text"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block">
                              Branch Email
                            </label>
                            <input
                              type="email"
                              value={branchEmail}
                              onChange={(e) => setBranchEmail(e.target.value)}
                              required
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block">
                              Survey Feedback Recipient Email
                            </label>
                            <input
                              type="email"
                              value={headOfficeEmail}
                              onChange={(e) => setHeadOfficeEmail(e.target.value)}
                              required
                              placeholder="e.g. arrienelsunningdaleclinic@gmail.com"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">
                              All submitted patient survey reports will be delivered directly to this email address.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section C: Brevo Email API credentials */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 text-xs font-black text-[#1B365D] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                        <Server className="w-3.5 h-3.5 text-[#E31B23]" />
                        <span>Brevo Email API Credentials</span>
                      </div>

                      {/* Dynamic Development Mode Switcher */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-black text-[#1B365D] uppercase tracking-wide flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-[#E31B23] animate-pulse"></span>
                              Temporary Development Mode
                            </h5>
                            <p className="text-[10px] text-slate-500 font-semibold max-w-sm">
                              When enabled, automated email sending is skipped so you can test all features offline. Disable this once you configure a real Brevo API key later.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDevelopmentMode(!developmentMode)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-hidden ${
                              developmentMode ? 'bg-[#E31B23]' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                developmentMode ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">
                            Brevo API Key
                          </label>
                          <input
                            type="password"
                            value={brevoApiKey}
                            onChange={(e) => setBrevoApiKey(e.target.value)}
                            placeholder="e.g. xkeysib-..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800 placeholder:text-slate-400"
                          />
                          <p className="text-[9px] text-slate-400 font-medium">
                            Find or create this under Brevo &rarr; Settings &rarr; SMTP &amp; API &rarr; API Keys.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">
                            Send From Email Wording
                          </label>
                          <input
                            type="email"
                            value={fromEmail}
                            onChange={(e) => setFromEmail(e.target.value)}
                            placeholder="e.g. no-reply@arrienel.co.za"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800"
                          />
                          <p className="text-[9px] text-slate-400 font-medium">
                            Must be a sender verified in your Brevo account (Senders &amp; IP settings).
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="w-full py-3 px-4 bg-[#E31B23] hover:bg-[#E31B23]/90 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      {isSavingSettings ? (
                        "Saving Settings..."
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3px]" />
                          <span>Save Server Configurations</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Tab 3: Brevo Email Diagnostics */}
                {activeTab === "diagnostics" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        On-Demand Email Connection Diagnostics
                      </span>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                        Verify your Brevo API key instantly by dispatching a real-time system test notification.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#1B365D] uppercase tracking-wider block">
                          Test Recipient Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            value={testRecipient}
                            onChange={(e) => setTestRecipient(e.target.value)}
                            required
                            placeholder="e.g. head-office@domain.co.za"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-250 rounded-xl text-sm focus:border-[#1B365D] focus:ring-0 outline-hidden font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={isTestingEmail || !testRecipient}
                        className="py-3 px-5 bg-[#1B365D] hover:bg-[#1B365D]/95 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isTestingEmail ? (
                          <>
                            <svg className="animate-spin h-4.5 w-4.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-white stroke-[3px]" />
                            <span>Dispatch Diagnostic Test</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Test result display feedback */}
                    <AnimatePresence>
                      {testResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className={`p-4 rounded-2xl border flex gap-3 items-start shadow-xs ${
                            testResult.success
                              ? "bg-emerald-50 border-emerald-100 text-emerald-950"
                              : "bg-rose-50 border-rose-100 text-rose-950"
                          }`}
                        >
                          {testResult.success ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-sm">
                              {testResult.success ? "Test Succeeded!" : "Test Failed"}
                            </h5>
                            <p className="text-xs font-semibold leading-relaxed">
                              {testResult.message}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
