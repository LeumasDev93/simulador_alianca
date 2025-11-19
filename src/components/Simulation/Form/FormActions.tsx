import { FaSpinner } from "react-icons/fa";

type FormActionsProps = {
  onNext: () => void;
  onPrevious?: () => void;
  onCancel?: () => void; // Tornar opcional para maior flexibilidade
  submitting: boolean;
  nextLabel?: string;
};

export default function FormActions({
  submitting,
  onCancel,
  onNext,
  onPrevious,
  nextLabel = "AVANÇAR ▶",
}: FormActionsProps) {
  return (
    <div className="flex justify-center space-x-3 mt-6">
      {/* Botão Voltar - só aparece se houver aba anterior */}
      {onPrevious && (
        <button
          type="button"
          onClick={onPrevious}
          disabled={submitting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          ◀ VOLTAR
        </button>
      )}

      {/* Botão Cancelar - sempre visível */}
      {onCancel && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }}
          disabled={submitting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          CANCELAR
        </button>
      )}

      {/* Botão Avançar/Simular */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Botão SIMULAR clicado, chamando onNext");
          onNext();
        }}
        disabled={submitting}
        className="px-6 py-2 bg-[#002256] text-white rounded-md hover:bg-[#003380] disabled:opacity-50 flex items-center justify-center"
      >
        {submitting && <FaSpinner className="animate-spin mr-2" />}
        {submitting ? "Simulando..." : nextLabel}
      </button>
    </div>
  );
}
