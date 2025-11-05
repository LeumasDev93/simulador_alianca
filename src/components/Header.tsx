import Image from "next/image";
import aliancaLogo from "@/assets/alianca.png";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full">
      <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
        <Link href="/" className="flex flex-row items-center gap-2 sm:gap-3 md:gap-4">
          <Image 
            src={aliancaLogo} 
            alt="Aliança Logo" 
            width={100} 
            height={100} 
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#002B5B]">
              Simulador
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[#004B9B]">
              Aliança Seguros
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}

