import { describe, expect, it } from "vitest";
import { type Card, HAND_RANK } from "../../types/types";
import { evaluateHandHi } from "../evaluateHand";

// 便利関数
const C = (rank: Card["rank"], suit: Card["suit"]): Card => ({
	rank,
	suit,
});

// 7枚中の5枚だけを書いても OK なように、残りは適当なカードで埋める
const fill7 = (cards: Card[]): Card[] => {
	const deckPad: Card[] = [
		C("2", "c"),
		C("3", "c"),
		C("4", "c"),
		C("5", "c"),
		C("6", "c"),
		C("7", "c"),
		C("8", "c"),
		C("9", "c"),
		C("T", "c"),
		C("J", "c"),
	];
	return [...cards, ...deckPad].slice(0, 7);
};

describe("evaluateHandHi", () => {
	// ----------------------------------------------------
	// Royal Flush
	// ----------------------------------------------------
	it("detects Royal Flush", () => {
		const cards = fill7([
			C("A", "s"),
			C("K", "s"),
			C("Q", "s"),
			C("J", "s"),
			C("T", "s"), // Royal
		]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.ROYAL_FLUSH);
	});

	// ----------------------------------------------------
	// Straight Flush
	// ----------------------------------------------------
	it("detects Straight Flush (9-high)", () => {
		const cards = fill7([C("9", "h"), C("8", "h"), C("7", "h"), C("6", "h"), C("5", "h")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.STRAIGHT_FLUSH);
		expect(r.score[1]).toBe(9); // top
	});

	// ----------------------------------------------------
	// Four of a Kind
	// ----------------------------------------------------
	it("detects Four of a Kind", () => {
		const cards = fill7([C("K", "c"), C("K", "d"), C("K", "h"), C("K", "s"), C("3", "d")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.FOUR_OF_A_KIND);
		expect(r.score).toEqual([HAND_RANK.FOUR_OF_A_KIND, 13, 3]);
	});

	// ----------------------------------------------------
	// Full House
	// ----------------------------------------------------
	it("detects Full House", () => {
		const cards = fill7([C("T", "s"), C("T", "h"), C("T", "c"), C("4", "d"), C("4", "h")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.FULL_HOUSE);
		expect(r.score).toEqual([HAND_RANK.FULL_HOUSE, 10, 4]);
	});

	// ----------------------------------------------------
	// Flush
	// ----------------------------------------------------
	it("detects Flush (with correct kickers)", () => {
		const cards = fill7([C("A", "d"), C("T", "d"), C("7", "d"), C("5", "d"), C("3", "d"), C("K", "s"), C("Q", "h")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.FLUSH);
		expect(r.score.slice(1)).toEqual([14, 10, 7, 5, 3]);
	});

	// ----------------------------------------------------
	// Straight
	// ----------------------------------------------------
	it("detects Straight (T-J-Q-K-A)", () => {
		const cards = fill7([C("A", "c"), C("K", "d"), C("Q", "h"), C("J", "s"), C("T", "h"), C("2", "d")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.STRAIGHT);
		expect(r.score[1]).toBe(14); // A-high
	});

	// A-5 wheel
	it("detects A-5 straight (5-high wheel)", () => {
		const cards = fill7([C("A", "c"), C("5", "h"), C("4", "d"), C("3", "s"), C("2", "c"), C("K", "h")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.STRAIGHT);
		expect(r.score[1]).toBe(5); // 5-high
	});

	// ----------------------------------------------------
	// Trips
	// ----------------------------------------------------
	it("detects Three of a Kind", () => {
		const cards = fill7([C("9", "c"), C("9", "d"), C("9", "h"), C("A", "s"), C("7", "d")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.THREE_OF_A_KIND);
		expect(r.score).toEqual([HAND_RANK.THREE_OF_A_KIND, 9, 14, 7]);
	});

	// ----------------------------------------------------
	// Two Pair
	// ----------------------------------------------------
	it("detects Two Pair", () => {
		const cards = fill7([C("J", "s"), C("J", "h"), C("4", "c"), C("4", "d"), C("A", "c")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.TWO_PAIR);
		expect(r.score).toEqual([HAND_RANK.TWO_PAIR, 11, 4, 14]);
	});

	// ----------------------------------------------------
	// One Pair
	// ----------------------------------------------------
	it("detects One Pair", () => {
		const cards = fill7([C("8", "h"), C("8", "s"), C("A", "d"), C("T", "c"), C("5", "h")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.ONE_PAIR);
		expect(r.score).toEqual([HAND_RANK.ONE_PAIR, 8, 14, 10, 5]);
	});

	// ----------------------------------------------------
	// High Card
	// ----------------------------------------------------
	it("detects High Card (kicker order)", () => {
		const cards = fill7([C("A", "h"), C("J", "d"), C("8", "c"), C("6", "s"), C("4", "d")]);

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.HIGH_CARD);
		expect(r.score).toEqual([HAND_RANK.HIGH_CARD, 14, 11, 8, 6, 4]);
	});

	// ----------------------------------------------------
	// Best 5 selection among 7
	// ----------------------------------------------------
	it("selects the best 5 cards among 7 (Four of a Kind beats Full House possibility)", () => {
		const cards = [
			C("Q", "c"),
			C("Q", "d"),
			C("Q", "h"),
			C("Q", "s"), // Four of a Kind
			C("T", "c"),
			C("T", "d"), // Could be Full House but worse
			C("9", "h"),
		];

		const r = evaluateHandHi(cards);
		expect(r.rank).toBe(HAND_RANK.FOUR_OF_A_KIND);
	});
});
