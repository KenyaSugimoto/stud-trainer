import { useEffect, useMemo, useState } from "react";
import type { PlayerState, SeatIndex } from "../../types/types";
import { Card } from "./Card";

interface PlayerSeatProps {
	player: PlayerState;
	isActor: boolean;
	isWinner: boolean;
	currentActorIndex: SeatIndex | null;
	totalPlayers: number;
	isShowdown: boolean;
	handFinished: boolean;
	winAmount: number | null;
}

// Assumption: 7-maxの座席位置（円形レイアウト）
// 座席0（You）を下部中央に配置し、時計回りに配置
// プレイヤー数に応じて座席位置を動的に計算
const getSeatPosition = (seat: number, totalPlayers: number): { angle: number; radiusX: number; radiusY: number } => {
	// 座席0（You）を常に真ん中下（6時の位置、90度）に配置
	// CSS座標系: 0度=右（3時）、90度=下（6時）、180度=左（9時）、270度=上（12時）
	const baseAngle = 90; // 6時の位置
	// 各座席の角度間隔（360度をプレイヤー数で割る）
	const angleStep = 360 / totalPlayers;
	// 座席0から時計回りに配置（時計回りなので角度を増やす方向）
	// 座席0: 90度（6時）
	// 座席1: 90 + angleStep度（時計回り）
	// 座席2: 90 + angleStep * 2度
	const angle = (baseAngle + angleStep * seat) % 360;

	// 半径はプレイヤー数に応じて調整（スマホでの重なりを防ぐため、より大きな半径に）
	// ベース半径を大きくして、座席間のゆとりを確保
	const baseRadius = totalPlayers <= 3 ? 180 : totalPlayers <= 5 ? 220 : 260;

	// 楕円形の半径（スマホ/タブレット: 縦長、PC: 横長）
	// モバイル: radiusY > radiusX（縦長）、デスクトップ: radiusX > radiusY（横長）
	const radiusX = baseRadius; // 横方向の半径（デスクトップで拡大）
	const radiusY = baseRadius * 1.2; // 縦方向の半径（モバイルで拡大）

	return { angle, radiusX, radiusY };
};

export const PlayerSeat = ({
	player,
	isActor,
	isWinner,
	totalPlayers,
	isShowdown,
	handFinished,
	winAmount,
}: PlayerSeatProps) => {
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
		// デスクトップで横長にするため、xを拡大（テーブルが広くなったので、より大きく拡大）
		const scaleX = isDesktop ? 1.5 : 1;
		const scaleY = isDesktop ? 0.9 : 1.2;

		return {
			transform: `translate(calc(${x * scaleX}px - 50%), calc(${y * scaleY}px - 50%))`,
		};
	}, [position, isDesktop]);

	// チップの位置計算（プレイヤー座席からテーブル中央方向に向かって配置）
	const chipStyle = useMemo(() => {
		if (player.totalBetThisRound === 0) return null;

		const angleRad = (position.angle * Math.PI) / 180;
		// 座席位置の座標を計算（seatStyleと同じ計算）
		const seatX = Math.cos(angleRad) * position.radiusX;
		const seatY = Math.sin(angleRad) * position.radiusY;

		// テーブル中央方向（角度の逆方向）に少しずらす
		const offsetDistance = isDesktop ? 80 : 60; // チップを座席から離す距離
		const offsetX = -Math.cos(angleRad) * offsetDistance;
		const offsetY = -Math.sin(angleRad) * offsetDistance;

		const scaleX = isDesktop ? 1.5 : 1;
		const scaleY = isDesktop ? 0.9 : 1.2;

		// 座席位置からさらに中央方向にオフセット
		const chipX = (seatX + offsetX) * scaleX;
		const chipY = (seatY + offsetY) * scaleY;

		return {
			transform: `translate(calc(${chipX}px - 50%), calc(${chipY}px - 50%))`,
		};
	}, [position, player.totalBetThisRound, isDesktop]);

	return (
		<>
			{/* チップ表示（プレイヤーの前に配置） */}
			{player.totalBetThisRound > 0 && chipStyle && (
				<div
					className="absolute z-30"
					style={{
						left: "50%",
						top: "50%",
						...chipStyle,
					}}
				>
					<div className="flex flex-col items-center gap-0.5">
						{/* チップスタックの視覚表現 */}
						<div className="relative flex flex-col items-center">
							{/* 複数のチップを重ねて表示 */}
							{[0, 1, 2].map((i) => (
								<div
									key={i}
									className={`absolute w-4 h-4 md:w-5 md:h-5 rounded-full border ${
										i === 0
											? "bg-yellow-500 border-yellow-600 shadow-sm z-30"
											: i === 1
												? "bg-yellow-400 border-yellow-500 shadow-sm z-20 -mt-0.5"
												: "bg-yellow-300 border-yellow-400 shadow-sm z-10 -mt-1"
									}`}
									style={{ top: `${i * 1}px` }}
								/>
							))}
							{/* スペーサーで高さを確保 */}
							<div className="w-4 h-4 md:w-5 md:h-5" />
						</div>
						{/* ベット額表示 ハンドが終わっている場合は勝ったプレイヤーの獲得額を表示 */}
						{handFinished && isWinner && winAmount && (
							<div className="bg-black/80 text-white text-[8px] md:text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap border border-yellow-400">
								${winAmount.toLocaleString()}
							</div>
						)}
						{!handFinished && (
							<div className="bg-black/80 text-white text-[8px] md:text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap border border-yellow-400">
								${player.totalBetThisRound.toLocaleString()}
							</div>
						)}
					</div>
				</div>
			)}

			{/* プレイヤー座席 */}
			<div
				className="absolute"
				style={{
					left: "50%",
					top: "50%",
					...seatStyle,
				}}
			>
				<div
					className={`relative min-w-[100px] md:min-w-[140px] p-1.5 md:p-3 rounded-lg border-2 transition-all ${
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
							{!player.alive && (
								<span className="text-[10px] md:text-xs bg-gray-500 text-white px-1 rounded">FOLD</span>
							)}
						</div>
					</div>

					{/* カード表示 - 1行で重ねて表示、Holeカードは上にずらす */}
					{player.alive ? (
						<div className="mb-1 md:mb-2 relative h-[36px] md:h-[56px] flex items-center justify-center">
							{/* カードを重ねて表示するコンテナ */}
							{/* スマホ: カード幅32px、重ね幅10px、PC: カード幅40px、重ね幅12px */}
							<div className="relative w-[90px] md:w-[108px] h-[36px] md:h-[56px]">
								{/* カードの配布順序に基づいてz-indexを設定（後から配られるカードが上に重なる）
								1. Hole Card 1 (最初) - z-index: 1
								2. Hole Card 2 (2番目) - z-index: 2
								3. Upcard 1 (3rd Street) - z-index: 3
								4. Upcard 2 (4th Street) - z-index: 4
								5. Upcard 3 (5th Street) - z-index: 5
								6. Upcard 4 (6th Street) - z-index: 6
								7. Hole Card 3 (7th Street、最後) - z-index: 7 (最上)
							*/}
								{/* Hole Card 1 - 通常位置 */}
								{player.holeCards[0] && (
									<div className="absolute" style={{ left: "0px", top: "5px", zIndex: 1 }}>
										<Card card={player.holeCards[0]} isHidden={!player.isHuman && !isShowdown} size="sm" />
									</div>
								)}
								{/* Hole Card 2 - 通常位置 */}
								{player.holeCards[1] && (
									<div className="absolute md:left-[15px] left-[10px]" style={{ top: "5px", zIndex: 2 }}>
										<Card card={player.holeCards[1]} isHidden={!player.isHuman && !isShowdown} size="sm" />
									</div>
								)}
								{/* Upcard 1 - 上にずらす */}
								{player.upcards[0] && (
									<div className="absolute md:left-[30px] left-[20px]" style={{ top: "-5px", zIndex: 3 }}>
										<Card card={player.upcards[0]} size="sm" />
									</div>
								)}
								{/* Upcard 2 - 上にずらす */}
								{player.upcards[1] && (
									<div className="absolute md:left-[45px] left-[30px]" style={{ top: "-5px", zIndex: 4 }}>
										<Card card={player.upcards[1]} size="sm" />
									</div>
								)}
								{/* Upcard 3 - 上にずらす */}
								{player.upcards[2] && (
									<div className="absolute md:left-[60px] left-[40px]" style={{ top: "-5px", zIndex: 5 }}>
										<Card card={player.upcards[2]} size="sm" />
									</div>
								)}
								{/* Upcard 4 - 上にずらす */}
								{player.upcards[3] && (
									<div className="absolute md:left-[75px] left-[50px]" style={{ top: "-5px", zIndex: 6 }}>
										<Card card={player.upcards[3]} size="sm" />
									</div>
								)}
								{/* Hole Card 3（最後のHole Card）- 通常位置、最上に重ねる */}
								{player.holeCards[2] && (
									<div className="absolute md:left-[90px] left-[60px]" style={{ top: "5px", zIndex: 7 }}>
										<Card card={player.holeCards[2]} isHidden={!player.isHuman && !isShowdown} size="sm" />
									</div>
								)}
							</div>
						</div>
					) : (
						/* Folded時も領域を確保 */
						<div className="mb-1 md:mb-2 h-[36px] md:h-[56px]" />
					)}

					<div className="text-[10px] md:text-xs text-gray-300 text-center">${player.stack.toLocaleString()}</div>
				</div>
			</div>
		</>
	);
};
