"use client";

import Footer from "@/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import { LoadingContainer } from "@/components/ui/loading-container";
import { FaExclamationTriangle } from "react-icons/fa";
import ProductsTab from "@/components/simulation/ProductsTab";
import { Product } from "@/types/typesData";

export default function Page() {
	const { products, loading, error } = useProducts();
	return (
		<main className="flex flex-col px-4 md:px-10 pt-8 pb-4 gap-8 min-h-screen bg-gradient-to-b from-gray-200 to-white">
		
			<div className="w-full h-full flex flex-col items-center justify-center px-4 text-blue-900 z-10 relative">
				<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 text-center">
					Bem-vindo ao Simulador da Aliança Seguros
				</h1>
				<h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-center font-light max-w-3xl">
					Simule, compare e escolha o seguro que melhor se adapta a si
				</h2>
			</div>
			<section className="w-full flex flex-col items-center justify-center flex-1 py-8">

				{loading && (
				<LoadingContainer message="CARREGANDO SIMULAÇÕES..." />
				)}
				{error && (
				<div className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-2xl mb-6 shadow-lg">
					<div className="bg-red-200 p-2 rounded-full">
					<FaExclamationTriangle className="h-6 w-6 text-red-600" />
					</div>
					<div>
					<p className="font-bold text-base">Ops! Algo deu errado</p>
					<p className="text-sm">
						Erro ao carregar os produtos. Tente novamente mais tarde.
					</p>
					</div>
				</div>
				)}

				{!loading && !error && products && products.length > 0 && (
				<ProductsTab
					loading={loading}
					error={error}
					products={products}
					onSelect={(p: Product) => {
					window.location.href = `/simulaction?productId=${p.productId}`;
					}}
				/>
				)}


				</section>
			<Footer />
		</main>
	);
}
