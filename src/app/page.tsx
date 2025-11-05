"use client";

import SimulationScreen from "@/components/Simulation/page";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FaCalculator, FaShieldAlt } from "react-icons/fa";

export default function Page() {
	return (
		<main className="flex flex-col px-4 md:px-10 pt-8 pb-4 gap-8 min-h-screen bg-gradient-to-b from-blue-100 to-white">
			<Header />
			<div className="flex flex-col items-center justify-center gap-4 mb-6">
				<div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border-2 border-blue-300/50">
					<div className="bg-gradient-to-br from-[#002B5B] to-[#004B9B] p-3 rounded-xl shadow-md">
						<FaCalculator className="w-8 h-8 text-white" />
					</div>
					<div className="text-center">
						<h1 className="text-3xl md:text-4xl font-bold text-[#002B5B] mb-1 bg-gradient-to-r from-[#002B5B] to-[#004B9B] bg-clip-text text-transparent">
							Simulador de Seguros
						</h1>
						<p className="text-base md:text-lg text-gray-700 font-medium flex items-center gap-2 justify-center">
							<FaShieldAlt className="text-[#002B5B]" />
							Proteja o que é importante para você
						</p>
					</div>
				</div>
				<p className="text-sm md:text-base text-[#002B5B] font-semibold">
					🎯 Escolha um produto abaixo e faça sua simulação personalizada
				</p>
			</div>
			<SimulationScreen />
			<Footer />
		</main>
	);
}
