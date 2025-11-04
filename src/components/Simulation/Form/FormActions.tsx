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
  // Decide qual função chamar no botão esquerdo
  const handleLeftButton = (): void => {
    if (onPrevious) {
      onPrevious();
    } else if (onCancel) {
      onCancel();
    }
  };

  // Decide o texto do botão esquerdo
  const leftButtonLabel = onPrevious ? "◀ VOLTAR" : "CANCELAR";

  // Mostrar o botão esquerdo só se houver alguma função para chamar
  const showLeftButton = !!onPrevious || !!onCancel;

  return (
    <div className="flex justify-center space-x-3 mt-6">
      {showLeftButton && (
        <button
          type="button"
          onClick={handleLeftButton}
          disabled={submitting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {leftButtonLabel}
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={submitting}
        className="px-6 py-2 bg-[#002256] text-white rounded-md hover:bg-[#003380] disabled:opacity-50 flex items-center justify-center"
      >
        {submitting && <FaSpinner className="animate-spin mr-2" />}
        {submitting ? "Simulando..." : nextLabel}
      </button>
    </div>
  );
}
