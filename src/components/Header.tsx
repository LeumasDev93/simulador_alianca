import Image from "next/image";
import aliancaLogo from "@/assets/alianca.png";

export default function Header() {
  return (
    <header className="w-full">
      <div className="flex items-center justify-center mb-8">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Image 
            src={aliancaLogo} 
            alt="Aliança Logo" 
            width={60} 
            height={60} 
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-[#002B5B]">
              Simulador
            </h1>
            <p className="text-sm md:text-base text-[#004B9B]">
              Alianças Seguros
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

