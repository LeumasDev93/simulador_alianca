import { getSession } from "next-auth/react";

export interface Brand {
	id: number;
	name: string;
}

export async function fetchVehicleBrands(): Promise<Brand[]> {
	const session = await getSession();

	if (!session?.user.accessToken) {
		throw new Error("Token de acesso não disponível");
	}

	try {
		const response = await fetch('/api/anywhere/api/v1/private/mobile/vehicle/brands', {
			method: "GET",
			headers: {
				Authorization: `Bearer ${session.user.accessToken}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`Erro ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Erro na requisição de marcas:", error);
		throw new Error("Falha ao conectar com o servidor de marcas");
	}
}
