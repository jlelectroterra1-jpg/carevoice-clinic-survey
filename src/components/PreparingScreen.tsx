import { Heart, ShieldCheck } from "lucide-react";

/**
 * Shown while the frontend waits for the backend API to respond, so patients
 * never see a generic hosting-platform loading page. Only used when the
 * frontend is served separately from the API (see src/utils/api.ts) — the
 * combined Render deployment never needs this, since the server can't have
 * served the page at all unless it was already awake.
 */
export default function PreparingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased relative">
      <div className="absolute top-0 left-0 right-0 h-[380px] bg-gradient-to-b from-[#1B365D]/5 to-transparent -z-10 pointer-events-none" />

      <main className="flex-1 w-full max-w-xl mx-auto px-4.5 pt-2 sm:pt-6 pb-6 sm:pb-8 flex flex-col items-center justify-center text-center">
        <div className="flex justify-center mb-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#1B365D]/5 border border-[#1B365D]/10">
            <div className="w-4.5 h-4.5 rounded-full border-2 border-[#E31B23] border-t-transparent animate-spin" />
          </div>
        </div>

        <h2 className="text-lg sm:text-2xl font-black text-[#1B365D] tracking-wider uppercase leading-none font-sans">
          Arrie Nel Pharmacy
        </h2>
        <div className="w-14 h-0.5 bg-[#E31B23] mx-auto rounded-full my-2" />
        <div className="text-slate-500 text-[10px] sm:text-[11px] font-black tracking-[0.15em] uppercase leading-none mb-3">
          Sunningdale Clinic
        </div>

        <h1 className="text-sm sm:text-base font-black text-[#1B365D] tracking-tight leading-tight">
          Patient Experience Survey
        </h1>
        <p className="text-slate-500 text-sm font-bold mt-4">Preparing your survey&hellip;</p>
        <p className="text-slate-400 text-xs font-semibold mt-1">This may take a few seconds.</p>
      </main>

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
