/**
 * Arrie Nel Pharmacy Group Survey Configuration File
 * 
 * General configurations for the survey landing.
 */

export interface AppConfig {
  /** The global survey title */
  surveyTitle: string;
  
  /** The subtitle/intro message shown to the patient */
  introSubtitle: string;
  
  /** Badges showing estimated completion time */
  completionTimeBadge: string;
  
  /** The success header and text shown at the final screen */
  thankYouHeader: string;
  thankYouMessage: string;
}

export const CONFIG: AppConfig = {
  surveyTitle: "Arrie Nel Pharmacy Sunningdale Clinic Patient Experience Survey",
  introSubtitle: "Your feedback helps us improve the care and service provided by our clinic nurse.",
  completionTimeBadge: "⏱ Takes less than 1 minute",
  thankYouHeader: "Thank You!",
  thankYouMessage: "Your clinic feedback has been submitted successfully. We appreciate you helping the nurse at Arrie Nel Pharmacy Sunningdale Clinic improve patient care."
};
