import { useCallback, useState } from "react";
import type { Toast, ToastType } from "../types/ui";

let toastIdCounter = 0;

export const useToast = () => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
		const id = `toast-${toastIdCounter++}`;
		const newToast: Toast = { id, type, message, duration };
		setToasts((prev) => [...prev, newToast]);
		return id;
	}, []);

	const closeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const showSuccess = useCallback(
		(message: string, duration?: number) => showToast("success", message, duration),
		[showToast],
	);
	const showError = useCallback(
		(message: string, duration?: number) => showToast("error", message, duration),
		[showToast],
	);
	const showInfo = useCallback(
		(message: string, duration?: number) => showToast("info", message, duration),
		[showToast],
	);
	const showWarning = useCallback(
		(message: string, duration?: number) => showToast("warning", message, duration),
		[showToast],
	);

	return {
		toasts,
		showToast,
		closeToast,
		showSuccess,
		showError,
		showInfo,
		showWarning,
	};
};
