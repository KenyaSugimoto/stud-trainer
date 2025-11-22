import { describe, expect, it } from "vitest";
import { createDeck } from "../card";
import { initGameState } from "../gameState";

describe("initGameState", () => {
	it("正しいプレイヤー数でゲームステートを初期化する", () => {
		const gs = initGameState(5, "STUD_HI");

		expect(gs.playerCount).toBe(5);
		expect(gs.players).toHaveLength(5);
	});

	it("プレイヤーの初期値が正しい", () => {
		const gs = initGameState(4, "STUD_HI");

		for (let i = 0; i < 4; i++) {
			const p = gs.players[i];

			expect(p.seat).toBe(i);
			expect(p.alive).toBe(true);
			expect(p.stack).toBe(100);
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
		const gs = initGameState(3, "STUD_HI");

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
		const gs = initGameState(3, "STUD_HI");

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
