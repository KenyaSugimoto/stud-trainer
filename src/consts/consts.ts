import type { ActionType, Rank, Stakes, Suit } from "../types/types";

export const SUITS: Suit[] = ["s", "h", "d", "c"];
export const RANKS: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

export const TERMINAL_ACTIONS_VS_BET: ActionType[] = ["c", "f"];

// 1ストリートあたりの最大raise回数
export const MAX_RAISES_PER_STREET = 5;

// デフォルトのステークス設定
export const DEFAULT_STAKES: Stakes = {
	ante: 100,
	bringIn: 200,
	smallBet: 500,
	bigBet: 1000,
};

// スート順位（♣ < ♦ < ♥ < ♠）
export const suitValue = {
	c: 1,
	d: 2,
	h: 3,
	s: 4,
};

// rank を数値化（Stud Hi / Stud8）
export const rankHiValue: Record<string, number> = {
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

// rank を数値化（Razz用：A が最も低い = 最良）
export const rankRazzValue: Record<string, number> = {
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
