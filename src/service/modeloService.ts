export interface Model {
	id: number;
	name: string;
}

export async function fetchVehicleModels(brandId: number): Promise<Model[]> {
	try {
		// Chama a API route local que faz a requisição do servidor
		const response = await fetch(
			`/api/brands/${brandId}/models`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				cache: 'no-store',
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || "Erro ao buscar modelos");
		}

		return await response.json();
	} catch (error) {
		console.error("Erro ao buscar modelos:", error);
		throw new Error("Erro ao buscar modelos");
	}
}
