import { motion } from "motion/react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  // Custom step subtitles to be clear and elderly-friendly
  const getStepSubtitle = () => {
    if (currentStep === 1) return "Choose your clinic service";
    if (currentStep === 2) return "Choose your specific service";
    if (currentStep === 3) return "Rate your overall experience";
    if (currentStep === 4) return "Rate waiting time and assistance";
    if (currentStep === 5) return "Rate nurse's respect and competence";
    if (currentStep === 6) return "Rate quality of explanations";
    if (currentStep === 7) return "Share your suggestions or feedback";
    if (currentStep === 8) return "Stay anonymous or share your details";
    return "Patient experience survey";
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-4 bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
      <div className="flex flex-col gap-0.5 mb-2.5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
          Step {currentStep} of {totalSteps}
        </span>
        <h2 className="text-base sm:text-lg font-black text-[#1B365D] tracking-tight leading-tight">
          {getStepSubtitle()}
        </h2>
      </div>
      
      {/* Container of the progress bar */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-[#1B365D] to-[#E31B23] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
