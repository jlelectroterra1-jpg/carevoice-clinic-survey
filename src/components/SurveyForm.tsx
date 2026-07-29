import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft,
  Check,
  MessageSquareCode,
  Sparkles,
  Activity,
  Baby,
  Syringe,
  Stethoscope,
  Layers,
  User,
  Phone,
  EyeOff
} from "lucide-react";
import { Branch } from "../branches";
import { SurveyFormState } from "../types";
import ProgressBar from "./ProgressBar";

interface SurveyFormProps {
  activeBranch: Branch;
  onSubmit: (data: SurveyFormState) => void;
  isSubmittingExternal: boolean;
}

const CATEGORIES = [
  { name: "Health Screening & Wellness", icon: "Activity" },
  { name: "Vaccinations", icon: "Syringe" },
  { name: "Nursing Care", icon: "Stethoscope" },
  { name: "Injections & Infusions", icon: "Layers" },
  { name: "Baby & Child Care", icon: "Baby" },
  { name: "Women's Health", icon: "Sparkles" },
  { name: "Other", icon: "HelpCircle" }
];

const SERVICES_BY_CATEGORY: Record<string, string[]> = {
  "Health Screening & Wellness": [
    "Blood Pressure Check",
    "Cholesterol / Lipogram Screening",
    "Blood Sugar Screening",
    "Haemoglobin Screening",
    "Urine Screening",
    "HIV Testing",
    "PSA Test",
    "Urine Drug Screening",
    "Vitality Health Check",
    "Momentum Multiply Health Check",
    "Lice Check & Clearance Certificate"
  ],
  "Vaccinations": [
    "Flu Vaccine",
    "Rabies Vaccination"
  ],
  "Nursing Care": [
    "General Nurse Consultation",
    "Basic Wound Care",
    "Ear Syringing",
    "Suture Removal"
  ],
  "Injections & Infusions": [
    "Vitamin B Injection",
    "Anti-inflammatory Injection",
    "Heel Homeopathic Injection",
    "General Injection",
    "IV Infusion"
  ],
  "Baby & Child Care": [
    "Baby Weighing & Wellness Check",
    "Baby Immunisation"
  ],
  "Women's Health": [
    "Family Planning"
  ],
  "Other": [
    "Other"
  ]
};

export default function SurveyForm({ activeBranch, onSubmit, isSubmittingExternal }: SurveyFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState<SurveyFormState>({
    serviceCategory: "",
    serviceReceived: "",
    overallExperience: null,
    efficiencyAccess: null,
    qualityCare: "",
    clarityCommunication: "",
    patientComment: "",
    isAnonymous: true,
    patientName: "",
    patientSurname: "",
    contactNumber: "",
  });

  const [customOtherText, setCustomOtherText] = useState("");

  const totalSteps = 8;

  // Custom icon renderer for category buttons
  const getCategoryIcon = (iconName: string, isSelected: boolean) => {
    const cls = `w-8 h-8 sm:w-6 sm:h-6 shrink-0 ${isSelected ? "text-white" : "text-[#1B365D]"}`;
    switch (iconName) {
      case "Activity": return <Activity className={cls} />;
      case "Syringe": return <Syringe className={cls} />;
      case "Stethoscope": return <Stethoscope className={cls} />;
      case "Layers": return <Layers className={cls} />;
      case "Baby": return <Baby className={cls} />;
      case "Sparkles": return <Sparkles className={cls} />;
      default: return <HelpCircle className={cls} />;
    }
  };

  // Rating labels for screen readers and visual hints
  const getExperienceLabel = (rating: number | null) => {
    switch (rating) {
      case 1: return "Very Poor";
      case 2: return "Poor";
      case 3: return "Average";
      case 4: return "Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  const getEfficiencyLabel = (rating: number | null) => {
    switch (rating) {
      case 1: return "Very Difficult";
      case 2: return "Difficult";
      case 3: return "Neutral";
      case 4: return "Easy";
      case 5: return "Very Easy";
      default: return "";
    }
  };

  const handleCategorySelect = (category: string) => {
    if (isSubmittingExternal) return;
    setFormState((prev) => ({ 
      ...prev, 
      serviceCategory: category,
      serviceReceived: "" 
    }));
    
    // Smooth auto-advance to step 2 after selecting a category
    setTimeout(() => {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 250);
  };

  const handleServiceSelect = (service: string) => {
    if (isSubmittingExternal) return;
    setFormState((prev) => ({ ...prev, serviceReceived: service }));
    
    // Auto-advance to rating questions if it's NOT "Other" (since "Other" has custom text input)
    if (service !== "Other") {
      setTimeout(() => {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 250);
    }
  };

  const handleRatingSelect = (field: "overallExperience" | "efficiencyAccess", value: number) => {
    if (isSubmittingExternal) return;
    setFormState((prev) => ({ ...prev, [field]: value }));
    
    // Auto-advance for rating scale buttons
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 250);
  };

  const handleOptionSelect = (field: "qualityCare" | "clarityCommunication", value: "Yes" | "No" | "Somewhat") => {
    if (isSubmittingExternal) return;
    setFormState((prev) => ({ ...prev, [field]: value }));
    
    // Auto-advance for binary/trinary buttons
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 250);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSubmittingExternal) return;
    setFormState((prev) => ({ ...prev, patientComment: e.target.value }));
  };

  const handleAnonymousChoice = (anonymous: boolean) => {
    if (isSubmittingExternal) return;
    setFormState((prev) => ({ ...prev, isAnonymous: anonymous }));
  };

  const handleIdentityFieldChange = (
    field: "patientName" | "patientSurname" | "contactNumber",
    value: string
  ) => {
    if (isSubmittingExternal) return;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Determine if the current step is completed so we can enable the "Next" button
  const isCurrentStepAnswered = (): boolean => {
    switch (currentStep) {
      case 1:
        return formState.serviceCategory !== "";
      case 2:
        return formState.serviceReceived !== "";
      case 3:
        return formState.overallExperience !== null;
      case 4:
        return formState.efficiencyAccess !== null;
      case 5:
        return formState.qualityCare !== "";
      case 6:
        return formState.clarityCommunication !== "";
      case 7:
        // Text comment is optional, so it is always answered
        return true;
      case 8:
        // Identity details are optional (or anonymous), so always answered
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isCurrentStepAnswered() && currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentStepAnswered() || isSubmittingExternal) return;
    
    // Process final state if "Other" custom service details are specified
    const payload = { ...formState };
    if (formState.serviceReceived === "Other" && customOtherText.trim() !== "") {
      payload.serviceReceived = `${customOtherText.trim()}`;
    }

    // Never carry identity details through when the patient chose to stay anonymous
    if (payload.isAnonymous) {
      payload.patientName = "";
      payload.patientSurname = "";
      payload.contactNumber = "";
    }

    onSubmit(payload);
  };

  const servicesList = SERVICES_BY_CATEGORY[formState.serviceCategory] || [];

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress Bar with Corporate Accent */}
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <form onSubmit={handleSubmit} className="relative min-h-[410px] flex flex-col justify-between">
        
        {/* Animated Question Card container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-md flex-1 flex flex-col justify-between"
          >
            <div>
              {/* Step 1: Select Service Category */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B365D]/5 text-[#1B365D] rounded-xl shrink-0">
                      <Stethoscope className="w-5 h-5 text-[#E31B23]" />
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#1B365D] uppercase tracking-wider font-display">Step 1A: Choose Category</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
                      What clinic service did you visit us for today?
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed">
                      Please select a clinic service category below to begin:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 sm:gap-3.5 pt-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = formState.serviceCategory === cat.name;
                      return (
                        <button
                          type="button"
                          key={cat.name}
                          id={`btn-category-${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          onClick={() => handleCategorySelect(cat.name)}
                          className={`w-full relative py-6.5 px-5.5 sm:py-4 sm:px-4 rounded-3xl sm:rounded-2xl flex items-center gap-4.5 text-left transition-all cursor-pointer select-none active:scale-95 border-2 ${
                            isSelected 
                              ? "bg-[#1B365D] border-[#1B365D] text-white shadow-md scale-102" 
                              : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                          }`}
                        >
                          <span className={`p-3.5 sm:p-2.5 rounded-2xl sm:rounded-xl shrink-0 ${isSelected ? "bg-white/10 text-white" : "bg-white border border-slate-100 shadow-xs"}`}>
                            {getCategoryIcon(cat.icon, isSelected)}
                          </span>
                          
                          <span className="text-lg sm:text-sm font-black tracking-tight leading-snug">
                            {cat.name}
                          </span>
                          
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 bg-[#E31B23] text-white rounded-full p-1 border-2 border-white shadow-md"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[4px]" />
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Select Specific Service */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B365D]/5 text-[#1B365D] rounded-xl shrink-0">
                      <Check className="w-5 h-5 text-[#E31B23] stroke-[3px]" />
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#1B365D] uppercase tracking-wider font-display">Step 1B: Choose Service</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
                      Specific Service
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed">
                      Select the specific service you received in <span className="text-[#1B365D] font-bold">"{formState.serviceCategory}"</span>:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-h-[260px] overflow-y-auto pr-1">
                    {servicesList.map((service) => {
                      const isSelected = formState.serviceReceived === service;
                      return (
                        <button
                          type="button"
                          key={service}
                          id={`btn-service-${service.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          onClick={() => handleServiceSelect(service)}
                          className={`relative py-4 px-4.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer select-none active:scale-95 border-2 ${
                            isSelected 
                              ? "bg-[#1B365D] border-[#1B365D] text-white shadow-sm" 
                              : "bg-slate-50/50 border-slate-250 text-slate-700 hover:bg-slate-100/50"
                          }`}
                        >
                          <span className="text-sm sm:text-sm font-extrabold leading-tight tracking-tight pr-4">
                            {service}
                          </span>
                          
                          {isSelected ? (
                            <span className="bg-white text-[#1B365D] rounded-full p-0.5 shadow-sm shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[4px]" />
                            </span>
                          ) : (
                            <span className="w-4.5 h-4.5 rounded-full border border-slate-300 bg-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom other textbox entry */}
                  {formState.serviceReceived === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                    >
                      <label htmlFor="custom-service-input" className="block text-xs font-black text-[#1B365D] uppercase tracking-wider">
                        Please tell us what service you received
                      </label>
                      <input
                        type="text"
                        id="custom-service-input"
                        value={customOtherText}
                        onChange={(e) => setCustomOtherText(e.target.value)}
                        disabled={isSubmittingExternal}
                        placeholder="e.g. Ear screening, custom consultation, etc."
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:border-[#1B365D] focus:ring-0 outline-hidden font-extrabold text-slate-800 shadow-xs"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 3: Overall Experience (Formerly Question 1) */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B365D]/5 text-[#1B365D] rounded-xl shrink-0">
                      <Star className="w-5 h-5 fill-[#E31B23] text-[#E31B23]" />
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#1B365D] uppercase tracking-wider font-display">Step 2: Overall Clinic Experience</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
                      Overall Clinic Experience
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed">
                      How would you rate your overall experience with the clinic nurse today?
                    </p>
                  </div>

                  {/* 1-5 Rating Selection - Large touch-targets for elderly patients */}
                  <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 pt-3">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const isSelected = formState.overallExperience === rating;
                      return (
                        <button
                          type="button"
                          key={rating}
                          id={`btn-experience-${rating}`}
                          disabled={isSubmittingExternal}
                          onClick={() => handleRatingSelect("overallExperience", rating)}
                          className={`relative h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black text-xl sm:text-2xl transition-all cursor-pointer select-none active:scale-95 border-2 ${
                            isSelected 
                              ? "bg-[#1B365D] border-[#1B365D] text-white shadow-md scale-105" 
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                          }`}
                        >
                          {rating}
                          
                          {/* Selected Indicator Checkmark */}
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1.5 -right-1.5 bg-[#E31B23] text-white rounded-full p-0.5 border border-white shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[4px]" />
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Rating labels */}
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-400 px-1 pt-1">
                    <span>1 = Very Poor</span>
                    {formState.overallExperience && (
                      <motion.span 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-[#1B365D] font-extrabold bg-[#1B365D]/5 px-3 py-1 rounded-full text-xs"
                      >
                        {getExperienceLabel(formState.overallExperience)}
                      </motion.span>
                    )}
                    <span>5 = Excellent</span>
                  </div>
                </div>
              )}

              {/* Step 4: Efficiency & Access (Formerly Question 2) */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B365D]/5 text-[#1B365D] rounded-xl shrink-0">
                      <Clock className="w-5 h-5 text-[#E31B23]" />
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#1B365D] uppercase tracking-wider font-display">Step 3: Waiting Time &amp; Assistance</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
                      Efficiency and Access
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed">
                      How easy was it to access the clinic service today, including waiting time and assistance?
                    </p>
                  </div>

                  {/* 1-5 Rating Selection */}
                  <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 pt-3">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const isSelected = formState.efficiencyAccess === rating;
                      return (
                        <button
                          type="button"
                          key={rating}
                          id={`btn-efficiency-${rating}`}
                          disabled={isSubmittingExternal}
                          onClick={() => handleRatingSelect("efficiencyAccess", rating)}
                          className={`relative h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black text-xl sm:text-2xl transition-all cursor-pointer select-none active:scale-95 border-2 ${
                            isSelected 
                              ? "bg-[#1B365D] border-[#1B365D] text-white shadow-md scale-105" 
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                          }`}
                        >
                          {rating}
                          
                          {/* Selected Checkmark */}
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1.5 -right-1.5 bg-[#E31B23] text-white rounded-full p-0.5 border border-white shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[4px]" />
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Rating labels */}
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-400 px-1 pt-1">
                    <span>1 = Very Difficult</span>
                    {formState.efficiencyAccess && (
                      <motion.span 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-[#1B365D] font-extrabold bg-[#1B365D]/5 px-3 py-1 rounded-full text-xs"
                      >
                        {getEfficiencyLabel(formState.efficiencyAccess)}
                      </motion.span>
                    )}
                    <span>5 = Very Easy</span>
                  </div>
                </div>
              )}

              {/* Step 5: Respect & Professionalism (Formerly Question 3) */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B365D]/5 text-[#1B365D] rounded-xl shrink-0">
                      <ThumbsUp className="w-5 h-5 text-[#E31B23]" />
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#1B365D] uppercase tracking-wider font-display">Step 4: Respect &amp; Competence</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
                      Quality of Nursing Care
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed">
                      Did you feel that the nurse treated you with respect and provided professional, competent care?
                    </p>
                  </div>

                  {/* Yes, No, Somewhat options */}
                  <div className="space-y-3 pt-3">
                    {(["Yes", "No", "Somewhat"] as const).map((option) => {
                      const isSelected = formState.qualityCare === option;
                      return (
                        <button
                          type="button"
                          key={option}
                          id={`btn-care-${option}`}
                          disabled={isSubmittingExternal}
                          onClick={() => handleOptionSelect("qualityCare", option)}
                          className={`w-full relative py-4 px-6 rounded-2xl flex items-center justify-between text-base sm:text-lg font-bold transition-all cursor-pointer select-none active:scale-[0.99] border-2 ${
                            isSelected 
                              ? "bg-[#1B365D] border-[#1B365D] text-white shadow-sm" 
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {option === "Yes" && <ThumbsUp className="w-5 h-5 text-[#E31B23]" />}
                            {option === "No" && <ThumbsDown className="w-5 h-5 text-[#E31B23]" />}
                            {option === "Somewhat" && <HelpCircle className="w-5 h-5 text-[#E31B23]" />}
                            <span>{option}</span>
                          </div>
                          
                          {/* Animated Checkmark Circle */}
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-white text-[#1B365D] rounded-full p-1 shadow-sm"
                            >
                              <Check className="w-4 h-4 stroke-[4px]" />
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 6: Clarity & Explanations (Formerly Question 4) */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B365D]/5 text-[#1B365D] rounded-xl shrink-0">
                      <Sparkles className="w-5 h-5 text-[#E31B23]" />
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#1B365D] uppercase tracking-wider font-display">Step 5: Explanations</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
                      Clarity and Communication
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed">
                      Did the nurse clearly explain your treatment, screening result, medication instructions, or next steps?
                    </p>
                  </div>

                  {/* Yes, No, Somewhat options */}
                  <div className="space-y-3 pt-3">
                    {(["Yes", "No", "Somewhat"] as const).map((option) => {
                      const isSelected = formState.clarityCommunication === option;
                      return (
                        <button
                          type="button"
                          key={option}
                          id={`btn-communication-${option}`}
                          disabled={isSubmittingExternal}
                          onClick={() => handleOptionSelect("clarityCommunication", option)}
                          className={`w-full relative py-4 px-6 rounded-2xl flex items-center justify-between text-base sm:text-lg font-bold transition-all cursor-pointer select-none active:scale-[0.99] border-2 ${
                            isSelected 
                              ? "bg-[#1B365D] border-[#1B365D] text-white shadow-sm" 
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {option === "Yes" && <ThumbsUp className="w-5 h-5 text-[#E31B23]" />}
                            {option === "No" && <ThumbsDown className="w-5 h-5 text-[#E31B23]" />}
                            {option === "Somewhat" && <HelpCircle className="w-5 h-5 text-[#E31B23]" />}
                            <span>{option}</span>
                          </div>
                          
                          {/* Checkmark */}
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-white text-[#1B365D] rounded-full p-1 shadow-sm"
                            >
                              <Check className="w-4 h-4 stroke-[4px]" />
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 7: Patient Suggestions (Formerly Question 5) */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B365D]/5 text-[#1B365D] rounded-xl shrink-0">
                      <MessageSquareCode className="w-5 h-5 text-[#E31B23]" />
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#1B365D] uppercase tracking-wider font-display">Step 6: Patient Feedback</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
                      Your Feedback
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed">
                      What is one thing the clinic nurse could do to make your next visit better? <span className="text-slate-400 font-medium">(Optional)</span>
                    </p>
                  </div>

                  <div className="pt-2">
                    <textarea
                      rows={4}
                      id="input-comment"
                      value={formState.patientComment}
                      onChange={handleCommentChange}
                      disabled={isSubmittingExternal}
                      placeholder="Type your feedback here or use one of the quick buttons below..."
                      className="w-full p-4 text-base border-2 border-slate-200 rounded-2xl focus:border-[#1B365D] focus:ring-0 bg-slate-50/50 resize-none transition-all placeholder:text-slate-400 text-slate-800 font-extrabold"
                    />
                    
                    {/* Fast presets for elderly or quick taps */}
                    <div className="flex flex-wrap gap-2 mt-3.5">
                      {[
                        "Everything was perfect!",
                        "Friendly staff, excellent service!",
                        "None - very satisfied!"
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          disabled={isSubmittingExternal}
                          onClick={() => setFormState(prev => ({ ...prev, patientComment: preset }))}
                          className="px-3.5 py-2.5 text-xs font-bold text-[#1B365D] bg-[#1B365D]/5 hover:bg-[#1B365D]/10 rounded-xl transition-colors cursor-pointer border border-[#1B365D]/10 font-extrabold"
                        >
                          + "{preset}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Optional Patient Identity */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B365D]/5 text-[#1B365D] rounded-xl shrink-0">
                      <User className="w-5 h-5 text-[#E31B23]" />
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#1B365D] uppercase tracking-wider font-display">Step 7: Your Details</span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
                      Would You Like to Be Contacted?
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed">
                      Sharing your name and number is completely optional — you're welcome to stay anonymous. <span className="text-slate-400 font-medium">(Optional)</span>
                    </p>
                  </div>

                  {/* Anonymous vs Share details toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      id="btn-stay-anonymous"
                      onClick={() => handleAnonymousChoice(true)}
                      disabled={isSubmittingExternal}
                      className={`relative py-4 px-5 rounded-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer select-none active:scale-95 border-2 ${
                        formState.isAnonymous
                          ? "bg-[#1B365D] border-[#1B365D] text-white shadow-md"
                          : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <span className={`p-2.5 rounded-xl shrink-0 ${formState.isAnonymous ? "bg-white/10 text-white" : "bg-white border border-slate-100 shadow-xs"}`}>
                        <EyeOff className={`w-5 h-5 ${formState.isAnonymous ? "text-white" : "text-[#1B365D]"}`} />
                      </span>
                      <span className="text-sm font-black tracking-tight leading-snug">Stay Anonymous</span>
                    </button>

                    <button
                      type="button"
                      id="btn-share-details"
                      onClick={() => handleAnonymousChoice(false)}
                      disabled={isSubmittingExternal}
                      className={`relative py-4 px-5 rounded-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer select-none active:scale-95 border-2 ${
                        !formState.isAnonymous
                          ? "bg-[#1B365D] border-[#1B365D] text-white shadow-md"
                          : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <span className={`p-2.5 rounded-xl shrink-0 ${!formState.isAnonymous ? "bg-white/10 text-white" : "bg-white border border-slate-100 shadow-xs"}`}>
                        <User className={`w-5 h-5 ${!formState.isAnonymous ? "text-white" : "text-[#1B365D]"}`} />
                      </span>
                      <span className="text-sm font-black tracking-tight leading-snug">Share My Details</span>
                    </button>
                  </div>

                  {/* Identity fields, shown only when the patient opts to share details */}
                  {!formState.isAnonymous && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label htmlFor="input-patient-name" className="text-[10px] font-black text-[#1B365D] uppercase tracking-wider block">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="input-patient-name"
                            value={formState.patientName}
                            onChange={(e) => handleIdentityFieldChange("patientName", e.target.value)}
                            disabled={isSubmittingExternal}
                            placeholder="e.g. Jane"
                            className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:border-[#1B365D] focus:ring-0 outline-hidden font-extrabold text-slate-800 shadow-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="input-patient-surname" className="text-[10px] font-black text-[#1B365D] uppercase tracking-wider block">
                            Surname
                          </label>
                          <input
                            type="text"
                            id="input-patient-surname"
                            value={formState.patientSurname}
                            onChange={(e) => handleIdentityFieldChange("patientSurname", e.target.value)}
                            disabled={isSubmittingExternal}
                            placeholder="e.g. Smith"
                            className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:border-[#1B365D] focus:ring-0 outline-hidden font-extrabold text-slate-800 shadow-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="input-contact-number" className="text-[10px] font-black text-[#1B365D] uppercase tracking-wider block">
                          Contact Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            id="input-contact-number"
                            value={formState.contactNumber}
                            onChange={(e) => handleIdentityFieldChange("contactNumber", e.target.value)}
                            disabled={isSubmittingExternal}
                            placeholder="e.g. 082 123 4567"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:border-[#1B365D] focus:ring-0 outline-hidden font-extrabold text-slate-800 shadow-xs"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
              {/* Back Button */}
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isSubmittingExternal}
                  className="py-3 px-5 border-2 border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 font-black rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-extrabold">Back</span>
                </button>
              ) : (
                <div /> // Spacer
              )}

              {/* Next / Submit Button */}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isCurrentStepAnswered() || isSubmittingExternal}
                  className={`py-3.5 px-6 font-bold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCurrentStepAnswered()
                      ? "bg-[#1B365D] hover:bg-[#1B365D]/90 text-white shadow-sm font-extrabold"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100 font-extrabold"
                  }`}
                >
                  <span className="text-sm font-extrabold">Next Step</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmittingExternal}
                  className="py-3.5 px-7 font-black rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-md bg-[#E31B23] hover:bg-[#E31B23]/90 text-white disabled:opacity-80"
                >
                  {isSubmittingExternal ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-bold">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-black uppercase tracking-wider">Submit Feedback</span>
                      <Check className="w-5 h-5 stroke-[3px]" />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  );
}
