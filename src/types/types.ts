// ---- Game ----
export type GameType = "STUD_HI" | "RAZZ" | "STUD_8";

export type Street = "3rd" | "4th" | "5th" | "6th" | "7th";

// ---- Card ----
export type Suit = "s" | "h" | "d" | "c";
export type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2" | "X";

export interface Card {
	rank: Rank;
	suit: Suit;
}

// ---- Player ----

export interface PlayerState {
	seat: number; // 0〜7
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
	player: number; // seat index
	type: ActionType;
	amount?: number;
}

export interface ActionLog {
	street: Street;
	seat: number;
	action: ActionType;
	cards: string;  // 表示用 ("XxXx/Ac7d" など)
	size?: number;
}

// fold, call, bet, raise, check, bring-in, complete
export type ActionType = "f" | "c" | "b" | "r" | "x" | "bri" | "comp";

// ---- GameState ----
export interface GameState {
	playerCount: number; // 2〜8
	gameType: GameType;
	players: PlayerState[]; // seat順
	street: Street; // 現在のストリート
	deck: Card[]; // まだ残っているデッキ

	pot: number;
	bringInIndex: number | null;
	currentActorIndex: number; // 次に行動するseat

	actionsThisStreet: Action[];
	logs: ActionLog[];

	handFinished: boolean;
	winnerIndexes: number[] | null;
}
