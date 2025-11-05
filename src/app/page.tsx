"use client";

import SimulationScreen from "@/components/Simulation/page";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FaCalculator, FaShieldAlt } from "react-icons/fa";

export default function Page() {
	return (
		<main className="flex flex-col px-4 md:px-10 pt-8 pb-4 gap-8 min-h-screen bg-gradient-to-b from-blue-100 to-white">
			<Header />
			<div className="flex flex-col items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
				<div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-300/50 w-full max-w-4xl">
					<div className="bg-gradient-to-br from-[#002B5B] to-[#004B9B] p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-md">
						<FaCalculator className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
					</div>
					<div className="text-center sm:text-left flex-1">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#002B5B] mb-1 bg-gradient-to-r from-[#002B5B] to-[#004B9B] bg-clip-text text-transparent">
							Simulador de Seguros
						</h1>
						<p className="text-sm sm:text-base md:text-lg text-gray-700 font-medium flex items-center gap-2 justify-center sm:justify-start flex-wrap">
							<FaShieldAlt className="text-[#002B5B] w-4 h-4 sm:w-5 sm:h-5" />
							<span>Proteja o que é importante para você</span>
						</p>
					</div>
				</div>
				<p className="text-xs sm:text-sm md:text-base text-[#002B5B] font-semibold text-center px-4">
					🎯 Escolha um produto abaixo e faça sua simulação personalizada
				</p>
			</div>
			<SimulationScreen />
			<Footer />
		</main>
	);
}
