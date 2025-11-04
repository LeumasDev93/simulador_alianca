import { Product } from "@/types/typesData";
import { FaCar, FaHome, FaShieldAlt, FaPlane } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import { LiaSpinnerSolid } from "react-icons/lia";

const iconMap: Record<string, any> = {
  FaCar,
  FaHome,
  FaShieldAlt,
  FaPlane,
};

function resolveIconFromWebIcon(webIcon?: string | null) {
  if (!webIcon) return null;
  const Icon = (FaIcons as any)[webIcon];
  return Icon ? Icon : null;
}

export default function Card({ product, onSimulate, isLoading }: { product: Product; onSimulate?: (p: Product) => void; isLoading?: boolean }) {
  const DynamicIcon = resolveIconFromWebIcon((product as any).webIcon);
  const IconComponent = DynamicIcon || (product.icon ? iconMap[product.icon] : FaShieldAlt);

  return (
    <div className="group rounded-2xl border-2 border-white/50 bg-white/90 backdrop-blur-sm p-6 md:p-7 w-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:border-blue-300">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-[#002B5B] mb-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 font-medium bg-blue-50 px-3 py-1 rounded-full inline-block">
              {product.category}
            </p>
          </div>
          <div className="text-[#002B5B] bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl shadow-md group-hover:shadow-lg group-hover:rotate-12 transition-all duration-300">
            <IconComponent className="w-8 h-8" />
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        )}

        <button
          onClick={() => onSimulate?.(product)}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#002B5B] to-[#004B9B] hover:from-[#004B9B] hover:to-[#006BC5] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl py-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-base"
        >
          {isLoading && <LiaSpinnerSolid className="w-5 h-5 animate-spin" />}
          {isLoading ? "Carregando..." : "✨ Simular Agora"}
        </button>
      </div>
    </div>
  );
}