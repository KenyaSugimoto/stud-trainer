import { describe, expect, it } from "vitest";
import type { GameState, PlayerState, Rank, Suit } from "../../types/types";
import { computeBringIn } from "../bringIn";

// ヘルパー：アップカード1枚だけ持つ Player を作る
function makePlayer(seat: number, rank: Rank, suit: Suit): PlayerState {
	return {
		seat,
		name: `P${seat}`,
		isHuman: false,
		alive: true,
		stack: 100,
		holeCards: [],
		upcards: [{ rank, suit }],
		lastAction: null,
		totalBetThisRound: 0,
	};
}

// 最小限の GameState を作る
function makeState(players: PlayerState[], gameType: GameState["gameType"]): GameState {
	return {
		playerCount: players.length,
		players,
		street: "3rd",
		deck: [],
		pot: 0,
		bringInIndex: null,
		currentActorIndex: 0,
		actionsThisStreet: [],
		logs: [],
		handFinished: false,
		winnerIndexes: null,
		gameType,
	};
}

describe("computeBringIn - Stud Hi / Stud8", () => {
	it("最弱のアップカード（rank が低い）が bring-in になる", () => {
		const players = [
			makePlayer(0, "K", "s"),
			makePlayer(1, "3", "h"), // 最弱 → bring-in
			makePlayer(2, "T", "d"),
		];
		const state = makeState(players, "STUD_HI");

		const result = computeBringIn(state);

		expect(result).toBe(1);
	});

	it("rank が同じ場合は suit が弱い方が bring-in", () => {
		// suit 強さ: c < d < h < s
		const players = [
			makePlayer(0, "9", "s"), // 強いスート
			makePlayer(1, "9", "c"), // 最弱スート → bring-in
			makePlayer(2, "9", "h"),
		];
		const state = makeState(players, "STUD_HI");

		const result = computeBringIn(state);

		expect(result).toBe(1);
	});
});

describe("computeBringIn - Razz", () => {
	it("Razz bring-in判定", () => {
		const players = [
			makePlayer(0, "4", "d"),
			makePlayer(1, "A", "c"),
			makePlayer(2, "7", "h"), // bring-in
		];
		const state = makeState(players, "RAZZ");

		const result = computeBringIn(state);

		expect(result).toBe(2);
	});

	it("Razz rankが同じ場合、スペード（s > h > d > c）が bring-in", () => {
		const players = [
			makePlayer(0, "6", "d"),
			makePlayer(1, "6", "c"),
			makePlayer(2, "6", "s"), // bring-in
		];
		const state = makeState(players, "RAZZ");

		const result = computeBringIn(state);

		expect(result).toBe(2);
	});
});

describe("computeBringIn - 共通動作", () => {
	it("alive=false のプレイヤーは無視される", () => {
		const p0 = makePlayer(0, "K", "h");
		const p1 = makePlayer(1, "2", "c");

		p0.alive = false;

		const state = makeState([p0, p1], "STUD_HI");

		// 生存しているのは p1 のみ → seat=1
		expect(computeBringIn(state)).toBe(1);
	});

	it("アップカードがないプレイヤーは無視される", () => {
		const p0 = makePlayer(0, "T", "d");
		const p1 = makePlayer(1, "4", "s");

		// upcards が空
		p0.upcards = [];

		const state = makeState([p0, p1], "STUD_HI");

		expect(computeBringIn(state)).toBe(1); // p0 は除外される
	});
});
