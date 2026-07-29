import React from "react";
import logoImg from "../assets/images/arrie_nel_logo_hd.png";

interface ArrieNelLogoProps {
  className?: string;
  height?: number; // Kept for interface compatibility
  showText?: boolean; // Kept for interface compatibility
}

/**
 * Premium high-definition Arrie Nel Pharmacy Group logo.
 * Uses the transparent, clean, and polished HD PNG version to ensure 100% faithful branding.
 * Rendered with image-rendering styles to ensure crisp presentation and no blurring on high-resolution displays.
 */
export default function ArrieNelLogo({ className = "" }: ArrieNelLogoProps) {
  return (
    <img
      src={logoImg}
      alt="Arrie Nel Pharmacy Group"
      className={`block mx-auto w-full max-w-[320px] sm:max-w-[450px] h-auto object-contain select-none ${className}`}
      style={{
        imageRendering: "crisp-edges",
        WebkitImageRendering: "-webkit-optimize-contrast",
      }}
      referrerPolicy="no-referrer"
    />
  );
}



