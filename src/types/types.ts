// ---- Game ----
export type GameType = "STUD_HI" | "RAZZ" | "STUD_8";

export type Street = "3rd" | "4th" | "5th" | "6th" | "7th" | "showdown";

export interface Stakes {
	ante: number; // アンティ額
	bringIn: number; // ブリングイン額
	smallBet: number; // 3rd〜4thのベット単位
	bigBet: number; // 5th〜7thのベット単位
}

// ---- Card ----
export type Suit = "s" | "h" | "d" | "c";
export type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

export interface Card {
	rank: Rank;
	suit: Suit;
}

// ---- Player ----
export type SeatIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export interface PlayerState {
	seat: SeatIndex; // 0〜7
	name: string; // "You", "CPU1", "CPU2" など
	isHuman: boolean;
	alive: boolean;
	stack: number;

	holeCards: Card[];
	upcards: Card[];

	lastAction: ActionType | null;
	totalBetThisRound: number;
}

// ---- Actions ----
export interface Action {
	player: SeatIndex; // seat index
	type: ActionType;
	amount?: number;
}

export interface ActionLog {
	street: Street;
	seat: SeatIndex;
	action: ActionType;
	cards: string; // 表示用 ("XxXx/Ac7d" など)
	amount?: number;
}

// fold, call, bet, raise, check, bring-in, complete
export type ActionType = "f" | "c" | "b" | "r" | "x" | "bri" | "comp";

// ---- GameState ----
export interface GameState {
	playerCount: number; // 2〜8
	stakes: Stakes;
	gameType: GameType;
	players: PlayerState[]; // seat順
	street: Street; // 現在のストリート
	deck: Card[]; // まだ残っているデッキ

	pot: number;
	bringInIndex: SeatIndex | null;
	currentActorIndex: SeatIndex; // 次に行動するseat

	actionsThisStreet: Action[];
	logs: ActionLog[];

	handFinished: boolean;
	winnerIndexes: number[] | null;
}

export const HAND_RANK = {
	ROYAL_FLUSH: 9,
	STRAIGHT_FLUSH: 8,
	FOUR_OF_A_KIND: 7,
	FULL_HOUSE: 6,
	FLUSH: 5,
	STRAIGHT: 4,
	THREE_OF_A_KIND: 3,
	TWO_PAIR: 2,
	ONE_PAIR: 1,
	HIGH_CARD: 0,
} as const;

// Rank の型
export type HandRank = (typeof HAND_RANK)[keyof typeof HAND_RANK];

export type Evaluate7Result = {
	rank: HandRank | null;
	score: number[];
	hand: Card[]; // ベスト5枚
};
