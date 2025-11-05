"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useProducts } from "@/hooks/useProducts";
// SimulationForm não é mais usado aqui; navegação vai para /simulaction
import ProductsTab from "./ProductsTab";
// Removed MySimulationsTab per requirement: only products and step form
import { Product } from "@/types/typesData";
import Image from "next/image";

import { LoadingContainer } from "../ui/loading-container";
import { FaExclamationTriangle } from "react-icons/fa";

export default function SimulationScreen() {
  const { products, loading, error } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("types");


  return (
    <div className="items-center justify-center">

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
          onSelect={(p) => {
            window.location.href = `/simulaction?productId=${p.productId}`;
          }}
        />
      )}


    </div>
  );
}
