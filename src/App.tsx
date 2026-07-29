import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, ShieldCheck, HelpCircle, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { CONFIG } from "./config";
import { BRANCHES, getActiveBranch, Branch } from "./branches";
import { SurveyFormState, SurveySubmission } from "./types";
import { saveSubmission } from "./utils/storage";
import SurveyForm from "./components/SurveyForm";
import ThankYouScreen from "./components/ThankYouScreen";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [activeBranch, setActiveBranch] = useState<Branch>(() => getActiveBranch());
  const [activeSubmission, setActiveSubmission] = useState<SurveySubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Triggers updates inside the AdminPanel database list
  const [refreshAdminTrigger, setRefreshAdminTrigger] = useState(0);

  // Sync branch from URL query parameters on initial render
  useEffect(() => {
    setActiveBranch(getActiveBranch());
  }, []);

  const handleFormSubmit = async (formData: SurveyFormState) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const submissionPayload = {
      branchId: activeBranch.id,
      branchName: activeBranch.name,
      branchEmail: activeBranch.branchEmail,
      headOfficeEmail: activeBranch.headOfficeEmail,
      overallExperience: formData.overallExperience as number,
      efficiencyAccess: formData.efficiencyAccess as number,
      qualityCare: formData.qualityCare,
      clarityCommunication: formData.clarityCommunication,
      patientComment: formData.patientComment,
      serviceCategory: formData.serviceCategory,
      serviceReceived: formData.serviceReceived,
      isAnonymous: formData.isAnonymous,
      patientName: formData.patientName,
      patientSurname: formData.patientSurname,
      contactNumber: formData.contactNumber,
    };

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to deliver survey results. Please check your network.");
      }

      // Save a secure local record of this submission in browser storage for backup
      const saved = saveSubmission({
        branchId: activeBranch.id,
        branchName: activeBranch.name,
        overallExperience: formData.overallExperience as number,
        efficiencyAccess: formData.efficiencyAccess as number,
        qualityCare: formData.qualityCare,
        clarityCommunication: formData.clarityCommunication,
        patientComment: formData.patientComment,
        serviceCategory: formData.serviceCategory,
        serviceReceived: formData.serviceReceived,
        isAnonymous: formData.isAnonymous,
        patientName: formData.patientName,
        patientSurname: formData.patientSurname,
        contactNumber: formData.contactNumber,
      });

      // Smooth transition to thank-you screen
      setActiveSubmission(saved);
      setRefreshAdminTrigger((prev) => prev + 1);
      
      // Clear errors
      setSubmitError(null);
    } catch (error: any) {
      console.error("Survey submission failure:", error);
      setSubmitError(
        error.message || "Unable to reach the submission server. Please verify your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleResetSurvey = () => {
    setActiveSubmission(null);
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased relative">
      {/* Premium brand layout grid */}
      <div className="absolute top-0 left-0 right-0 h-[380px] bg-gradient-to-b from-[#1B365D]/5 to-transparent -z-10 pointer-events-none" />
      
      {/* Main Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4.5 pt-2 sm:pt-6 pb-6 sm:pb-8">
        
        {/* Modern Healthcare Header with Premium Typography Branding */}
        <header className="text-center mb-2.5 sm:mb-4 space-y-1.5 pt-1.5 sm:pt-0">
          {/* Subtle Healthcare Design Accent instead of a company logo */}
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#1B365D]/5 border border-[#1B365D]/10">
              <Plus className="w-4.5 h-4.5 text-[#E31B23]" strokeWidth={3.5} />
            </div>
          </div>

          {/* ARRIE NEL PHARMACY (Large bold branding heading with red accent line) */}
          <div className="space-y-1 pb-0.5">
            <h2 className="text-lg sm:text-2xl font-black text-[#1B365D] tracking-wider uppercase leading-none font-sans">
              Arrie Nel Pharmacy
            </h2>
            <div className="w-14 h-0.5 bg-[#E31B23] mx-auto rounded-full" />
          </div>

          {/* SUNNINGDALE CLINIC */}
          <div className="text-slate-500 text-[10px] sm:text-[11px] font-black tracking-[0.15em] uppercase leading-none">
            Sunningdale Clinic
          </div>

          {/* Patient Experience Survey and Subtitle Description */}
          <div className="space-y-0.5 pt-0.5">
            <h1 className="text-sm sm:text-base font-black text-[#1B365D] tracking-tight leading-tight">
              Patient Experience Survey
            </h1>
            <p className="text-slate-400 text-[10px] sm:text-[11px] font-bold leading-tight max-w-xs sm:max-w-sm mx-auto">
              Your feedback helps us improve our clinic services.
            </p>
          </div>

          {/* Less than 1 minute */}
          {!activeSubmission && (
            <div className="inline-block pt-0.5">
              <div className="inline-flex items-center gap-1 bg-[#E31B23]/5 text-[#E31B23] px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold border border-[#E31B23]/10">
                ⏱ Takes less than 1 minute
              </div>
            </div>
          )}
        </header>

        {/* Dynamic Display of Submission Server Error */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-150 rounded-2xl flex gap-3 items-start text-red-800 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-[#E31B23] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-[#1B365D]">Submission Failed</h4>
              <p className="text-xs font-semibold leading-relaxed text-slate-600">
                {submitError}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Your entries are safe. Please check your connection and tap Submit again.
              </p>
            </div>
          </motion.div>
        )}

        {/* Survey Views with layout transitions */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!activeSubmission ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SurveyForm 
                  activeBranch={activeBranch} 
                  onSubmit={handleFormSubmit}
                  isSubmittingExternal={isSubmitting}
                />
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ThankYouScreen 
                  submission={activeSubmission} 
                  onReset={handleResetSurvey} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Secure Administrative Backups Console */}
        <AdminPanel 
          activeBranch={activeBranch} 
          onRefreshTrigger={refreshAdminTrigger} 
        />

      </main>

      {/* Trust & Compliance Footer */}
      <footer className="py-6 border-t border-slate-150 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-[#E31B23] fill-[#E31B23] shrink-0" />
            <span>Dedicated to Your Wellbeing</span>
          </div>
          <span className="hidden sm:inline text-slate-200">|</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B365D] shrink-0" />
            <span>Secure Automated Delivery</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
