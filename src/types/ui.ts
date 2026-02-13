// UI関連の型定義

// 画面状態の型
export type ScreenState = "loading" | "empty" | "error" | "success";

// APIレスポンスの基本型（将来の拡張用）
export interface ApiResponse<T> {
	data: T;
	error?: string;
}

// フォームバリデーションエラー
export interface FormError {
	field: string;
	message: string;
}

// Toast通知の型
export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number; // ミリ秒、未指定の場合はデフォルト値
}

// 確認ダイアログの型
export interface ConfirmDialogState {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
}
