import { FaFilter, FaSearch } from "react-icons/fa";

export default function EmptyState({
  message = "Nenhum dado encontrado!",
  showFilter = true,
}: {
  message?: string;
  showFilter?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <div className="relative">
        <FaSearch className="text-4xl text-gray-400 animate-pulse" />
        {showFilter && (
          <FaFilter
            className="absolute -top-2 -right-2 text-xl text-[#2d4e7f] animate-spin-slow"
            style={{ animationDuration: "3s" }}
          />
        )}
      </div>
      <p className="text-gray-500 text-center">
        {message}
        <br />
        Tente novamente mais tarde.
      </p>
    </div>
  );
}
