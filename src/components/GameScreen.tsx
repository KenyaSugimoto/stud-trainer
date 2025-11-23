import { useMemo } from "react";
import { useGameStore } from "../hooks/useGameStore";
import type { ActionType } from "../types/types";
import { getActionLabel, getAllowedActions } from "../utils/actor";

export const GameScreen = () => {
	const { gameState, applyAction } = useGameStore();

	// 現在のアクター
	const actor = gameState?.currentActorIndex ?? null;
	// 現在のアクターが実行可能なアクションを取得
	const allowed = useMemo<ActionType[]>(() => {
		if (!gameState) return [];

		// bring-in 前の中途状態は空を返す
		if (gameState.street === "3rd" && gameState.bringInIndex === null) {
			return [];
		}

		return getAllowedActions(gameState, gameState.currentActorIndex);
	}, [gameState]);

	// レンダリングガード
	if (!gameState || actor === null) return null;
	if (gameState.street === "3rd" && gameState.bringInIndex === null) {
		return <div className="p-4">準備中...</div>;
	}

	// 現在のアクターのPlayerState
	const player = gameState.players[actor];

	return (
		<div className="p-4">
			<h1>{gameState.gameType}</h1>
			<h2 className="text-lg font-bold">Street: {gameState.street}</h2>
			<h3 className="text-md">Action: {player.name}</h3>

			<div className="overflow-y-auto max-h-96">
				{gameState.players.map((p) => (
					<div key={p.name} className={`p-2 my-2 border ${p.seat === actor ? "bg-yellow-900" : ""}`}>
						<p>
							{p.name} {p.alive ? "" : "(Folded)"}
						</p>
						<p>Hole Cards: {p.holeCards.map((c) => `${c.rank}${c.suit}`).join(", ")}</p>
						<p>Upcards: {p.upcards.map((c) => `${c.rank}${c.suit}`).join(", ")}</p>
					</div>
				))}
			</div>

			{player.isHuman && !gameState.handFinished && (
				<div className="mt-4 flex gap-2">
					{allowed.map((action) => (
						<button key={action} type="button" onClick={() => applyAction(action, actor)}>
							{getActionLabel(action)}
						</button>
					))}
				</div>
			)}
		</div>
	);
};
