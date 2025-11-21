import { RANKS, SUITS } from "../consts/consts";
import type { Card } from "../types/types";

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
