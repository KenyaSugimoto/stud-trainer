import { describe, expect, it } from "vitest";
import { DEFAULT_INITIAL_STACK } from "../../consts/consts";
import { calcBetAmount, collectAntes, getStreetBetUnit, getToCall } from "../betUnit";
import { makePlayer, makeState } from "./helpers";

describe("getStreetBetUnit", () => {
	it("3rd / 4th は smallBet を返す", () => {
		const state = makeState([makePlayer(0)], "3rd");
		expect(getStreetBetUnit(state)).toBe(state.stakes.smallBet);

		const state2 = makeState([makePlayer(0)], "4th");
		expect(getStreetBetUnit(state2)).toBe(state2.stakes.smallBet);
	});

	it("5th〜7th は bigBet を返す", () => {
		const state = makeState([makePlayer(0)], "5th");
		expect(getStreetBetUnit(state)).toBe(state.stakes.bigBet);

		const state2 = makeState([makePlayer(0)], "7th");
		expect(getStreetBetUnit(state2)).toBe(state2.stakes.bigBet);
	});
});

describe("getToCall", () => {
	it("自分より bet している人がいない場合は 0", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);
		const state = makeState([p0, p1]);

		expect(getToCall(state, 0)).toBe(0);
		expect(getToCall(state, 1)).toBe(0);
	});

	it("他プレイヤーの bet に対して必要なコール額を返す", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p1.totalBetThisRound = 20;

		const state = makeState([p0, p1]);

		expect(getToCall(state, 0)).toBe(20);
		expect(getToCall(state, 1)).toBe(0);
	});
});

describe("calcBetAmount", () => {
	it("check / fold の金額は 0", () => {
		const state = makeState([makePlayer(0)]);
		expect(calcBetAmount(state, 0, "x")).toBe(0);
		expect(calcBetAmount(state, 0, "f")).toBe(0);
	});

	it("call は必要額を返す", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p1.totalBetThisRound = 20;

		const state = makeState([p0, p1]);

		expect(calcBetAmount(state, 0, "c")).toBe(20); // p0 がコール
		expect(calcBetAmount(state, 1, "c")).toBe(0); // p1 は already called
	});

	it("3rd の bring-in は bringIn を返す", () => {
		const state = makeState([makePlayer(0)], "3rd");
		expect(calcBetAmount(state, 0, "bri")).toBe(state.stakes.bringIn);
	});

	it("3rd の complete は smallBet を返す", () => {
		const state = makeState([makePlayer(0)], "3rd");
		expect(calcBetAmount(state, 0, "comp")).toBe(state.stakes.smallBet);
	});

	it("通常の bet は unit（street のベット額）を返す", () => {
		const state3rd = makeState([makePlayer(0)], "3rd");
		expect(calcBetAmount(state3rd, 0, "b")).toBe(state3rd.stakes.smallBet);

		const state5th = makeState([makePlayer(0)], "5th");
		expect(calcBetAmount(state5th, 0, "b")).toBe(state5th.stakes.bigBet);
	});

	it("raise は toCall + unit を返す", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p1.totalBetThisRound = 1000;

		const state = makeState([p0, p1], "5th");

		// 5th → unit は bigBet = 1000
		// toCall(p0) = 1000
		// raise → toCall + unit → 1000 + 1000 = 2000
		expect(calcBetAmount(state, 0, "r")).toBe(2000);
	});

	it("showdown では常に 0 を返す", () => {
		const state = makeState([makePlayer(0)], "showdown");
		expect(calcBetAmount(state, 0, "b")).toBe(0);
		expect(calcBetAmount(state, 0, "r")).toBe(0);
	});
});

describe("collectAntes", () => {
	it("全プレイヤーから ante を回収して pot に加算する", () => {
		// players を用意
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		const state = makeState([p0, p1]);

		const gs = collectAntes(state);

		// ante総額 = 200 (100 * 2)
		expect(gs.pot).toBe(200);

		// stack が減っている
		expect(gs.players[0].stack).toBe(DEFAULT_INITIAL_STACK - 100);
		expect(gs.players[1].stack).toBe(DEFAULT_INITIAL_STACK - 100);
		// totalBetThisRound は影響を受けない
		expect(gs.players[0].totalBetThisRound).toBe(0);
		expect(gs.players[1].totalBetThisRound).toBe(0);
	});

	it("片方がスタック不足でも、可能な分だけ ante を回収する", () => {
		const p0 = makePlayer(0);
		const p1 = makePlayer(1);

		p0.stack = 10; // ante 未満

		const state = makeState([p0, p1]);

		const gs = collectAntes(state);

		// p0 は 10 しか払えない
		// p1 は 100 払える → 合計 110
		expect(gs.pot).toBe(110);
		expect(gs.players[0].stack).toBe(0);
		expect(gs.players[1].stack).toBe(DEFAULT_INITIAL_STACK - 100);
	});
});
