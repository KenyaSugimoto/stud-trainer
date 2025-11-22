import { RANKS, SUITS } from "../consts/consts";
import type { Card, GameState, PlayerState } from "../types/types";

export const createDeck = (): Card[] => {
	const deck: Card[] = [];
	for (const r of RANKS) {
		for (const s of SUITS) {
			deck.push({ rank: r, suit: s });
		}
	}
	return deck;
};

export const shuffle = (deck: Card[]): Card[] => {
	const d = [...deck];
	for (let i = d.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[d[i], d[j]] = [d[j], d[i]];
	}
	return d;
};

// 3rdのDeal
export const deal3rd = (state: GameState): GameState => {
	const deck = [...state.deck];
	const players: PlayerState[] = state.players.map((p) => ({
		...p,
		holeCards: [],
		upcards: [],
	}));

	// ---- 1. hole 2枚ずつ配る ----
	for (let r = 0; r < 2; r++) {
		for (let i = 0; i < state.playerCount; i++) {
			const card = deck.shift();
			if (!card) throw new Error("Deck is empty!");
			players[i].holeCards.push(card);
		}
	}

	// ---- 2. upcard 1枚配る ----
	for (let i = 0; i < state.playerCount; i++) {
		const card = deck.shift();
		if (!card) throw new Error("Deck is empty!");
		players[i].upcards.push(card);
	}

	return {
		...state,
		deck,
		players,
		street: "3rd",
		actionsThisStreet: [],
		bringInIndex: null, // ← この後に計算する
	};
};
