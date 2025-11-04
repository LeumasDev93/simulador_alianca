"use client";

import Image from "next/image";
// import { useEffect, useState } from "react";
import LogoAlianca from "@/assets/logo.gif";

export function LoadingScreen({ message = "POR FAVOR AGUARDE..." }) {
  // const [rotation, setRotation] = useState(0);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setRotation((prev) => (prev + 5) % 360);
  //   }, 50);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 xl:w-32 xl:h-32 mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={LogoAlianca}
            alt="MYALIANCA Loading"
            width={128}
            height={128}
            className="object-contain"
            priority
          />
        </div>
      </div>
      <p className="text-sm sm:text-lg xl:text-xl font-medium text-gray-700 text-center px-4">
        {message}
      </p>
      <div className="mt-4 flex space-x-2">
        <div
          className="w-3 h-3 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-3 h-3 bg-blue-900 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-3 h-3 bg-red-800 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
    </div>
  );
}
