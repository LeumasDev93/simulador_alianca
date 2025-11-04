import { SimulationResponse } from "@/types/typesData";

export const getSimulationDetails = async (
	reference: string
): Promise<SimulationResponse> => {
	const res = await fetch(`/api/detailsSimulations?reference=${reference}`, {
		method: "GET",
	});

	if (!res.ok) {
		// could throw or return fallback; keeping as no-throw per provided snippet
	}

	const responseData = await res.json();
	
	if (responseData.simulation) {
		return responseData.simulation as SimulationResponse;
	}
	
	return responseData as SimulationResponse;
};
