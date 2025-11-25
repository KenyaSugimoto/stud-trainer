import { rankHiValue } from "../consts/consts";
import { type Card, type Evaluate5Result, type Evaluate7Result, HAND_RANK, type HandRank } from "../types/types";

// 5枚から役を判定する
export const evaluate5 = (hand: Card[]): Evaluate5Result => {
	const ranks = hand.map((c) => rankHiValue[c.rank]).sort((a, b) => b - a);
	const suits = hand.map((c) => c.suit);

	const isFlush = suits.every((s) => s === suits[0]);

	const sorted = [...ranks].sort((a, b) => b - a);

	// ストレート判定（A-5 対応）
	let isStraight = false;
	let straightTop = sorted[0];

	if (sorted[0] - sorted[4] === 4 && new Set(sorted).size === 5) {
		isStraight = true;
	}
	const isWheel = sorted.length === 5 && sorted[0] === 14 && sorted[1] === 5 && sorted[4] === 2;
	if (isWheel) {
		isStraight = true;
		straightTop = 5;
	}

	// rank frequency
	const freq: Record<number, number> = {};
	for (const r of ranks) freq[r] = (freq[r] || 0) + 1;

	const groups = Object.entries(freq)
		.map(([rank, cnt]) => ({ rank: Number(rank), cnt }))
		.sort((a, b) => b.cnt - a.cnt || b.rank - a.rank);

	// 役判定

	// 1) Straight Flush (含むロイヤル)
	if (isFlush && isStraight) {
		// ロイヤルフラッシュは straightTop === 14 (A-high)
		const rank = straightTop === 14 ? HAND_RANK.ROYAL_FLUSH : HAND_RANK.STRAIGHT_FLUSH;

		return { rank, score: [rank, straightTop], hand };
	}

	// 2) Four of a Kind
	if (groups[0].cnt === 4) {
		return {
			rank: HAND_RANK.FOUR_OF_A_KIND,
			score: [HAND_RANK.FOUR_OF_A_KIND, groups[0].rank, groups[1].rank],
			hand,
		};
	}

	// 3) Full House
	if (groups[0].cnt === 3 && groups[1].cnt === 2) {
		return {
			rank: HAND_RANK.FULL_HOUSE,
			score: [HAND_RANK.FULL_HOUSE, groups[0].rank, groups[1].rank],
			hand,
		};
	}

	// 4) Flush
	if (isFlush) {
		return {
			rank: HAND_RANK.FLUSH,
			score: [HAND_RANK.FLUSH, ...sorted],
			hand,
		};
	}

	// 5) Straight
	if (isStraight) {
		return {
			rank: HAND_RANK.STRAIGHT,
			score: [HAND_RANK.STRAIGHT, straightTop],
			hand,
		};
	}

	// 6) Trips
	if (groups[0].cnt === 3) {
		const kickers = groups.slice(1).map((g) => g.rank);
		return {
			rank: HAND_RANK.THREE_OF_A_KIND,
			score: [HAND_RANK.THREE_OF_A_KIND, groups[0].rank, ...kickers],
			hand,
		};
	}

	// 7) Two Pair
	if (groups[0].cnt === 2 && groups[1].cnt === 2) {
		const kicker = groups[2].rank;
		return {
			rank: HAND_RANK.TWO_PAIR,
			score: [HAND_RANK.TWO_PAIR, groups[0].rank, groups[1].rank, kicker],
			hand,
		};
	}

	// 8) One Pair
	if (groups[0].cnt === 2) {
		const kickers = groups.slice(1).map((g) => g.rank);
		return {
			rank: HAND_RANK.ONE_PAIR,
			score: [HAND_RANK.ONE_PAIR, groups[0].rank, ...kickers],
			hand,
		};
	}

	// 9) High Card
	return {
		rank: HAND_RANK.HIGH_CARD,
		score: [HAND_RANK.HIGH_CARD, ...sorted],
		hand,
	};
};

// 7枚の中から最強5枚を選ぶ（全21通り）
// メイン関数
export const evaluateHandHi = (cards: Card[]): Evaluate7Result => {
	let best: Evaluate7Result = {
		rank: null,
		score: [],
		hand: [],
	};

	// 7枚 → 21通りの5枚
	for (let i = 0; i < 7; i += 1) {
		for (let j = i + 1; j < 7; j += 1) {
			const hand = cards.filter((_, idx) => idx !== i && idx !== j);
			const res = evaluate5(hand);

			if (isBetterHand(res.rank, res.score, best.rank, best.score)) {
				best = {
					rank: res.rank,
					score: res.score,
					hand: res.hand,
				};
			}
		}
	}

	return best;
};

export const isBetterHand = (
	newRank: HandRank,
	newScore: number[],
	oldRank: HandRank | null,
	oldScore: number[],
): boolean => {
	// oldRank が null → new の方が強い（初期状態）
	if (oldRank === null) return true;

	// rank 比較
	if (newRank !== oldRank) {
		return newRank > oldRank;
	}

	// score を辞書順比較（要素ごと）
	const len = Math.max(newScore.length, oldScore.length);
	for (let i = 0; i < len; i += 1) {
		const a = newScore[i] ?? 0;
		const b = oldScore[i] ?? 0;
		if (a === b) continue;
		return a > b;
	}

	// 完全一致 → new が better とは言えない
	return false;
};
