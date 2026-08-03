import React from "react";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
            🗑️
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>

            <p className="mt-1 text-sm text-gray-600">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="mt-6 text-gray-700">{message}</p>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;
