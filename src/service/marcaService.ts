export interface Brand {
	id: number;
	name: string;
}

export async function fetchVehicleBrands(): Promise<Brand[]> {
	try {
		// Chama a API route local que faz a requisição do servidor
		const response = await fetch('/api/brands', {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			cache: 'no-store',
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Erro na requisição de marcas:", error);
		throw new Error("Falha ao conectar com o servidor de marcas");
	}
}
