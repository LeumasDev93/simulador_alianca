import { FaTimes } from "react-icons/fa";

export default function ErrorState({
  error,
  onClose,
}: {
  error: string;
  onClose: () => void;
}) {
  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#002256]">Erro</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>
      </div>
      <p className="text-red-500">{error}</p>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="bg-[#002256] text-white px-4 py-2 rounded-md"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
