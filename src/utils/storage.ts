import { SurveySubmission } from "../types";

const STORAGE_KEY = "arrie_nel_survey_submissions";

/**
 * Retrieves all saved submissions from localStorage
 */
export function getSubmissions(): SurveySubmission[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load submissions from localStorage", error);
    return [];
  }
}

/**
 * Saves a new submission to localStorage
 */
export function saveSubmission(submission: Omit<SurveySubmission, "id" | "timestamp">): SurveySubmission {
  const newSubmission: SurveySubmission = {
    ...submission,
    id: `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toLocaleString(), // Human readable local time for submission date and time
  };

  try {
    const current = getSubmissions();
    current.push(newSubmission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (error) {
    console.error("Failed to save submission to localStorage", error);
  }

  return newSubmission;
}

/**
 * Clears all submissions from localStorage
 */
export function clearAllSubmissions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear localStorage submissions", error);
  }
}

/**
 * Converts survey submissions to CSV format
 */
export function convertToCSV(submissions: SurveySubmission[]): string {
  if (submissions.length === 0) {
    return "";
  }

  const headers = [
    "ID",
    "Timestamp",
    "Branch ID",
    "Branch Name",
    "Service Category",
    "Service Received",
    "Overall Clinic Experience (1-5)",
    "Efficiency & Access (1-5)",
    "Quality of Nursing Care",
    "Clarity & Communication",
    "Patient Feedback",
    "Patient Name",
    "Patient Surname",
    "Contact Number"
  ];

  const escapeCSVField = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return "";
    const strVal = String(val);
    if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n") || strVal.includes("\r")) {
      return `"${strVal.replace(/"/g, '""')}"`;
    }
    return strVal;
  };

  const rows = submissions.map((sub) => [
    sub.id,
    sub.timestamp,
    sub.branchId,
    sub.branchName,
    sub.serviceCategory || "",
    sub.serviceReceived || "",
    sub.overallExperience,
    sub.efficiencyAccess,
    sub.qualityCare,
    sub.clarityCommunication,
    sub.patientComment,
    sub.isAnonymous ? "" : (sub.patientName || ""),
    sub.isAnonymous ? "" : (sub.patientSurname || ""),
    sub.isAnonymous ? "" : (sub.contactNumber || "")
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSVField).join(","))
  ].join("\n");

  return csvContent;
}

/**
 * Triggers a browser download of the CSV data
 */
export function downloadCSV(submissions: SurveySubmission[], branchName: string): void {
  const csv = convertToCSV(submissions);
  if (!csv) {
    alert("No submissions available to export.");
    return;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  // Format branch name for filename
  const safeBranchName = branchName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const filename = `${safeBranchName}_patient_surveys_${new Date().toISOString().slice(0, 10)}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
