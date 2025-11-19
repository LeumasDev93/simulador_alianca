"use client";

import Image from "next/image";
import LogoIdCheck from "@/assets/sisp/mcidcheck.png";
import LogoVinti4 from "@/assets/sisp/vinti4.jpg";
import LogoVisaSecure from "@/assets/sisp/Verified_by_Visa.jpg";

const PAYMENT_SECURITY_LOGOS = [
  { src: LogoVinti4, alt: "Vinti4" },
  { src: LogoVisaSecure, alt: "Visa Secure" },
  { src: LogoIdCheck, alt: "SISP ID Check" },
] as const;

interface PaymentSecurityLogosProps {
  className?: string;
}

export function PaymentSecurityLogos({ className = "" }: PaymentSecurityLogosProps) {
  return (
    <div
      className={`flex flex-nowrap items-center justify-center gap-2 sm:gap-3 border border-blue-100 rounded-lg p-2 overflow-x-auto bg-white ${className}`}
    >
      {PAYMENT_SECURITY_LOGOS.map((logo) => (
        <div key={logo.alt} className="flex items-center justify-center flex-shrink-0">
          <Image
            src={logo.src}
            alt={logo.alt}
            width={50}
            height={16}
            className="object-contain w-12 sm:w-14 h-auto"
            priority={false}
          />
        </div>
      ))}
    </div>
  );
}