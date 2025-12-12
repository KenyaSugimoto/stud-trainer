import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Card, GameState, Stakes } from "../../types/types";
import {
	computeStud8Payout,
	evaluate5Low8OrBetter,
	evaluateHandStud8Low,
	formatStud8Showdown,
	resolveShowdownStud8,
} from "../evaluatorStud8";

// evaluatorStud8 は evaluatorHi を import しているので、先に mock を宣言
vi.mock("./evaluatorHi", () => {
	return {
		// seat0 を常に Hi 勝者にしたい、などテストごとに挙動を作りたい場合は
		// 「cards7 に含まれる特定カード」で分岐させる
		evaluateHandHi: (cards: Card[]) => {
			const hasSpadeAce = cards.some((c) => c.rank === "A" && c.suit === "s");
			// hasSpadeAce なら強い（rank=1）
			return hasSpadeAce
				? { rank: 1, score: [1, 99], hand: cards.slice(0, 5) }
				: { rank: 0, score: [0, 88], hand: cards.slice(0, 5) };
		},
		isBetterHand: (newRank: number, _newScore: number[], oldRank: number | null, _oldScore: number[]) => {
			if (oldRank === null) return true;
			return newRank > oldRank;
		},
	};
});

const c = (rank: Card["rank"], suit: Card["suit"]): Card => ({ rank, suit });

const DEFAULT_STAKES: Stakes = {
	ante: 100,
	bringIn: 200,
	smallBet: 500,
	bigBet: 1000,
};

describe("evaluatorStud8 (Low + payout + showdown wiring)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("evaluate5Low8OrBetter", () => {
		it("qualifies: 8-high no-pair", () => {
			const hand = [c("A", "s"), c("2", "h"), c("3", "d"), c("4", "c"), c("8", "s")];
			const res = evaluate5Low8OrBetter(hand);

			expect(res.qualifies).toBe(true);
			// worst card = 8
			expect(res.score[1]).toBe(8);
		});

		it("does not qualify: contains 9", () => {
			const hand = [c("A", "s"), c("2", "h"), c("3", "d"), c("4", "c"), c("9", "s")];
			const res = evaluate5Low8OrBetter(hand);

			expect(res.qualifies).toBe(false);
			expect(res.score.length).toBe(0);
		});

		it("does not qualify: has a pair even if all <= 8", () => {
			const hand = [c("A", "s"), c("2", "h"), c("3", "d"), c("4", "c"), c("4", "s")];
			const res = evaluate5Low8OrBetter(hand);

			expect(res.qualifies).toBe(false);
		});
	});

	describe("evaluateHandStud8Low", () => {
		it("picks best low from 7 (A2345)", () => {
			const cards7: Card[] = [
				c("A", "h"),
				c("2", "h"),
				c("3", "d"),
				c("4", "c"),
				c("5", "s"),
				c("K", "d"),
				c("9", "c"),
			];

			const res = evaluateHandStud8Low(cards7);
			expect(res).not.toBeNull();
			expect(res?.qualifies).toBe(true);

			// worst card = 5
			expect(res?.score[1]).toBe(5);

			const ranks = res!.hand
				.map((x) => x.rank)
				.sort()
				.join("");
			expect(ranks).toBe(["A", "2", "3", "4", "5"].sort().join(""));
		});

		it("returns null if no qualifying low exists", () => {
			const cards7: Card[] = [
				c("K", "h"),
				c("Q", "h"),
				c("J", "d"),
				c("T", "c"),
				c("9", "s"),
				c("K", "d"),
				c("9", "c"),
			];

			const res = evaluateHandStud8Low(cards7);
			expect(res).toBeNull();
		});
	});

	describe("computeStud8Payout (unit = ante)", () => {
		it("splits pot into hi/low by ante unit; odd unit goes to hi; split remainders distributed by seat asc", () => {
			// pot=1100, ante=100 => 11 units
			// hi gets ceil(11/2)=6 units => 600
			// low gets floor(11/2)=5 units => 500
			// low winners 2人 => base=2 units=200 each, rem=1 unit=100 to smaller seat
			const pot = 1100;
			const hiWinners = [0] as const;
			const lowWinners = [1, 2] as const;

			const payout = computeStud8Payout(pot, DEFAULT_STAKES, [...hiWinners], [...lowWinners]);

			expect(payout[0]).toBe(600);
			expect(payout[1]).toBe(300);
			expect(payout[2]).toBe(200);
		});

		it("hi scoops when low does not qualify", () => {
			// pot=1000, ante=100, hi winners 3人
			// 10 units / 3 => base=3 units=300, rem=1 unit=100 to smallest seat
			const pot = 1000;
			const hiWinners = [1, 3, 4] as const;

			const payout = computeStud8Payout(pot, DEFAULT_STAKES, [...hiWinners], null);

			expect(payout[1]).toBe(400);
			expect(payout[3]).toBe(300);
			expect(payout[4]).toBe(300);
		});

		it("throws if pot is not multiple of ante", () => {
			expect(() => computeStud8Payout(1050, DEFAULT_STAKES, [0], [1])).toThrow(/multiple of unit/);
		});
	});

	describe("formatStud8Showdown", () => {
		it("includes both HI and LOW sections", () => {
			const hi = {
				rank: 0 as const,
				score: [0],
				hand: [c("A", "s"), c("K", "s"), c("Q", "s"), c("J", "s"), c("T", "s")],
			};
			const low = {
				qualifies: true,
				score: [0, 8, 4, 3, 2, 1],
				hand: [c("A", "h"), c("2", "h"), c("3", "d"), c("4", "c"), c("8", "s")],
			};

			const s = formatStud8Showdown(hi, low);
			expect(s).toContain("HI:");
			expect(s).toContain("LOW(8+):");
		});
	});

	describe("resolveShowdownStud8", () => {
		it("updates stacks by payout, sets pot=0, handFinished=true, logs include HI/LOW", () => {
			// seat0: cards7 contains As -> mocked evaluateHandHi makes seat0 win HI
			// seat1: better LOW (A2345) -> seat1 wins LOW
			const seat0Cards7: Card[] = [
				c("A", "s"),
				c("K", "h"),
				c("Q", "d"),
				c("J", "c"),
				c("T", "s"),
				c("9", "h"),
				c("8", "d"),
			];
			const seat1Cards7: Card[] = [
				c("A", "h"),
				c("2", "h"),
				c("3", "d"),
				c("4", "c"),
				c("5", "s"),
				c("K", "d"),
				c("9", "c"),
			];

			const gs: GameState = {
				playerCount: 2,
				stakes: DEFAULT_STAKES,
				gameType: "STUD_8",
				players: [
					{
						seat: 0,
						name: "P0",
						isHuman: true,
						alive: true,
						stack: 10000,
						holeCards: seat0Cards7.slice(0, 3),
						upcards: seat0Cards7.slice(3),
						lastAction: null,
						totalBetThisRound: 0,
					},
					{
						seat: 1,
						name: "P1",
						isHuman: false,
						alive: true,
						stack: 10000,
						holeCards: seat1Cards7.slice(0, 3),
						upcards: seat1Cards7.slice(3),
						lastAction: null,
						totalBetThisRound: 0,
					},
				],
				street: "showdown",
				deck: [],
				pot: 1100, // 11 units（ante=100）
				bringInIndex: null,
				currentActorIndex: 0,
				actionsThisStreet: [],
				logs: [],
				handFinished: false,
				winnerIndexes: null,
			};

			const next = resolveShowdownStud8(gs);

			// pot cleared
			expect(next.pot).toBe(0);
			expect(next.handFinished).toBe(true);

			// payout: hi=600 to seat0, low=500 to seat1
			expect(next.players[0].stack).toBe(10600);
			expect(next.players[1].stack).toBe(10500);

			// winners union
			expect(next.winnerIndexes).toEqual([0, 1]);

			// logs: 2 players + summary (=3)
			expect(next.logs.length).toBeGreaterThanOrEqual(3);
			const joined = next.logs.map((l) => l.cards).join("\n");
			expect(joined).toContain("HI:");
			expect(joined).toContain("LOW(8+):");
		});
	});
});
