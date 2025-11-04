import { getSession, signIn } from "next-auth/react";

interface SimulationFormData {
	licensePlate: string;
	licenseDate: string;
	brand: string;
	model: string;
	seats?: string;
	cylinderCap?: string;
	weight?: string;
	chassis: string;
	Ilha: string;
	TipoDeUtilizacao: string;
	name: string;
	birthDate: string;
	driverLicenseNumber: string;
	driverLicenseDate: string;
	gender: string;
	nif: string;
	bi: string;
	passport: string;
	entityType: string;
	maritalStatus: string;
	email: string;
	mobile: string;
	currentValue: string;
}

interface SimulationResult {
	installmentValues: unknown;
}

export const fetchSimulation = async (
	formData: SimulationFormData,
	setIsLoading: (loading: boolean) => void,
	setSimulationResult: (result: SimulationResult) => void
) => {
	setIsLoading(true);
	const session = await getSession();

	if (!session?.user?.accessToken) {
		console.warn("Nenhum token encontrado - redirecionando para login");
		signIn();
		return null;
	}

	const generateRandomSimulationId = (): number => {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const seconds = String(now.getSeconds()).padStart(2, "0");
		const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
		return Number(timestamp);
	};

	const idSimulationTel = generateRandomSimulationId();

	const {
		licensePlate, licenseDate, brand, model, seats, cylinderCap, weight, chassis, Ilha, TipoDeUtilizacao,
		name, birthDate, driverLicenseNumber, driverLicenseDate, gender, nif, bi, passport,
		entityType, maritalStatus, email, mobile, currentValue
	} = formData;

	const payload = {
		idSimulationTel,
		producer: 2,
		registerDateSimulationTel: new Date().toISOString(),
		product: "EXTERNAL_AUTO",
		currency: "CVE",
		totalPremium: 0,
		startDate: new Date().toISOString().split('T')[0],
		simulationObjects: [
			{
				properties: {
					licensePlate,
					licenseDate,
					brand,
					model,
					seats: seats ? parseInt(seats) : undefined,
					cylinderCap: cylinderCap ? parseInt(cylinderCap) : undefined,
					weight: weight ? parseInt(weight) : undefined,
					chassis,
					currentValue,
					Ilha,
					TipoDeUtilizacao
				},
				children: [
					{
						type: "AUTO_C",
						properties: {
							name,
							birthDate,
							driverLicenseNumber,
							driverLicenseDate,
							gender
						}
					},
				]
			}
		],
		client: {
			nif,
			name,
			bi,
			birthDate,
			entityType,
			maritalStatus,
			passport,
			gender,
			emails: email ? [email] : [],
			mobiles: mobile ? [mobile] : []
		}
	};

	try {
		const response = await fetch("/api/simulation", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				token: session.user.accessToken,
				...payload,
			}),
			cache: "no-store",
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(`Erro ${response.status}: ${JSON.stringify(errorData)}`);
		}

		const simulationResult = await response.json();
		setSimulationResult(simulationResult.installmentValues);

		return simulationResult;
	} catch (error) {
		console.error("Falha na simulação:", {
			error: error instanceof Error ? error.message : error,
			timestamp: new Date().toISOString(),
		});
		if (error instanceof Error && error.message.includes("401")) {
			signIn();
		}
		throw error;
	} finally {
		setIsLoading(false);
	}
};
