import { describe, expect, it } from "vitest";
import { RANKS, SUITS } from "../../consts/consts";
import { createDeck, shuffle } from "../card";

describe("createDeck", () => {
	it("52枚のデッキを生成する", () => {
		const deck = createDeck();
		expect(deck).toHaveLength(RANKS.length * SUITS.length);
	});

	it("全カードの組み合わせが存在し重複がない", () => {
		const deck = createDeck();

		const set = new Set(deck.map((c) => `${c.rank}${c.suit}`));
		expect(set.size).toBe(deck.length);
	});

	it("全ての rank が使われている", () => {
		const deck = createDeck();
		const ranks = new Set(deck.map((c) => c.rank));

		for (const r of RANKS) {
			expect(ranks.has(r)).toBe(true);
		}
	});

	it("全ての suit が使われている", () => {
		const deck = createDeck();
		const suits = new Set(deck.map((c) => c.suit));

		for (const s of SUITS) {
			expect(suits.has(s)).toBe(true);
		}
	});
});

describe("shuffle", () => {
	it("元の配列を破壊しない（イミュータブル）", () => {
		const deck = createDeck();
		const copy = [...deck];

		shuffle(deck);

		expect(deck).toEqual(copy); // 元デッキが変わっていない
	});

	it("シャッフル後も枚数が同じ", () => {
		const deck = createDeck();
		const shuffled = shuffle(deck);

		expect(shuffled).toHaveLength(deck.length);
	});

	it("カードの集合は同じ", () => {
		const deck = createDeck();
		const shuffled = shuffle(deck);

		const originalSet = new Set(deck.map((c) => `${c.rank}${c.suit}`));
		const shuffledSet = new Set(shuffled.map((c) => `${c.rank}${c.suit}`));

		expect(shuffledSet).toEqual(originalSet);
	});

	it("順番が変わっている（ほぼ確実に）", () => {
		const deck = createDeck();
		const shuffled = shuffle(deck);

		// 稀に同じ順になる確率はほぼ無視できるため
		expect(shuffled).not.toEqual(deck);
	});
});
