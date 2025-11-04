"use client";

import { Suspense } from "react";
import SimulactionContent from "@/components/SimulactionContent";
import { LoadingContainer } from "@/components/ui/loading-container";

export default function SimulactionPage() {
	return (
		<Suspense fallback={<LoadingContainer message="CARREGANDO..." fullHeight />}>
			<SimulactionContent />
		</Suspense>
	);
}

