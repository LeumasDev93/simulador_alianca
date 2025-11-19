"use client";

import Image from "next/image";
import LogoIdCheck from "@/assets/sisp/mcidcheck.png";
import LogoVinti4 from "@/assets/sisp/vinti4.jpg";
import LogoVisaSecure from "@/assets/sisp/Verified_by_Visa.jpg";

const PAYMENT_SECURITY_LOGOS = [
  { src: LogoVinti4, alt: "Vinti4", id: "vinti4" },
  { src: LogoVisaSecure, alt: "Visa Secure", id: "visa-secure" },
  { src: LogoIdCheck, alt: "SISP ID Check", id: "id-check" },
] as const;

interface PaymentSecurityLogosFooterProps {
  className?: string;
}

export function PaymentSecurityLogosFooter({ className = "" }: PaymentSecurityLogosFooterProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="inline-flex flex-nowrap items-center justify-center gap-2 sm:gap-3 border border-blue-100 rounded-lg py-2 px-4 overflow-x-auto bg-white">
        {PAYMENT_SECURITY_LOGOS.map((logo) => (
          <div key={logo.id} className="flex w-8 sm:w-10 items-center justify-center flex-shrink-0">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={50}
              height={16}
              className="object-contain w-8 sm:w-10 h-auto"
              priority={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}