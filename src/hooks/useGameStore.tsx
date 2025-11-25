import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { ActionType, GameState, GameType, SeatIndex } from "../types/types";
import { getFirstActorForStreet, getNextActorIndex, shouldEndStreet } from "../utils/actor";
import { calcBetAmount, collectAntes } from "../utils/betUnit";
import { computeBringIn } from "../utils/bringIn";
import { deal3rd } from "../utils/card";
import { evaluateHandHi } from "../utils/evaluateHand";
import { goToNextStreet, initGameState } from "../utils/gameState";

type GameStore = {
	gameState: GameState | null;

	startGame: (playerCount: number, gameType: GameType, initialStack: number) => void;

	applyAction: (action: ActionType, seat: SeatIndex) => void;

	reset: () => void;
};

// TODO: テスト実装 (別チケットでする)
export const useGameStore = create<GameStore>()(
	devtools((set, get) => ({
		gameState: null,

		//-----------------------------------
		// Start Game
		//-----------------------------------
		startGame: (playerCount, gameType, initialStack) => {
			let gs = initGameState(playerCount, gameType, initialStack);

			// ante回収の処理
			gs = collectAntes(gs);

			// 3rd カード配布
			gs = deal3rd(gs);

			// bring-in プレイヤーの特定＆最初のアクターセット
			gs.bringInIndex = computeBringIn(gs);
			gs.currentActorIndex = gs.bringInIndex;

			set({ gameState: gs }, false, "startGame");
		},

		//-----------------------------------
		// APPLY ACTION（ゲーム進行の心臓部）
		//-----------------------------------
		applyAction: (action, seat) => {
			const state = get().gameState;
			if (!state) return;

			// ---- Clone ----
			let gs: GameState = structuredClone(state);
			const player = gs.players[seat];

			// ---- 1. 金額計算 ----
			const amount = calcBetAmount(gs, seat, action);

			player.lastAction = action;

			// fold
			if (action === "f") {
				player.alive = false;
			}

			// pot & bets update
			if (["c", "b", "r", "bri", "comp"].includes(action)) {
				gs.pot += amount;
				player.totalBetThisRound += amount;
				player.stack -= amount;
			}

			// ---- 2. ログ追加 ----
			gs.actionsThisStreet.push({ type: action, player: seat, amount });
			gs.logs.push({
				street: gs.street,
				seat,
				action,
				cards: "",
				amount,
			});

			// ---- 3. 一人以下 alive → ハンド終了 ----
			const alivePlayers = gs.players.filter((p) => p.alive);
			if (alivePlayers.length <= 1) {
				const winnerIndex = alivePlayers.length === 1 ? alivePlayers[0].seat : null;

				set(
					{
						gameState: {
							...gs,
							handFinished: true,
							winnerIndexes: winnerIndex !== null ? [winnerIndex] : null,
						},
					},
					false,
					"handFinished",
				);
				return;
			}

			// ---- 4. ストリート終了判定 ----
			if (shouldEndStreet(gs)) {
				gs = goToNextStreet(gs);

				// showdownになった場合は勝者判定
				if (gs.street === "showdown") {
					const alive = gs.players.filter((p) => p.alive);

					let bestRank = -1;
					let bestScore: number[] = [];
					let winners: number[] = [];

					for (const p of alive) {
						const allCards = [...p.holeCards, ...p.upcards];
						// 役判定 (TODO: 後でRazzやStud8にも対応させる)
						const hand = evaluateHandHi(allCards);

						if (
							hand.rank !== null &&
							(hand.rank > bestRank || (hand.rank === bestRank && hand.score.join(",") > bestScore.join(",")))
						) {
							bestRank = hand.rank;
							bestScore = hand.score;
							winners = [p.seat];
						} else if (hand.rank === bestRank && hand.score.join(",") === bestScore.join(",")) {
							winners.push(p.seat); // Split pot（同点）
						}
					}

					gs.handFinished = true;
					gs.winnerIndexes = winners;

					set({ gameState: gs }, false, "showdown");
					return;
				}

				// 次のストリート開始プレイヤー
				const nextActor = getFirstActorForStreet(gs);
				gs.currentActorIndex = nextActor;

				set({ gameState: gs }, false, "nextStreet");
				return;
			}

			// ---- 5. 継続 → Next actor ----
			const next = getNextActorIndex(gs);
			gs.currentActorIndex = next;

			set({ gameState: gs }, false, "applyAction");
		},

		//-----------------------------------
		// Reset Game
		//-----------------------------------
		reset: () => {
			set({ gameState: null }, false, "reset");
		},
	})),
);
