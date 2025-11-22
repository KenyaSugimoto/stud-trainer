import type { Card, GameState, PlayerState } from "../types/types";

// スート順位（♣ < ♦ < ♥ < ♠）
const suitValue = {
	c: 1,
	d: 2,
	h: 3,
	s: 4,
};

// rank を数値化（Stud Hi / Stud8）
const rankHiValue: Record<string, number> = {
	A: 14,
	K: 13,
	Q: 12,
	J: 11,
	T: 10,
	9: 9,
	8: 8,
	7: 7,
	6: 6,
	5: 5,
	4: 4,
	3: 3,
	2: 2,
};

// rank を数値化（Razz用：A が最強）
const rankRazzValue: Record<string, number> = {
	A: 1,
	2: 2,
	3: 3,
	4: 4,
	5: 5,
	6: 6,
	7: 7,
	8: 8,
	9: 9,
	T: 10,
	J: 11,
	Q: 12,
	K: 13,
};

const upcardOf = (p: PlayerState): Card => p.upcards[0];

/** bring-in seatIndex を返す */
export const computeBringIn = (state: GameState): number => {
	const alivePlayers = state.players.filter((p) => p.alive);

	let best: PlayerState | null = null;

	for (const p of alivePlayers) {
		const card = upcardOf(p);
		if (!card) continue;

		if (!best) {
			best = p;
			continue;
		}

		const c1 = card;
		const c2 = upcardOf(best);

		// 現在のゲームに応じた rank 値を取得
		const rankVal = state.gameType === "RAZZ" ? rankRazzValue : rankHiValue;

		const v1 = rankVal[c1.rank];
		const v2 = rankVal[c2.rank];

		// Razz → " strongest" が bring-in
		if (state.gameType === "RAZZ") {
			if (v1 > v2 || (v1 === v2 && suitValue[c1.suit] > suitValue[c2.suit])) {
				best = p;
			}
			continue;
		}

		// Stud Hi / Stud8 → " weakest" が bring-in
		if (v1 < v2 || (v1 === v2 && suitValue[c1.suit] < suitValue[c2.suit])) {
			best = p;
		}
	}

	return best?.seat ?? 0;
};
