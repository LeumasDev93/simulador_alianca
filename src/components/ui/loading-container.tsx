"use client";

import Image from "next/image";
import LogoAlianca from "@/assets/logo.gif";

interface LoadingContainerProps {
  message?: string;
  fullHeight?: boolean;
  className?: string;
}

export function LoadingContainer({ 
  message = "CARREGANDO...", 
  fullHeight = false,
  className = ""
}: LoadingContainerProps) {
  const containerClasses = fullHeight 
    ? "min-h-screen flex flex-col items-center justify-center"
    : "flex flex-col items-center justify-center py-12";

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 xl:w-24 xl:h-24 mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={LogoAlianca}
            alt="MYALIANCA Loading"
            width={96}
            height={96}
            className="object-contain"
            priority
          />
        </div>
      </div>
      <p className="text-sm sm:text-base xl:text-lg font-medium text-gray-700 text-center px-4 mb-4">
        {message}
      </p>
      <div className="flex space-x-2">
        <div
          className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-900 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 sm:w-3 sm:h-3 bg-red-800 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
    </div>
  );
}
