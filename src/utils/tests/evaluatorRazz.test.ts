import { describe, expect, it } from "vitest";
import type { Card } from "../../types/types";
import { evaluate5Razz, evaluateHandRazz } from "../evaluatorRazz";

const c = (rank: Card["rank"], suit: Card["suit"]): Card => ({ rank, suit });

describe("evaluatorRazz", () => {
	it("evaluate5Razz: no-pair 5-low beats no-pair 6-low", () => {
		const hand5 = [c("A", "s"), c("2", "h"), c("3", "d"), c("4", "c"), c("5", "s")];
		const hand6 = [c("A", "h"), c("2", "d"), c("3", "c"), c("4", "s"), c("6", "h")];

		const r5 = evaluate5Razz(hand5);
		const r6 = evaluate5Razz(hand6);

		// カテゴリはどちらも no-pair
		expect(r5.category).toBe(0);
		expect(r6.category).toBe(0);

		// score は小さいほど強い（worst→bestの辞書順）
		// 5-low のほうが強い
		expect(r5.score[1]).toBe(5);
		expect(r6.score[1]).toBe(6);
		expect(r5.score.join(",") < r6.score.join(",")).toBe(true); // 簡易チェック
	});

	it("evaluate5Razz: any no-pair beats any one-pair", () => {
		const noPair = [c("A", "s"), c("2", "h"), c("3", "d"), c("4", "c"), c("7", "s")];
		const onePair = [c("A", "h"), c("2", "d"), c("3", "c"), c("4", "s"), c("4", "h")];

		const r1 = evaluate5Razz(noPair);
		const r2 = evaluate5Razz(onePair);

		expect(r1.category).toBe(0);
		expect(r2.category).toBe(1);

		// category が小さいほど強い（0 < 1）
		expect(r1.score[0]).toBeLessThan(r2.score[0]);
	});

	it("evaluateHandRazz: chooses best 5 out of 7 (avoids duplicates)", () => {
		// 7枚に 5 が2枚ある。ベストは A2345（ペアを避ける）
		const cards7: Card[] = [c("A", "s"), c("2", "h"), c("3", "d"), c("4", "c"), c("5", "s"), c("5", "h"), c("9", "d")];

		const res = evaluateHandRazz(cards7);

		expect(res.category).toBe(0); // no-pair
		// worst card が 5 のはず
		expect(res.score[1]).toBe(5);

		const ranks = res.hand
			.map((x) => x.rank)
			.sort()
			.join("");
		// A2345 が含まれること（順不同のためソートして比較）
		expect(ranks).toBe(["A", "2", "3", "4", "5"].sort().join(""));
	});

	it("evaluateHandRazz: picks best possible wheel-like low from 7", () => {
		// 4 が2枚あるが、A2345 が作れる
		const cards7: Card[] = [c("A", "s"), c("2", "h"), c("3", "d"), c("4", "c"), c("4", "s"), c("5", "h"), c("K", "d")];

		const res = evaluateHandRazz(cards7);

		expect(res.category).toBe(0);
		expect(res.score[1]).toBe(5);

		const ranks = res.hand
			.map((x) => x.rank)
			.sort()
			.join("");
		expect(ranks).toBe(["A", "2", "3", "4", "5"].sort().join(""));
	});

	it("evaluate5Razz: throws on invalid hand length", () => {
		expect(() => evaluate5Razz([c("A", "s")] as unknown as Card[])).toThrow(/expected 5/);
	});
});
