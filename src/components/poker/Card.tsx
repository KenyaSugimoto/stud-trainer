import type { Card as CardType } from "../../types/types";

interface CardProps {
	card: CardType;
	isHidden?: boolean;
	size?: "sm" | "md" | "lg";
}

// スート記号のマッピング
const SUIT_SYMBOLS: Record<CardType["suit"], string> = {
	s: "♠",
	h: "♥",
	d: "♦",
	c: "♣",
};

// スートの色
const SUIT_COLORS: Record<CardType["suit"], string> = {
	s: "text-black",
	h: "text-red-600",
	d: "text-red-600",
	c: "text-black",
};

export const Card = ({ card, isHidden = false, size = "md" }: CardProps) => {
	if (isHidden) {
		return <CardBack size={size} />;
	}

	const sizeClasses = {
		sm: "w-8 h-11 text-xs",
		md: "w-12 h-16 text-sm",
		lg: "w-16 h-20 text-base",
	};

	return (
		<div
			className={`${sizeClasses[size]} bg-white border-2 border-gray-300 rounded shadow-md flex flex-col items-center justify-center font-bold ${SUIT_COLORS[card.suit]}`}
		>
			<div className="text-center">
				<div>{card.rank}</div>
				<div className="text-lg">{SUIT_SYMBOLS[card.suit]}</div>
			</div>
		</div>
	);
};

interface CardBackProps {
	size?: "sm" | "md" | "lg";
}

export const CardBack = ({ size = "md" }: CardBackProps) => {
	const sizeClasses = {
		sm: "w-8 h-11",
		md: "w-12 h-16",
		lg: "w-16 h-20",
	};

	return (
		<div
			className={`${sizeClasses[size]} bg-blue-900 border-2 border-blue-700 rounded shadow-md flex items-center justify-center`}
		>
			<div className="text-white text-xs font-bold">?</div>
		</div>
	);
};
