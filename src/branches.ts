/**
 * Arrie Nel Pharmacy Group - Branch Configuration File
 * 
 * You can add, edit, or remove branches here.
 * Each branch has a unique ID, name, local branch email, and head office email.
 */

export interface Branch {
  /** Unique ID used in the URL parameter (e.g. ?branch=dan-pienaar) */
  id: string;
  
  /** Official displayed name of the pharmacy branch */
  name: string;
  
  /** Email address of this specific branch */
  branchEmail: string;
  
  /** Email address of the Head Office where notifications are sent */
  headOfficeEmail: string;
  
  /** Custom logo for this branch (optional - defaults to Arrie Nel Pharmacy Group logo) */
  logoUrl?: string;
}

export const BRANCHES: Record<string, Branch> = {
  "sunningdale-clinic": {
    id: "sunningdale-clinic",
    name: "ARRIE NEL PHARMACY SUNNINGDALE CLINIC",
    branchEmail: "sunningdale@arrienel.co.za",
    headOfficeEmail: "headoffice@arrienel.co.za"
  }
};

/**
 * Gets the active pharmacy branch from the current URL query parameters.
 * Example URL: https://survey.example.co.za/?branch=sunningdale-clinic
 * Falls back to 'sunningdale-clinic' if no valid branch ID is specified.
 */
export function getActiveBranch(): Branch {
  const defaultBranch = BRANCHES["sunningdale-clinic"];
  
  if (typeof window === "undefined") {
    return defaultBranch;
  }
  
  const params = new URLSearchParams(window.location.search);
  const branchParam = params.get("branch") || params.get("id");
  
  if (branchParam && BRANCHES[branchParam]) {
    return BRANCHES[branchParam];
  }
  
  return defaultBranch;
}
