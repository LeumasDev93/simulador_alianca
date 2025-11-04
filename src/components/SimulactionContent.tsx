"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SimulationForm from "./Simulation/Form/SimulationForm";

export default function SimulactionContent() {
	const searchParams = useSearchParams();
	const productId = searchParams.get("productId") || "";

	return (
		<main className="flex flex-col px-4 md:px-10 pt-24 pb-20 gap-8 min-h-[calc(100vh-8rem)]">
			{productId ? (
				<SimulationForm productId={productId} reset={() => {}} />
			) : (
				<div className="w-full flex items-center justify-center py-20">
					<p className="text-gray-700">Selecione um produto em /cards para iniciar a simulação.</p>
				</div>
			)}
		</main>
	);
}