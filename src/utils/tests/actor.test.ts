import { describe, expect, it } from "vitest";
import { applyAction, getActionLabel, getAllowedActions, getNextActorIndex } from "../actor";
import { makePlayer, makeState } from "./helpers";

describe("getNextActorIndex", () => {
	it("生存プレイヤーの次のアクターを返す", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const p2 = makePlayer(2);
		const state = makeState([p0, p1, p2]);

		state.currentActorIndex = 0;
		expect(getNextActorIndex(state)).toBe(1);

		p1.alive = false;
		expect(getNextActorIndex(state)).toBe(2);
	});
});

describe("applyAction", () => {
	it("fold は alive=false にする", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0]);

		const newState = applyAction(state, "f");
		expect(newState.players[0].alive).toBe(false);
	});

	it("bet/raise/call は pot と totalBetThisRound を更新", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0]);

		const newState = applyAction(state, "b", 20);

		expect(newState.pot).toBe(20);
		expect(newState.players[0].totalBetThisRound).toBe(20);
	});

	it("全員 fold で handFinished=true（winnerIndexes は空配列）", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p1.alive = false; // p0 だけが生存
		const state = makeState([p0, p1]);

		const newState = applyAction(state, "f"); // p0 が fold → 全員死ぬ

		expect(newState.handFinished).toBe(true);
		expect(newState.winnerIndexes).toEqual(null);
	});

	it("最後に1人だけ生き残った場合はその seat が winner", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		const state = makeState([p0, p1]);

		// p0 が fold → p1 が唯一の生存者
		const newState = applyAction(state, "f");

		expect(newState.handFinished).toBe(true);
		expect(newState.winnerIndexes).toEqual([1]); // ← 正しい勝者
	});

	it("次のアクターが正しく進む", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1]);

		state.currentActorIndex = 0;
		const newState = applyAction(state, "x");

		expect(newState.currentActorIndex).toBe(1);
	});
});

describe("getAllowedActions - 3rd street", () => {
	it("bring-in プレイヤーは bri/comp のみ", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1], "3rd");

		state.bringInIndex = 0;
		const actions = getAllowedActions(state, 0);

		expect(actions).toEqual(["bri", "comp"]);
	});

	it("bring-in 以外は fold / call / raise", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1], "3rd");

		state.bringInIndex = 0;
		const actions = getAllowedActions(state, 1);

		expect(actions).toContain("f");
		expect(actions).toContain("c");
		expect(actions).toContain("r");
	});
});

describe("getAllowedActions - 4th〜7th", () => {
	it("誰も bet していない → check / bet", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0], "4th");

		const actions = getAllowedActions(state, 0);
		expect(actions).toEqual(["x", "b"]);
	});

	it("bet がある → fold / call / raise", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0], "4th");

		state.actionsThisStreet = [{ type: "b", player: 0, amount: 20 }];

		const actions = getAllowedActions(state, 0);
		expect(actions).toContain("f");
		expect(actions).toContain("c");
		expect(actions).toContain("r");
	});
});

describe("getAllowedActions - raise 制限", () => {
	it("raise が MAX に達したら raise 不可", () => {
		const p0 = makePlayer(0);
		const state = makeState([p0], "4th");

		state.actionsThisStreet = [
			{ type: "b", player: 0, amount: 20 },
			{ type: "r", player: 0, amount: 20 },
			{ type: "r", player: 0, amount: 20 },
			{ type: "r", player: 0, amount: 20 },
			{ type: "r", player: 0, amount: 20 },
		];

		const actions = getAllowedActions(state, 0);

		expect(actions).toContain("f");
		expect(actions).toContain("c");
		expect(actions).not.toContain("r");
	});
});

describe("getActionLabel", () => {
	it("各アクションの label が正しい", () => {
		expect(getActionLabel("f")).toBe("Fold");
		expect(getActionLabel("c")).toBe("Call");
		expect(getActionLabel("b")).toBe("Bet");
		expect(getActionLabel("r")).toBe("Raise");
		expect(getActionLabel("x")).toBe("Check");
		expect(getActionLabel("bri")).toBe("Bring-In");
		expect(getActionLabel("comp")).toBe("Complete");
	});
});
