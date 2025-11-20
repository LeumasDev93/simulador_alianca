"use client";

import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, Product } from '@/types/typesData';

export const useProductDetails = (productId: string) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProductDetails = useCallback(async (id: string) => {
        try {
            console.log("=== DEBUG PRODUCT DETAILS ===");
            console.log("Fetching product with ID:", id);
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/products/${id}`);
            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                throw new Error(errorData.error || 'Failed to fetch product details');
            }

            const data: ApiResponse<Product> = await response.json();
            console.log("Product data received:", data);
            setProduct(data.results);
        } catch (err) {
            console.error("Error in fetchProductDetails:", err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (productId) {
            fetchProductDetails(productId);
        }
    }, [productId, fetchProductDetails]);

    const refresh = () => {
        if (productId) {
            fetchProductDetails(productId);
        }
    };

    return { product, loading, error, refresh };
};