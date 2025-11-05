"use client";

import SimulationScreen from "@/components/Simulation/page";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Page() {
	return (
		<main className="flex flex-col px-4 md:px-10 pt-8 pb-4 gap-8 min-h-screen bg-gradient-to-b from-blue-100 to-white">
			<Header />
			<div>
				<h1 className="text-2xl font-bold">Simulador de Seguros</h1>
				<p className="text-gray-700">Selecione um produto em /cards para iniciar a simulação.</p>
			</div>
			<SimulationScreen />
			<Footer />
		</main>
	);
}
