import type { ReactNode } from "react";

interface ErrorStateProps {
	title?: string;
	message: string;
	action?: ReactNode;
}

export const ErrorState = ({ title = "エラーが発生しました", message, action }: ErrorStateProps) => {
	return (
		<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
			<p className="text-xl font-semibold text-red-600 mb-2">{title}</p>
			<p className="text-gray-700 mb-6">{message}</p>
			{action && <div>{action}</div>}
		</div>
	);
};

