import { useEffect, useMemo, useState } from "react";
import type { PlayerState, SeatIndex } from "../../types/types";
import { getActionLabel } from "../../utils/actor";
import { Card } from "./Card";

interface PlayerSeatProps {
	player: PlayerState;
	isActor: boolean;
	isWinner: boolean;
	isBringIn: boolean;
	currentActorIndex: SeatIndex | null;
	totalPlayers: number;
}

// Assumption: 7-maxの座席位置（円形レイアウト）
// 座席0（You）を下部中央に配置し、時計回りに配置
// プレイヤー数に応じて座席位置を動的に計算
const getSeatPosition = (seat: number, totalPlayers: number): { angle: number; radiusX: number; radiusY: number } => {
	// 座席0を下部中央（270度）に配置
	const baseAngle = 270;
	// 各座席の角度間隔（360度をプレイヤー数で割る）
	const angleStep = 360 / totalPlayers;
	// 座席0から時計回りに配置
	const angle = (baseAngle + angleStep * seat) % 360;

	// 半径はプレイヤー数に応じて調整
	const baseRadius = totalPlayers <= 3 ? 100 : totalPlayers <= 5 ? 120 : 140;

	// 楕円形の半径（スマホ/タブレット: 縦長、PC: 横長）
	// モバイル: radiusY > radiusX（縦長）、デスクトップ: radiusX > radiusY（横長）
	const radiusX = baseRadius; // 横方向の半径（デスクトップで拡大）
	const radiusY = baseRadius * 1.2; // 縦方向の半径（モバイルで拡大）

	return { angle, radiusX, radiusY };
};

export const PlayerSeat = ({ player, isActor, isWinner, isBringIn, totalPlayers }: PlayerSeatProps) => {
	const [isDesktop, setIsDesktop] = useState(false);

	useEffect(() => {
		const checkDesktop = () => {
			setIsDesktop(window.innerWidth >= 768);
		};
		checkDesktop();
		window.addEventListener("resize", checkDesktop);
		return () => window.removeEventListener("resize", checkDesktop);
	}, []);

	const position = useMemo(() => getSeatPosition(player.seat, totalPlayers), [player.seat, totalPlayers]);

	const seatStyle = useMemo(() => {
		const angleRad = (position.angle * Math.PI) / 180;
		// 楕円形の座標計算
		// モバイル: 縦長（radiusY > radiusX）、デスクトップ: 横長（radiusX > radiusY）
		// デスクトップでは横方向を拡大、モバイルでは縦方向を拡大
		const x = Math.cos(angleRad) * position.radiusX;
		const y = Math.sin(angleRad) * position.radiusY;
		// デスクトップで横長にするため、xを拡大
		const scaleX = isDesktop ? 1.3 : 1;
		const scaleY = isDesktop ? 0.9 : 1.2;

		return {
			transform: `translate(calc(${x * scaleX}px - 50%), calc(${y * scaleY}px - 50%))`,
		};
	}, [position, isDesktop]);

	return (
		<div
			className="absolute"
			style={{
				left: "50%",
				top: "50%",
				...seatStyle,
			}}
		>
			<div
				className={`relative min-w-[120px] md:min-w-[140px] p-2 md:p-3 rounded-lg border-2 transition-all ${
					isWinner
						? "bg-green-900/70 border-green-500 shadow-lg scale-105 z-20"
						: isActor
							? "bg-yellow-900/70 border-yellow-500 shadow-lg scale-105 z-10"
							: !player.alive
								? "bg-gray-700 border-gray-600 opacity-60"
								: "bg-gray-800 border-gray-600 shadow-md"
				}`}
			>
				{/* プレイヤー名とスタック */}
				<div className="text-center mb-1 md:mb-2">
					<div className="flex items-center justify-center gap-1 flex-wrap">
						<span
							className={`text-xs md:text-sm font-semibold ${isActor ? "text-blue-400" : isWinner ? "text-green-300" : "text-white"}`}
						>
							{player.name}
						</span>
						{isActor && <span className="text-[10px] md:text-xs bg-blue-500 text-white px-1 rounded">ACT</span>}
						{isWinner && <span className="text-[10px] md:text-xs bg-green-500 text-white px-1 rounded">WIN</span>}
						{isBringIn && <span className="text-[10px] md:text-xs bg-purple-500 text-white px-1 rounded">BI</span>}
						{!player.alive && <span className="text-[10px] md:text-xs bg-gray-500 text-white px-1 rounded">FOLD</span>}
					</div>
					<div className="text-[10px] md:text-xs text-gray-300">${player.stack.toLocaleString()}</div>
					{player.totalBetThisRound > 0 && (
						<div className="text-[10px] md:text-xs text-blue-400 font-semibold">
							Bet: ${player.totalBetThisRound.toLocaleString()}
						</div>
					)}
				</div>

				{/* カード表示 */}
				{player.alive && (
					<div className="flex gap-0.5 md:gap-1 justify-center items-center mb-1 md:mb-2 flex-wrap">
						{/* Hole Cards（自分のみ表示、他は伏せる） */}
						{player.holeCards.map((card) => (
							<Card key={`hole-${card.rank}${card.suit}`} card={card} isHidden={!player.isHuman} size="sm" />
						))}
						{/* Upcards */}
						{player.upcards.map((card) => (
							<Card key={`up-${card.rank}${card.suit}`} card={card} size="sm" />
						))}
					</div>
				)}

				{/* 最終アクション */}
				{player.lastAction && (
					<div className="text-[10px] md:text-xs text-center text-gray-400">{getActionLabel(player.lastAction)}</div>
				)}
			</div>
		</div>
	);
};
