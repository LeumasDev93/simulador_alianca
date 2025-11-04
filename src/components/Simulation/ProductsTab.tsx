import { Product } from "@/types/typesData";
import { LoadingContainer } from "../ui/loading-container";
import Card from "./Card";
import EmptyState from "./Form/EmptyState";

export default function ProductsTab({
  loading,
  error,
  products,
  onSelect,
  loadingProductId,
}: {
  loading: boolean;
  error: string | null;
  products: Product[];
  onSelect: (product: Product) => void;
  loadingProductId?: string | null;
}) {
  if (loading) return <LoadingContainer message="CARREGANDO PRODUTOS..." />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (products.length === 0) return <EmptyState />;
 console.log(products, "products");
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 items-stretch sm:items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {products.map((product) => (
          <div
            key={product.productId}
            className="w-full sm:w-auto sm:flex-1 sm:max-w-[320px]"
          >
            <Card 
              product={product} 
              onSimulate={() => onSelect(product)} 
              isLoading={loadingProductId === product.productId} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
