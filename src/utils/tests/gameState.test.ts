import { describe, expect, it } from "vitest";
import { DEFAULT_INITIAL_STACK } from "../../consts/consts";
import type { Card } from "../../types/types";
import { createDeck } from "../card";
import { goToNextStreet, initGameState } from "../gameState";
import { makePlayer, makeState } from "./helpers";

describe("initGameState", () => {
	it("正しいプレイヤー数でゲームステートを初期化する", () => {
		const gs = initGameState(5, "STUD_HI", DEFAULT_INITIAL_STACK);

		expect(gs.playerCount).toBe(5);
		expect(gs.players).toHaveLength(5);
	});

	it("プレイヤーの初期値が正しい", () => {
		const gs = initGameState(4, "STUD_HI", DEFAULT_INITIAL_STACK);

		for (let i = 0; i < 4; i++) {
			const p = gs.players[i];

			expect(p.seat).toBe(i);
			expect(p.alive).toBe(true);
			expect(p.stack).toBe(DEFAULT_INITIAL_STACK);
			expect(p.holeCards).toEqual([]);
			expect(p.upcards).toEqual([]);
			expect(p.lastAction).toBeNull();
			expect(p.totalBetThisRound).toBe(0);

			if (i === 0) {
				expect(p.name).toBe("You");
				expect(p.isHuman).toBe(true);
			} else {
				expect(p.name).toBe(`CPU${i}`);
				expect(p.isHuman).toBe(false);
			}
		}
	});

	it("デッキが生成され 52 枚あり、シャッフルされている", () => {
		const gs = initGameState(3, "STUD_HI", DEFAULT_INITIAL_STACK);

		expect(gs.deck).toHaveLength(52);

		// createDeck() が返すデフォルト順と違う可能性が高い
		const baseDeck = createDeck();
		expect(gs.deck).not.toEqual(baseDeck);

		// カード集合が同一であることを確認
		const originalSet = new Set(baseDeck.map((c) => `${c.rank}${c.suit}`));
		const shuffledSet = new Set(gs.deck.map((c) => `${c.rank}${c.suit}`));
		expect(shuffledSet).toEqual(originalSet);
	});

	it("ゲームステートの初期値が正しい", () => {
		const gs = initGameState(3, "STUD_HI", DEFAULT_INITIAL_STACK);

		expect(gs.street).toBe("3rd");
		expect(gs.pot).toBe(0);
		expect(gs.bringInIndex).toBeNull();
		expect(gs.currentActorIndex).toBe(0);
		expect(gs.actionsThisStreet).toEqual([]);
		expect(gs.logs).toEqual([]);
		expect(gs.handFinished).toBe(false);
		expect(gs.winnerIndexes).toBeNull();
	});
});

const dummyDeck = (n: number): Card[] => {
	const full = createDeck(); // Rank / Suit 型に完全準拠
	return full.slice(0, n);
};

describe("goToNextStreet", () => {
	// -------------------------
	// 1. ストリート遷移
	// -------------------------
	it("3rd → 4th", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0]);
		state.street = "3rd";
		state.deck = dummyDeck(10);

		const newState = goToNextStreet(state);
		expect(newState.street).toBe("4th");
	});

	it("6th → 7th", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0]);
		state.street = "6th";
		state.deck = dummyDeck(10);

		const newState = goToNextStreet(state);
		expect(newState.street).toBe("7th");
	});

	it("7th → showdown", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0]);
		state.street = "7th";
		state.deck = dummyDeck(10);

		const newState = goToNextStreet(state);
		expect(newState.street).toBe("showdown");
	});

	it("showdown → showdown（変化なし）", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0]);
		state.street = "showdown";
		state.deck = dummyDeck(10);

		const newState = goToNextStreet(state);
		expect(newState.street).toBe("showdown"); // 変化しない
	});

	// -------------------------
	// 2. カード配布（4th〜6th: upcard）
	// -------------------------
	it("4th〜6th では alive プレイヤーに upcard が 1 枚追加される", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1]);

		state.street = "3rd";
		state.deck = dummyDeck(10);

		const next = goToNextStreet(state); // 3rd→4th

		expect(next.players[0].upcards.length).toBe(1);
		expect(next.players[1].upcards.length).toBe(1);
	});

	// -------------------------
	// 3. 7th は hole に配る
	// -------------------------
	it("7th は holeCards に 1 枚追加される", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		const state = makeState([p0, p1]);
		state.street = "6th";
		state.deck = dummyDeck(10);

		const next = goToNextStreet(state);

		expect(next.players[0].holeCards.length).toBe(1);
		expect(next.players[1].holeCards.length).toBe(1);
	});

	// -------------------------
	// 4. dead player にはカードが配られない
	// -------------------------
	it("alive=false のプレイヤーにはカードが配られない", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		p1.alive = false;

		const state = makeState([p0, p1]);
		state.street = "3rd";
		state.deck = dummyDeck(10);

		const next = goToNextStreet(state);

		expect(next.players[0].upcards.length).toBe(1); // 配られる
		expect(next.players[1].upcards.length).toBe(0); // 配られない
	});

	// -------------------------
	// 5. デッキが alive player 数だけ減る
	// -------------------------
	it("デッキの消費枚数は alive プレイヤー数だけ", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		p1.alive = false;

		const state = makeState([p0, p1]);
		state.street = "3rd";
		state.deck = dummyDeck(10);

		const next = goToNextStreet(state);

		expect(next.deck.length).toBe(9); // p0 の1枚だけ消費
	});

	// -------------------------
	// 6. totalBetThisRound と lastAction がリセットされる
	// -------------------------
	it("ベットリセット（totalBetThisRound / lastAction）", () => {
		const p0 = makePlayer(0);
		p0.totalBetThisRound = 50;
		p0.lastAction = "b";

		const state = makeState([p0]);
		state.street = "3rd";
		state.deck = dummyDeck(10);

		const next = goToNextStreet(state);

		expect(next.players[0].totalBetThisRound).toBe(0);
		expect(next.players[0].lastAction).toBe(null);
	});

	// -------------------------
	// 7. actionsThisStreet が空配列になる
	// -------------------------
	it("actionsThisStreet は空配列にリセットされる", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0]);

		state.street = "3rd";
		state.actionsThisStreet = [{ player: 0, type: "b", amount: 20 }];
		state.deck = dummyDeck(10);

		const next = goToNextStreet(state);

		expect(next.actionsThisStreet).toEqual([]);
	});
});
