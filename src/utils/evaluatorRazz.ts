import { rankRazzValue } from "../consts/consts";
import type { Card } from "../types/types";

// ------------------------------
// Razz (A-to-5 Low) 評価
// - A は常に low (1)
// - ストレート/フラッシュは無視
// - ペアは「悪い」
// - 比較は「カテゴリ → worst(最も高い札) → ...」を辞書順で小さいほど強い
// ------------------------------

type RazzCategory =
	| 0 // NO_PAIR (best)
	| 1 // ONE_PAIR
	| 2 // TWO_PAIR
	| 3 // TRIPS
	| 4 // FULL_HOUSE
	| 5; // QUADS (worst)

export type Evaluate5RazzResult = {
	category: RazzCategory;
	score: number[]; // [category, worst1, worst2, worst3, worst4, worst5]（小さいほど強い）
	hand: Card[];
};

export type Evaluate7RazzResult = {
	category: RazzCategory | null;
	score: number[];
	hand: Card[]; // ベスト5枚
};

export const isBetterLowScore = (a: number[], b: number[] | null): boolean => {
	if (b === null) return true;
	const len = Math.max(a.length, b.length);
	for (let i = 0; i < len; i += 1) {
		const x = a[i] ?? Number.POSITIVE_INFINITY;
		const y = b[i] ?? Number.POSITIVE_INFINITY;
		if (x === y) continue;
		return x < y;
	}
	return false;
};

export const evaluate5Razz = (hand: Card[]): Evaluate5RazzResult => {
	if (hand.length !== 5) {
		throw new Error(`Invalid hand length: expected 5, got ${hand.length}`);
	}

	const lows = hand.map((c) => rankRazzValue[c.rank]);

	// rank frequency
	const freq: Record<number, number> = {};
	for (const r of lows) freq[r] = (freq[r] || 0) + 1;

	const counts = Object.values(freq).sort((a, b) => b - a); // desc
	let category: RazzCategory;

	// 5枚であり得る分布だけ分類
	if (counts[0] === 1) category = 0;
	else if (counts[0] === 2 && counts[1] === 1) category = 1;
	else if (counts[0] === 2 && counts[1] === 2) category = 2;
	else if (counts[0] === 3 && counts[1] === 1) category = 3;
	else if (counts[0] === 3 && counts[1] === 2) category = 4;
	else if (counts[0] === 4) category = 5;
	else throw new Error(`Invalid frequency pattern: ${counts.join(",")}`);

	// Low の tie-break は「worst(最大)から」辞書順（小さいほど強い）
	const worstToBest = [...lows].sort((a, b) => b - a); // desc

	return {
		category,
		score: [category, ...worstToBest],
		hand,
	};
};

export const evaluateHandRazz = (cards: Card[]): Evaluate7RazzResult => {
	const n = cards.length;
	if (n < 5) {
		return {
			category: null,
			score: [],
			hand: [],
		};
	}

	let bestScore: number[] | null = null;
	let bestHand: Card[] = [];
	let bestCategory: RazzCategory | null = null;

	const excludeCount = n - 5;

	if (excludeCount === 0) {
		// n=5, 1通り
		const res = evaluate5Razz(cards);
		bestScore = res.score;
		bestHand = res.hand;
		bestCategory = res.category;
	} else if (excludeCount === 1) {
		// n=6, 1枚除く, 6通り
		for (let i = 0; i < 6; i += 1) {
			const hand = cards.filter((_, idx) => idx !== i);
			const res = evaluate5Razz(hand);

			if (isBetterLowScore(res.score, bestScore)) {
				bestScore = res.score;
				bestHand = res.hand;
				bestCategory = res.category;
			}
		}
	} else if (excludeCount === 2) {
		// n=7, 2枚除く, 21通り
		for (let i = 0; i < 7; i += 1) {
			for (let j = i + 1; j < 7; j += 1) {
				const hand = cards.filter((_, idx) => idx !== i && idx !== j);
				const res = evaluate5Razz(hand);

				if (isBetterLowScore(res.score, bestScore)) {
					bestScore = res.score;
					bestHand = res.hand;
					bestCategory = res.category;
				}
			}
		}
	}

	return {
		category: bestCategory,
		score: bestScore ?? [],
		hand: bestHand,
	};
};
