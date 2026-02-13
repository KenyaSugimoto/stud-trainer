// モックデータ（開発・テスト用）

import { DEFAULT_INITIAL_STACK, DEFAULT_STAKES } from "../consts/consts";
import type { GameState, PlayerState } from "../types/types";

// Assumption: モックプレイヤーデータ
export const createMockPlayers = (count: number, initialStack: number): PlayerState[] => {
	return Array.from({ length: count }, (_, i) => ({
		seat: i as PlayerState["seat"],
		name: i === 0 ? "You" : `CPU${i}`,
		isHuman: i === 0,
		alive: true,
		stack: initialStack,
		holeCards: [],
		upcards: [],
		lastAction: null,
		totalBetThisRound: 0,
	}));
};

// Assumption: モックゲーム状態（loading状態のテスト用）
export const createMockGameState = (): GameState => {
	const playerCount = 4;
	const initialStack = DEFAULT_INITIAL_STACK;
	const players = createMockPlayers(playerCount, initialStack);

	return {
		playerCount,
		stakes: DEFAULT_STAKES,
		gameType: "STUD_HI",
		players,
		street: "3rd",
		deck: [],
		pot: 0,
		bringInIndex: null,
		currentActorIndex: 0,
		actionsThisStreet: [],
		logs: [],
		handFinished: false,
		winnerIndexes: null,
	};
};
