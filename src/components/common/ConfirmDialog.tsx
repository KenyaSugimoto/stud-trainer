import type { ConfirmDialogState } from "../../types/ui";

interface ConfirmDialogProps {
	dialog: ConfirmDialogState;
	onClose: () => void;
}

export const ConfirmDialog = ({ dialog, onClose }: ConfirmDialogProps) => {
	if (!dialog.isOpen) return null;

	const handleConfirm = () => {
		dialog.onConfirm();
		onClose();
	};

	const handleCancel = () => {
		if (dialog.onCancel) {
			dialog.onCancel();
		}
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCancel}>
			<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
				<h2 className="text-xl font-bold mb-4">{dialog.title}</h2>
				<p className="text-gray-700 mb-6">{dialog.message}</p>
				<div className="flex gap-3 justify-end">
					<button
						type="button"
						onClick={handleCancel}
						className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
					>
						{dialog.cancelLabel ?? "キャンセル"}
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
					>
						{dialog.confirmLabel ?? "確認"}
					</button>
				</div>
			</div>
		</div>
	);
};

