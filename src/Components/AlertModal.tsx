type AlertModalProps = {
  isOpen: boolean;
  message: string;
  onClose: () => void;
};

function AlertModal({ isOpen, message, onClose }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-red-600">
          Validation Error
        </h2>

        <p className="mt-3 text-gray-600">{message}</p>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal