// store/useGameStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GameState, GameType } from "../types/types";
import { computeBringIn } from "../utils/bringIn";
import { deal3rd } from "../utils/card";
import { initGameState } from "../utils/gameState";

type GameStore = {
	gameState: GameState | null;

	/** ゲームを初期化して3rdの配札まで行う */
	startGame: (playerCount: number, gameType: GameType) => void;

	/** ゲームの状態を更新する（applyActionなどから使う） */
	setGameState: (gs: GameState) => void;

	/** ゲームをリセット（タイトルに戻るなど） */
	reset: () => void;
};

export const useGameStore = create<GameStore>()(
	devtools((set) => ({
		gameState: null,

		startGame: (playerCount, gameType) => {
			let gs = initGameState(playerCount, gameType);
			gs = deal3rd(gs);
			gs.bringInIndex = computeBringIn(gs);
			gs.currentActorIndex = gs.bringInIndex;

			console.log("bringInIndex:", gs.bringInIndex);

			set({ gameState: gs }, false, "startGame");
		},

		setGameState: (gs) => {
			set({ gameState: gs }, false, "setGameState");
		},

		reset: () => {
			set({ gameState: null }, false, "reset");
		},
	})),
);
