import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { ActionType, GameState, GameType, HandRank, SeatIndex } from "../types/types";
import { getFirstActorForStreet, getNextActorIndex, shouldEndStreet } from "../utils/actor";
import { calcBetAmount, collectAntes } from "../utils/betUnit";
import { computeBringIn } from "../utils/bringIn";
import { deal3rd } from "../utils/card";
import { evaluateHandHi, isBetterHand } from "../utils/evaluateStudHi";
import { goToNextStreet, initGameState } from "../utils/gameState";

type GameStore = {
	gameState: GameState | null;

	// 新しいゲームを開始する
	startGame: (playerCount: number, gameType: GameType, initialStack: number) => void;

	// 1ハンド終了後、次のハンドを開始する
	startNextHand: () => void;

	// アクションを適用してゲームを進行させる
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
		// Start Next Hand
		//-----------------------------------
		startNextHand: () => {
			const state = get().gameState;
			if (!state) return;

			const { players } = state;

			// ★ 現在のスタックを維持したまま、新しい players 配列を作る
			const newPlayers = players.map((p) => ({
				...p,
				alive: true,
				holeCards: [],
				upcards: [],
				lastAction: null,
				totalBetThisRound: 0,
			}));

			let gs: GameState = {
				...state,
				street: "3rd",
				pot: 0,
				handFinished: false,
				winnerIndexes: null,
				actionsThisStreet: [],
				logs: [],

				players: newPlayers,

				bringInIndex: null,
				currentActorIndex: 0,
			};

			// アンティ回収
			gs = collectAntes(gs);

			// 3rd 配布
			gs = deal3rd(gs);

			// bring-in 計算
			gs.bringInIndex = computeBringIn(gs);
			gs.currentActorIndex = gs.bringInIndex;

			set({ gameState: gs }, false, "startNextHand");
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
				let winnerIndexes: number[] | null = null;

				// alivePlayers.length === 0 は理論上ほぼ起こらないので、安全側に winnerIndexes = null のまま終了とする
				if (alivePlayers.length === 1) {
					const winner = alivePlayers[0];

					// ポットをすべて勝者へ
					winner.stack += gs.pot;
					winnerIndexes = [winner.seat];
					gs.pot = 0;
				}

				gs.handFinished = true;
				gs.winnerIndexes = winnerIndexes;

				set({ gameState: gs }, false, "handFinished");
				return;
			}

			// ---- 4. ストリート終了判定 ----
			if (shouldEndStreet(gs)) {
				gs = goToNextStreet(gs);

				// showdownになった場合は勝者判定
				if (gs.street === "showdown") {
					const alive = gs.players.filter((p) => p.alive);

					let bestRank: HandRank | null = null;
					let bestScore: number[] = [];
					let winners: number[] = [];

					for (const p of alive) {
						const allCards = [...p.holeCards, ...p.upcards];

						// 役判定（現状は Stud Hi のみ）
						const hand = evaluateHandHi(allCards);

						if (isBetterHand(hand.rank as HandRank, hand.score, bestRank, bestScore)) {
							// 新しいベストハンド
							bestRank = hand.rank as HandRank;
							bestScore = hand.score;
							winners = [p.seat];
						} else if (
							bestRank !== null &&
							hand.rank === bestRank &&
							hand.score.length === bestScore.length &&
							hand.score.every((v, i) => v === bestScore[i])
						) {
							// 完全同点 → Split pot
							winners.push(p.seat);
						}
					}

					gs.handFinished = true;
					gs.winnerIndexes = winners;

					// === showdown時のチップ分配（単一ポット(サイドポット無し)版） ===
					if (winners.length > 0 && gs.pot > 0) {
						const splitCount = winners.length;
						const baseShare = Math.floor(gs.pot / splitCount);
						const remainder = gs.pot % splitCount;

						// 均等分配
						for (const seatIndex of winners) {
							gs.players[seatIndex].stack += baseShare;
						}

						// 余りは seat が小さい順に 1 点ずつ
						// winners 自体が seatIndex の配列なので、そのままソートして配分
						const sortedWinners = [...winners].sort((a, b) => a - b);
						for (let i = 0; i < remainder; i++) {
							gs.players[sortedWinners[i]].stack += 1;
						}

						gs.pot = 0;
					}

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
