import { describe, expect, it } from "vitest";
import { RANKS, SUITS } from "../../consts/consts";
import { createDeck, deal3rd, shuffle } from "../card";
import { initGameState } from "../gameState";

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

describe("deal3rd", () => {
	it("hole 2枚・upcard 1枚を各プレイヤーに配る", () => {
		const gs = initGameState(3); // 3人でテスト
		const newState = deal3rd(gs);

		for (let i = 0; i < 3; i++) {
			const p = newState.players[i];
			expect(p.holeCards).toHaveLength(2);
			expect(p.upcards).toHaveLength(1);
		}
	});

	it("デッキから 3 * playerCount 枚が減っている", () => {
		const playerCount = 4;
		const gs = initGameState(playerCount);

		const beforeLen = gs.deck.length;
		const newState = deal3rd(gs);
		const afterLen = newState.deck.length;

		expect(afterLen).toBe(beforeLen - playerCount * 3);
	});

	it("元の state を破壊しない（プレイヤー配列が新しい）", () => {
		const gs = initGameState(3);
		const newState = deal3rd(gs);

		// players 配列が別オブジェクトである
		expect(newState.players).not.toBe(gs.players);

		// 個々の player もコピーされている（スプレッドオブジェクト）
		for (let i = 0; i < 3; i++) {
			expect(newState.players[i]).not.toBe(gs.players[i]);
		}
	});

	it("state の基本プロパティが正しく設定される", () => {
		const gs = initGameState(2);
		const newState = deal3rd(gs);

		expect(newState.street).toBe("3rd");
		expect(newState.actionsThisStreet).toEqual([]);
		expect(newState.bringInIndex).toBeNull();
	});

	it("配られた全カードは元のデッキ内に存在し、重複しない", () => {
		const gs = initGameState(4);
		const baseDeck = [...gs.deck];

		const newState = deal3rd(gs);

		const dealtCards: string[] = [];

		for (const p of newState.players) {
			for (const c of p.holeCards) {
				dealtCards.push(`${c.rank}${c.suit}`);
			}
			for (const c of p.upcards) {
				dealtCards.push(`${c.rank}${c.suit}`);
			}
		}

		// 枚数チェック → 4人 × 3枚 = 12枚
		expect(dealtCards).toHaveLength(12);

		// 重複なし
		const set = new Set(dealtCards);
		expect(set.size).toBe(dealtCards.length);

		// 全カードは元の deck から取られている
		const baseSet = new Set(baseDeck.map((c) => `${c.rank}${c.suit}`));
		expect(baseSet).toEqual(new Set([...baseSet])); // sanity check

		for (const card of dealtCards) {
			expect(baseSet.has(card)).toBe(true);
		}
	});

	it("デッキの先頭から順にカードが配られている", () => {
		const gs = initGameState(3);
		const beforeDeck = [...gs.deck];

		const newState = deal3rd(gs);

		// 実際に配られた順（flatten）
		const dealt: string[] = [];
		for (const p of newState.players) {
			for (const c of p.holeCards) dealt.push(`${c.rank}${c.suit}`);
			for (const c of p.upcards) dealt.push(`${c.rank}${c.suit}`);
		}

		// 期待値をプレイヤー配布順に再構成
		const expected: string[] = [
			// プレイヤー1
			`${beforeDeck[0].rank}${beforeDeck[0].suit}`,
			`${beforeDeck[3].rank}${beforeDeck[3].suit}`,
			`${beforeDeck[6].rank}${beforeDeck[6].suit}`,

			// プレイヤー2
			`${beforeDeck[1].rank}${beforeDeck[1].suit}`,
			`${beforeDeck[4].rank}${beforeDeck[4].suit}`,
			`${beforeDeck[7].rank}${beforeDeck[7].suit}`,

			// プレイヤー3
			`${beforeDeck[2].rank}${beforeDeck[2].suit}`,
			`${beforeDeck[5].rank}${beforeDeck[5].suit}`,
			`${beforeDeck[8].rank}${beforeDeck[8].suit}`,
		];

		expect(dealt).toEqual(expected);
	});
});
