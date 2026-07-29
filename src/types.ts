/**
 * TypeScript Interfaces for Arrie Nel Pharmacy Patient Experience Survey
 */

export interface SurveySubmission {
  id: string;
  timestamp: string;      // ISO String or readable format
  branchId: string;       // Active branch ID
  branchName: string;     // Active branch name (e.g. "Arrie Nel Pharmacy Sunningdale Clinic")
  serviceCategory: string;
  serviceReceived: string;
  overallExperience: number; // 1 to 5
  efficiencyAccess: number;  // 1 to 5
  qualityCare: "Yes" | "No" | "Somewhat" | "";
  clarityCommunication: "Yes" | "No" | "Somewhat" | "";
  patientComment: string;
  isAnonymous: boolean;
  patientName?: string;
  patientSurname?: string;
  contactNumber?: string;
}

export interface SurveyFormState {
  serviceCategory: string;
  serviceReceived: string;
  overallExperience: number | null;
  efficiencyAccess: number | null;
  qualityCare: "Yes" | "No" | "Somewhat" | "";
  clarityCommunication: "Yes" | "No" | "Somewhat" | "";
  patientComment: string;
  isAnonymous: boolean;
  patientName: string;
  patientSurname: string;
  contactNumber: string;
}

export interface ValidationErrors {
  overallExperience?: string;
  efficiencyAccess?: string;
  qualityCare?: string;
  clarityCommunication?: string;
  patientComment?: string;
}
