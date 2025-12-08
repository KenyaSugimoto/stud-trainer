import { describe, expect, it } from "vitest";
import {
	getActionLabel,
	getAllowedActions,
	getFirstActorForStreet,
	getNextActorIndex,
	shouldEndStreet,
} from "../actor";
import { computeBringIn } from "../bringIn";
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

		state.currentActorIndex = 2;
		expect(getNextActorIndex(state)).toBe(0);
	});
});

describe("getAllowedActions - 3rd street", () => {
	it("bring-in プレイヤーのファーストアクションは bri/comp のみ", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1], "3rd");

		state.bringInIndex = 0;
		const actions = getAllowedActions(state, 0);

		expect(actions).toEqual(["bri", "comp"]);
	});

	it("まだcompleteがされていない状況でbring-in 以外は fold / call / comp", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1], "3rd");

		state.bringInIndex = 0;
		const actions = getAllowedActions(state, 1);

		expect(actions).toContain("f");
		expect(actions).toContain("c");
		expect(actions).toContain("comp");
	});

	it("bring-in がされており、complete もされている場合は fold / call / raise", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1], "3rd");

		state.bringInIndex = 0;
		state.actionsThisStreet = [
			{ type: "bri", player: 0, amount: 200 },
			{ type: "comp", player: 1, amount: 500 },
		];

		const actions = getAllowedActions(state, 1);

		expect(actions).toContain("f");
		expect(actions).toContain("c");
		expect(actions).toContain("r");
	});

	it("bring-in がされており、complete されていない場合は fold / call / comp", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1], "3rd");

		state.bringInIndex = 0;
		state.actionsThisStreet = [{ type: "bri", player: 0, amount: 200 }];

		const actions = getAllowedActions(state, 1);

		expect(actions).toContain("f");
		expect(actions).toContain("c");
		expect(actions).toContain("comp");
	});

	it("raise cap に達したら raise 不可", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1], "3rd");

		state.bringInIndex = 0;
		state.actionsThisStreet = [
			{ type: "bri", player: 0, amount: 200 },
			{ type: "comp", player: 1, amount: 500 },
			{ type: "r", player: 0, amount: 1000 },
			{ type: "r", player: 1, amount: 1500 },
			{ type: "r", player: 0, amount: 2000 },
			{ type: "r", player: 1, amount: 2500 },
		];

		const actions = getAllowedActions(state, 1);

		expect(actions).toContain("f");
		expect(actions).toContain("c");
		expect(actions).not.toContain("r");
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

describe("shouldEndStreet", () => {
	it("生存者が1以下なら true（ストリート終了）", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		p1.alive = false;

		const state = makeState([p0, p1]);

		expect(shouldEndStreet(state)).toBe(true);
	});

	it("レイズがあり、全員の bet が揃い、一周していればストリート終了", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p0.totalBetThisRound = 1000;
		p1.totalBetThisRound = 1000;

		const state = makeState([p0, p1]);

		state.actionsThisStreet = [
			{ type: "b", player: 0 },
			{ type: "r", player: 1 },
			{ type: "c", player: 0 },
		];

		expect(shouldEndStreet(state)).toBe(true);
	});

	it("ベットが揃っていなければストリートは続行", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p0.totalBetThisRound = 20;
		p1.totalBetThisRound = 0;

		const state = makeState([p0, p1]);

		state.actionsThisStreet = [{ type: "b", player: 0 }];

		expect(shouldEndStreet(state)).toBe(false);
	});

	it("4th Street でレイズがない場合、全員が x したらストリート終了", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		const state = makeState([p0, p1]);
		state.street = "4th";

		state.actionsThisStreet = [
			{ type: "x", player: 0 },
			{ type: "x", player: 1 },
		];

		expect(shouldEndStreet(state)).toBe(true);
	});

	it("アグレッサー以外が全員foldした場合はストリート終了", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p0.totalBetThisRound = 500;
		p1.totalBetThisRound = 0;

		const state = makeState([p0, p1]);

		state.actionsThisStreet = [
			{ type: "b", player: 0 },
			{ type: "f", player: 1 },
		];

		expect(shouldEndStreet(state)).toBe(true);
	});

	it("ショウダウンなら常にストリート終了", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		const state = makeState([p0, p1]);
		state.street = "showdown";

		expect(shouldEndStreet(state)).toBe(true);
	});
});

describe("getFirstActorForStreet (3rd Street / Bring-in)", () => {
	it("street=3rd → bring-in が最初のアクター", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p0.upcards = [{ rank: "A", suit: "s" }];
		p1.upcards = [{ rank: "K", suit: "c" }];

		const state = makeState([p0, p1]);
		state.street = "3rd";

		state.bringInIndex = computeBringIn(state);

		const first = getFirstActorForStreet(state);
		expect(first).toBe(state.bringInIndex);
	});
});

describe("getFirstActorForStreet (4th〜)", () => {
	it("Stud Hi: 最も強いアップカードが最初のアクター", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const p2 = makePlayer(2);

		p0.upcards = [{ rank: "5", suit: "d" }];
		p1.upcards = [{ rank: "K", suit: "c" }];
		p2.upcards = [{ rank: "K", suit: "s" }]; // 最強（同rank, suit強い）

		const state = makeState([p0, p1, p2]);
		state.street = "4th";

		const first = getFirstActorForStreet(state);
		expect(first).toBe(2);
	});

	it("Razz: 最も弱い（rank低い）アップカードが first actor", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const p2 = makePlayer(2);

		p0.upcards = [{ rank: "9", suit: "d" }];
		p1.upcards = [{ rank: "4", suit: "s" }];
		p2.upcards = [{ rank: "A", suit: "c" }]; // Razz 最強

		const state = makeState([p0, p1, p2]);
		state.street = "5th";
		state.gameType = "RAZZ";

		const first = getFirstActorForStreet(state);
		expect(first).toBe(2);
	});
});
