"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import SimulationForm from "./simulation/form/SimulationForm";

export default function SimulactionContent() {
	const searchParams = useSearchParams();
	const productId = searchParams.get("productId") || "";

	return (
		<main className="flex flex-col px-4 md:px-10 pt-8 pb-4 gap-8 min-h-screen bg-gradient-to-b from-gray-200 to-white">
			{productId ? (
				<SimulationForm productId={productId} reset={() => {}} />
			) : (
				<div className="w-full flex items-center justify-center py-20">
					<p className="text-gray-700">Selecione um produto em /cards para iniciar a simulação.</p>
				</div>
			)}
			<Footer />
		</main>
	);
}