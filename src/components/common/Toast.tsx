import { useEffect } from "react";
import type { Toast as ToastType } from "../../types/ui";

interface ToastProps {
	toast: ToastType;
	onClose: () => void;
}

export const Toast = ({ toast, onClose }: ToastProps) => {
	useEffect(() => {
		const duration = toast.duration ?? 3000;
		const timer = setTimeout(() => {
			onClose();
		}, duration);

		return () => clearTimeout(timer);
	}, [toast.duration, onClose]);

	const bgColorMap = {
		success: "bg-green-600",
		error: "bg-red-600",
		info: "bg-blue-600",
		warning: "bg-yellow-600",
	};

	return (
		<div
			className={`${bgColorMap[toast.type]} text-white px-4 py-3 rounded shadow-lg flex items-center justify-between min-w-[300px] max-w-md`}
		>
			<span>{toast.message}</span>
			<button
				type="button"
				onClick={onClose}
				className="ml-4 text-white hover:text-gray-200 font-bold"
				aria-label="閉じる"
			>
				×
			</button>
		</div>
	);
};

interface ToastContainerProps {
	toasts: ToastType[];
	onClose: (id: string) => void;
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
	if (toasts.length === 0) return null;

	return (
		<div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
			{toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
			))}
		</div>
	);
};

