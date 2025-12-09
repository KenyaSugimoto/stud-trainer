import { useMemo } from "react";
import { GAME_TYPE_LABELS } from "../../consts/consts";
import type { GameState, SeatIndex } from "../../types/types";
import { PlayerSeat } from "./PlayerSeat";

interface PokerTableProps {
	gameState: GameState;
	currentActorIndex: SeatIndex | null;
}

export const PokerTable = ({ gameState, currentActorIndex }: PokerTableProps) => {
	const activePlayers = useMemo(() => {
		return gameState.players.filter((p) => p.seat < gameState.playerCount);
	}, [gameState.players, gameState.playerCount]);

	return (
		<div className="relative w-full h-full mx-auto flex items-center justify-center">
			{/* テーブル背景（フェルト + リング） */}
			{/* スマホ: 角丸の長方形（rounded-3xl）、PC: 楕円形（rounded-[50%]） */}
			{/* アクションボタン群のスペースを確保するため、サイズを制限 */}
			<div className="relative w-full h-full max-w-[70vw] md:max-w-[65vw] lg:max-w-[55vw] xl:max-w-[50vw] max-h-[60vh] md:max-h-[65vh] aspect-[4/5] md:aspect-[5/4] bg-gradient-to-b from-green-700 via-green-800 to-green-900 shadow-2xl border-8 border-amber-800 rounded-4xl md:rounded-[50%]">
				{/* 内側のリング */}
				<div className="absolute inset-8 rounded-3xl md:rounded-[50%] border-4 border-amber-700/50" />

				{/* 中央エリア（ポット情報） */}
				<div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
					<div className="bg-black/50 rounded-lg px-4 py-3 md:px-6 md:py-4 backdrop-blur-sm">
						<div className="text-white text-lg md:text-lg font-bold mb-1">
							{GAME_TYPE_LABELS[gameState.gameType]}: {gameState.street}
						</div>
						<div className="text-white text-xl md:text-2xl font-bold mb-1">
							<span className="text-green-300 text-xs md:text-sm">Pot </span>
							<span className="text-white text-xl md:text-xl font-bold">${gameState.pot.toLocaleString()}</span>
						</div>
					</div>
				</div>

				{/* 座席配置 */}
				{activePlayers.map((player) => {
					const isActor = player.seat === currentActorIndex && gameState.street !== "showdown";
					const isWinner = gameState.winnerIndexes?.includes(player.seat) ?? false;
					const isShowdown = gameState.street === "showdown";

					return (
						<PlayerSeat
							key={player.seat}
							player={player}
							isActor={isActor}
							isWinner={isWinner}
							currentActorIndex={currentActorIndex}
							totalPlayers={gameState.playerCount}
							isShowdown={isShowdown}
						/>
					);
				})}
			</div>
		</div>
	);
};
