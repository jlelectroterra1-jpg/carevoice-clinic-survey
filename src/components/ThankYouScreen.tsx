import { motion } from "motion/react";
import { 
  CheckCircle2, 
  RefreshCw, 
  ClipboardCheck,
  Building2,
  CalendarDays,
  Activity,
  Award
} from "lucide-react";
import { SurveySubmission } from "../types";
import { CONFIG } from "../config";

interface ThankYouScreenProps {
  submission: SurveySubmission;
  onReset: () => void;
}

export default function ThankYouScreen({ submission, onReset }: ThankYouScreenProps) {
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      
      {/* Visual Success Announcement Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="p-8 bg-white rounded-3xl border border-slate-150 shadow-md text-center space-y-5"
      >
        <div className="inline-flex items-center justify-center p-3.5 bg-emerald-50 text-emerald-600 rounded-full shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1B365D] tracking-tight font-display">
            {CONFIG.thankYouHeader}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
            {CONFIG.thankYouMessage}
          </p>
        </div>

        <div className="border-t border-slate-100 pt-5 flex justify-center items-center gap-2 text-[#1B365D] font-bold text-xs uppercase tracking-wide">
          <Building2 className="w-4 h-4 text-[#E31B23]" />
          <span>Submitted securely for {submission.branchName}</span>
        </div>
      </motion.div>

      {/* Confirmation Message: Auto Delivered */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="p-5 bg-[#1B365D]/5 border border-[#1B365D]/10 rounded-3xl flex gap-3.5 items-start"
      >
        <div className="p-2.5 bg-[#1B365D] text-white rounded-xl shrink-0">
          <Award className="w-5 h-5 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-black text-[#1B365D]">
            Delivered directly to Head Office
          </h3>
          <p className="text-slate-600 text-xs font-semibold leading-relaxed">
            Your feedback has been transmitted securely via SMTP to our Head Office. No further action is required from you.
          </p>
        </div>
      </motion.div>

      {/* Structured Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="bg-white rounded-3xl border border-slate-150 p-6 sm:p-8 space-y-5 shadow-sm"
      >
        <h4 className="text-xs font-black text-slate-400 border-b border-slate-100 pb-3 uppercase tracking-wider font-display flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-[#1B365D]" />
          <span>Receipt Summary</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 py-1 px-2.5 rounded-full font-mono font-bold ml-auto uppercase tracking-normal">
            Auto Transmitted
          </span>
        </h4>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Pharmacy Branch</p>
              <p className="text-[#1B365D] font-extrabold text-sm truncate">{submission.branchName}</p>
              <p className="text-slate-400 text-[10px] font-mono">ID: {submission.branchId}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Date &amp; Time</p>
              <p className="text-slate-700 font-bold text-xs sm:text-sm">{submission.timestamp}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3.5">
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Service Category</p>
              <p className="text-[#1B365D] font-extrabold text-xs sm:text-sm truncate">{submission.serviceCategory || "N/A"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Service Received</p>
              <p className="text-slate-700 font-bold text-xs sm:text-sm truncate">{submission.serviceReceived || "N/A"}</p>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-3.5">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1.5">1. Overall Experience</p>
            <div className="flex items-center gap-2">
              <span className="bg-[#1B365D] text-white font-mono font-black px-3 py-1 rounded-lg text-xs">
                {submission.overallExperience} / 5
              </span>
              <span className="text-[#1B365D] text-xs sm:text-sm font-extrabold">
                {submission.overallExperience === 5 ? "Excellent" : submission.overallExperience === 4 ? "Good" : submission.overallExperience === 3 ? "Average" : submission.overallExperience === 2 ? "Poor" : "Very Poor"}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3.5">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1.5">2. Efficiency &amp; Access</p>
            <div className="flex items-center gap-2">
              <span className="bg-[#1B365D] text-white font-mono font-black px-3 py-1 rounded-lg text-xs">
                {submission.efficiencyAccess} / 5
              </span>
              <span className="text-[#1B365D] text-xs sm:text-sm font-extrabold">
                {submission.efficiencyAccess === 5 ? "Very Easy" : submission.efficiencyAccess === 4 ? "Easy" : submission.efficiencyAccess === 3 ? "Neutral" : submission.efficiencyAccess === 2 ? "Difficult" : "Very Difficult"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3.5">
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1.5">Treated with Respect</p>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                submission.qualityCare === "Yes" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                submission.qualityCare === "No" ? "bg-rose-50 text-rose-800 border-rose-100" :
                "bg-amber-50 text-amber-800 border-amber-100"
              }`}>
                {submission.qualityCare || "N/A"}
              </span>
            </div>

            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1.5">Clear Instructions</p>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                submission.clarityCommunication === "Yes" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                submission.clarityCommunication === "No" ? "bg-rose-50 text-rose-800 border-rose-100" :
                "bg-amber-50 text-amber-800 border-amber-100"
              }`}>
                {submission.clarityCommunication || "N/A"}
              </span>
            </div>
          </div>

          {submission.patientComment && (
            <div className="border-t border-slate-100 pt-3.5">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1.5">Suggestions &amp; Comments</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-slate-600 text-xs sm:text-sm italic font-medium leading-relaxed">
                "{submission.patientComment}"
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Done / Reset Button to prepare for next patient */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="flex justify-center"
      >
        <button
          onClick={onReset}
          id="btn-done-restart-survey"
          className="w-full py-4 bg-[#1B365D] hover:bg-[#1B365D]/90 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer active:scale-98 select-none flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Done (Next Patient)</span>
        </button>
      </motion.div>
    </div>
  );
}
