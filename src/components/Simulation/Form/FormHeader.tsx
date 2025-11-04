import { FaTimes } from "react-icons/fa";

export default function FormHeader({
  description,
  onClose,
}: {
  title?: string;
  description?: string;
  onClose?: () => void;
}) {
  return (
    <div className="relative mb-4">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-[#002B5B] hover:text-[#002B5B]/70"
        >
          <FaTimes />
        </button>
      )}
      <div className="flex justify-center items-center">
        <div className="text-center max-w-xl px-4">
          <p className="text-gray-600 ">{description}</p>
        </div>
      </div>
    </div>
  );
}
