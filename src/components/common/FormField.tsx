import type { ReactNode } from "react";

export interface FormFieldProps {
	label: string;
	error?: string;
	required?: boolean;
	children: ReactNode;
	htmlFor?: string;
}

export const FormField = ({ label, error, required, children, htmlFor }: FormFieldProps) => {
	return (
		<div className="flex flex-col gap-2">
			<label htmlFor={htmlFor} className="font-semibold text-gray-200">
				{label}
				{required && <span className="text-red-400 ml-1">*</span>}
			</label>
			{children}
			{error && <p className="text-sm text-red-400">{error}</p>}
		</div>
	);
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	error?: string;
}

export const Input = ({ error, className = "", ...props }: InputProps) => {
	return (
		<input
			className={`border rounded px-3 py-2 bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? "border-red-500" : ""} ${className}`}
			{...props}
		/>
	);
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	error?: string;
	options: Array<{ value: string; label: string }>;
}

export const Select = ({ error, options, className = "", ...props }: SelectProps) => {
	return (
		<select
			className={`border rounded px-3 py-2 bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? "border-red-500" : ""} ${className}`}
			{...props}
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value} className="bg-gray-700 text-white">
					{opt.label}
				</option>
			))}
		</select>
	);
};
