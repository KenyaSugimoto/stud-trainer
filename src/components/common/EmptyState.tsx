import type { ReactNode } from "react";

interface EmptyStateProps {
	title: string;
	message?: string;
	action?: ReactNode;
}

export const EmptyState = ({ title, message, action }: EmptyStateProps) => {
	return (
		<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
			<p className="text-xl font-semibold text-gray-700 mb-2">{title}</p>
			{message && <p className="text-gray-600 mb-6">{message}</p>}
			{action && <div>{action}</div>}
		</div>
	);
};
