"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimulationScreen from "@/components/simulation/SimulationScreen";
import { FaCalculator, FaShieldAlt } from "react-icons/fa";

export default function Page() {
	return (
		<main className="flex flex-col px-4 md:px-10 pt-8 pb-4 gap-8 min-h-screen bg-gradient-to-b from-gray-200 to-white">
		
			<div className="w-full h-full flex flex-col items-center justify-center px-4 text-blue-900 z-10 relative">
				<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 text-center">
					Bem-vindo ao Simulador da Aliança Seguros
				</h1>
				<h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-center font-light max-w-3xl">
					Simule, compare e escolha o seguro que melhor se adapta a si
				</h2>
			</div>
			<SimulationScreen />
			<Footer />
		</main>
	);
}
