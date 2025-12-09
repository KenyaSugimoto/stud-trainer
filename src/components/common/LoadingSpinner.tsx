interface LoadingSpinnerProps {
	message?: string;
	size?: "sm" | "md" | "lg";
}

export const LoadingSpinner = ({ message, size = "md" }: LoadingSpinnerProps) => {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-8 h-8",
		lg: "w-12 h-12",
	};

	return (
		<div className="flex flex-col items-center justify-center gap-4 py-8">
			<div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
			{message && <p className="text-gray-600">{message}</p>}
		</div>
	);
};
