import { Simulation } from "@/types/typesData";
import { getSession } from "next-auth/react";

export async function fetchSimulations(nif: string): Promise<Simulation[]> {
	const session = await getSession();

	if (!session?.user.accessToken) {
		throw new Error("Token de acesso não disponível");
	}

	if (!nif) {
		throw new Error("NIF não disponível");
	}

	const response = await fetch(
		`/api/anywhere/api/v1/private/mobile/entity/nif/${nif}/simulations`,
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
		throw new Error("Erro ao buscar simulações");
	}

	return await response.json();
}

export interface ClientInfo {
	name: string;
	email: string;
	phone?: string;
}

export async function getClientInfo(clientReference: string): Promise<ClientInfo> {
	const session = await getSession();

	if (!session?.user.accessToken) {
		throw new Error("Token de acesso não disponível");
	}

	if (!clientReference) {
		throw new Error("NIF não disponível");
	}

	const response = await fetch(
		`/api/anywhere/api/v1/private/mobile/entity/identity/${clientReference}/info`,
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
		throw new Error("Erro ao buscar simulações");
	}

	return await response.json();
}
