import { useMemo } from "react";
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
		<div className="relative w-full max-w-4xl mx-auto min-h-[500px] md:min-h-[600px] flex items-center justify-center py-8">
			{/* テーブル背景（フェルト + リング）- 楕円形 */}
			{/* スマホ/タブレット: 縦長の楕円（aspect-[4/5]）、PC: 横長の楕円（aspect-[5/4]） */}
			<div className="relative w-full max-w-[90vw] md:max-w-[600px] aspect-4/5 md:aspect-5/4 bg-linear-to-b from-green-700 via-green-800 to-green-900 shadow-2xl border-8 border-amber-800 rounded-[50%]">
				{/* 内側のリング */}
				<div className="absolute inset-8 rounded-[50%] border-4 border-amber-700/50" />

				{/* 中央エリア（ポット情報） */}
				<div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
					<div className="bg-black/50 rounded-lg px-4 py-3 md:px-6 md:py-4 backdrop-blur-sm">
						<div className="text-white text-xl md:text-2xl font-bold mb-1">${gameState.pot.toLocaleString()}</div>
						<div className="text-green-300 text-xs md:text-sm">Pot</div>
						{gameState.bringInIndex !== null && (
							<div className="text-yellow-300 text-[10px] md:text-xs mt-1 md:mt-2">
								Bring-in: {gameState.players[gameState.bringInIndex].name}
							</div>
						)}
						{gameState.street !== "showdown" && currentActorIndex !== null && (
							<div className="text-blue-300 text-[10px] md:text-xs mt-1">
								Action: {gameState.players[currentActorIndex].name}
							</div>
						)}
					</div>
				</div>

				{/* 座席配置 */}
				{activePlayers.map((player) => {
					const isActor = player.seat === currentActorIndex && gameState.street !== "showdown";
					const isWinner = gameState.winnerIndexes?.includes(player.seat) ?? false;
					const isBringIn = player.seat === gameState.bringInIndex;

					return (
						<PlayerSeat
							key={player.seat}
							player={player}
							isActor={isActor}
							isWinner={isWinner}
							isBringIn={isBringIn}
							currentActorIndex={currentActorIndex}
							totalPlayers={gameState.playerCount}
						/>
					);
				})}
			</div>
		</div>
	);
};
