"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import { ApiResponse, Product } from "@/types/typesData";
import { useEffect, useState } from "react";

type UseProductsReturn = {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Chama a API route local ao invés da API externa diretamente
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Product[]> = await response.json();

      if (data.info.errors || !data.results) {
        throw new Error(
          data.info.errors?.[0] || "Dados inválidos retornados da API"
        );
      }

      setProducts(data.results);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao buscar produtos"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refresh: fetchProducts,
  };
}
