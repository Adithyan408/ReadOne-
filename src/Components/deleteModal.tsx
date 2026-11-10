import { createPortal } from "react-dom";

type Props = {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteConfirmationModal({
  isOpen,
  title = "Delete",
  message,
  onClose,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

        return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-2xl">
                  🗑️
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-gray-700 leading-relaxed">{message}</p>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 shadow-xs"
                >
                  Delete
                </button>
              </div>
            </div>
        </div>,
        document.body
        );
}

        export default DeleteConfirmationModal;
