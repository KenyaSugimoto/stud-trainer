import { useCallback, useState } from "react";
import type { ConfirmDialogState } from "../types/ui";

export const useConfirmDialog = () => {
	const [dialog, setDialog] = useState<ConfirmDialogState>({
		isOpen: false,
		title: "",
		message: "",
		onConfirm: () => {},
	});

	const openDialog = useCallback(
		(
			title: string,
			message: string,
			onConfirm: () => void,
			options?: {
				onCancel?: () => void;
				confirmLabel?: string;
				cancelLabel?: string;
			},
		) => {
			setDialog({
				isOpen: true,
				title,
				message,
				onConfirm,
				onCancel: options?.onCancel,
				confirmLabel: options?.confirmLabel,
				cancelLabel: options?.cancelLabel,
			});
		},
		[],
	);

	const closeDialog = useCallback(() => {
		setDialog((prev) => ({ ...prev, isOpen: false }));
	}, []);

	return {
		dialog,
		openDialog,
		closeDialog,
	};
};
