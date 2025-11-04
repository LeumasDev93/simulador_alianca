import { getSession } from "next-auth/react";

export interface Model {
	id: number;
	name: string;
}

export async function fetchVehicleModels(brandId: number): Promise<Model[]> {
	const session = await getSession();

	if (!session?.user.accessToken) {
		throw new Error("Token de acesso não disponível");
	}

	const response = await fetch(
		`/api/anywhere/api/v1/private/mobile/vehicle/brands/${brandId}/models`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${session.user.accessToken}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		}
	);

	if (!response.ok) {
		throw new Error("Erro ao buscar modelos");
	}

	return await response.json();
}
