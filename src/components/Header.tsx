import Image from "next/image";
import aliancaLogo from "@/assets/alianca.png";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full">
      <div className="flex items-center justify-center mb-8">
        <Link href="/" className="flex flex-col md:flex-row items-center gap-4">
          <Image 
            src={aliancaLogo} 
            alt="Aliança Logo" 
            width={100} 
            height={100} 
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
          <div className="text-center justify-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-[#002B5B]">
              Simulador
            </h1>
            <p className="text-sm md:text-base text-[#004B9B] pl-1">
              Aliança Seguros
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}

