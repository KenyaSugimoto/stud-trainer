import { rankRazzValue } from "../consts/consts";
import type { ActionLog, Card, Evaluate7Result, GameState, HandRank, SeatIndex, Stakes } from "../types/types";
import { evaluateHandHi, isBetterHand } from "./evaluateStudHi";

// ------------------------------
// Stud Hi/Lo 8-or-better (Stud8)
// - Hi: 既存 evaluateHandHi を使用
// - Low: A-to-5 low（ストレート/フラッシュ無視）
//        8-or-better qualify: 「5 distinct かつ 最大が 8 以下」
// - ポット分配: まず半分ずつ（最小単位 = ante）
//              端数(ante単位の1ユニット)は Hi 側へ
// ------------------------------

export type EvaluateLowResult = {
	qualifies: boolean;
	score: number[]; // [0, worst1, worst2, worst3, worst4, worst5]（小さいほど強い）
	hand: Card[];
};

export type EvaluateStud8Result = {
	hi: Evaluate7Result;
	low: EvaluateLowResult | null;
};

export type Stud8Winners = {
	hiWinners: SeatIndex[];
	lowWinners: SeatIndex[] | null;
	hiBest: Evaluate7Result;
	lowBest: EvaluateLowResult | null;
};

// ------------------------------
// Low 比較（小さいほど強い）
// ------------------------------
const isBetterLowScore = (a: number[], b: number[] | null): boolean => {
	if (b === null) return true;
	const len = Math.max(a.length, b.length);
	for (let i = 0; i < len; i += 1) {
		const x = a[i] ?? Number.POSITIVE_INFINITY;
		const y = b[i] ?? Number.POSITIVE_INFINITY;
		if (x === y) continue;
		return x < y;
	}
	return false;
};

// ------------------------------
// 5枚 Low 8-or-better
// ------------------------------
export const evaluate5Low8OrBetter = (hand: Card[]): EvaluateLowResult => {
	if (hand.length !== 5) {
		throw new Error(`Invalid hand length: expected 5, got ${hand.length}`);
	}

	const lows = hand.map((c) => rankRazzValue[c.rank]); // A=1

	const unique = new Set(lows);
	const max = Math.max(...lows);

	// qualify: 5 distinct & <= 8
	const qualifies = unique.size === 5 && max <= 8;
	if (!qualifies) {
		return { qualifies: false, score: [], hand };
	}

	// Low の tie-break は worst(最大)から辞書順（小さいほど強い）
	const worstToBest = [...lows].sort((a, b) => b - a); // desc
	return {
		qualifies: true,
		score: [0, ...worstToBest],
		hand,
	};
};

// ------------------------------
// 7枚から Low 8-or-better のベスト5（21通り）
// ------------------------------
export const evaluateHandStud8Low = (cards: Card[]): EvaluateLowResult | null => {
	if (cards.length !== 7) {
		throw new Error(`Invalid cards length: expected 7, got ${cards.length}`);
	}

	let bestScore: number[] | null = null;
	let bestHand: Card[] = [];

	for (let i = 0; i < 7; i += 1) {
		for (let j = i + 1; j < 7; j += 1) {
			const hand = cards.filter((_, idx) => idx !== i && idx !== j);
			const res = evaluate5Low8OrBetter(hand);
			if (!res.qualifies) continue;

			if (isBetterLowScore(res.score, bestScore)) {
				bestScore = res.score;
				bestHand = res.hand;
			}
		}
	}

	if (bestScore === null) return null;
	return { qualifies: true, score: bestScore, hand: bestHand };
};

// ------------------------------
// Hi/Lo 統合評価
// ------------------------------
export const evaluateHandStud8 = (cards: Card[]): EvaluateStud8Result => {
	const hi = evaluateHandHi(cards);
	const low = evaluateHandStud8Low(cards);
	return { hi, low };
};

// ------------------------------
// 勝者判定（Hi / Low）
// ------------------------------
export const pickStud8WinnersFromPlayers = (
	players: { seat: SeatIndex; alive: boolean; cards7: Card[] }[],
): Stud8Winners => {
	const alive = players.filter((p) => p.alive);

	// Hi
	let hiBest: Evaluate7Result = { rank: null, score: [], hand: [] };
	let hiWinners: SeatIndex[] = [];

	// Low
	let lowBestScore: number[] | null = null;
	let lowBest: EvaluateLowResult | null = null;
	let lowWinners: SeatIndex[] = [];

	for (const p of alive) {
		const hi = evaluateHandHi(p.cards7);

		if (isBetterHand(hi.rank as HandRank, hi.score, hiBest.rank, hiBest.score)) {
			hiBest = hi;
			hiWinners = [p.seat];
		} else if (hiBest.rank !== null && hi.rank === hiBest.rank) {
			const same = hi.score.length === hiBest.score.length && hi.score.every((v, i) => v === hiBest.score[i]);
			if (same) hiWinners.push(p.seat);
		}

		const low = evaluateHandStud8Low(p.cards7);
		if (!low) continue;

		if (isBetterLowScore(low.score, lowBestScore)) {
			lowBestScore = low.score;
			lowBest = low;
			lowWinners = [p.seat];
		} else if (lowBestScore !== null) {
			const best = lowBestScore; // ここで number[] に確定
			const same = low.score.length === best.length && low.score.every((v, i) => v === best[i]);
			if (same) lowWinners.push(p.seat);
		}
	}

	return {
		hiWinners,
		lowWinners: lowBest ? lowWinners : null,
		hiBest,
		lowBest,
	};
};

// ------------------------------
// 表示用（Hi/Low 両方）
// ActionLog.cards にそのまま入れられる文字列を返す
// ------------------------------
const cardToStr = (c: Card) => `${c.rank}${c.suit}`;
const formatCards5 = (cards: Card[]) => cards.map(cardToStr).join("");

const formatLowRanks5WorstToBest = (cards: Card[]) => {
	// 表示も比較順に合わせて worst->best（降順）で統一
	const sorted = [...cards].sort((a, b) => rankRazzValue[b.rank] - rankRazzValue[a.rank]);
	return sorted.map((c) => c.rank).join("");
};

export const formatStud8Showdown = (hi: Evaluate7Result, low: EvaluateLowResult | null) => {
	const hiPart = `HI:${formatCards5(hi.hand)}`;
	const lowPart = low ? `LOW(8+):${formatLowRanks5WorstToBest(low.hand)}(${formatCards5(low.hand)})` : "LOW(8+):-";
	return `${hiPart} / ${lowPart}`;
};

// ------------------------------
// ポット分配（最小単位 = ante）
// - まず半分ずつ（ante単位）
// - 端数(ante単位の1ユニット)は Hi 側へ
// - さらに split で出る端数も ante 単位で、seat昇順に 1 unit ずつ配る（決定論）
// ------------------------------
export type Stud8Payout = Record<SeatIndex, number>;

const addPayout = (payout: Stud8Payout, seat: SeatIndex, amount: number) => {
	payout[seat] = (payout[seat] ?? 0) + amount;
};

const assertMultipleOfUnit = (amount: number, unit: number, label: string) => {
	if (amount % unit !== 0) {
		throw new Error(`${label} must be multiple of unit(${unit}): got ${amount}`);
	}
};

const splitAmongWinnersByUnit = (amount: number, winners: SeatIndex[], unit: number): Stud8Payout => {
	assertMultipleOfUnit(amount, unit, "amount");

	const dist: Stud8Payout = {} as Stud8Payout;
	const sorted = [...winners].sort((a, b) => a - b);

	const amountUnits = amount / unit;
	const baseUnits = Math.floor(amountUnits / sorted.length);
	let remUnits = amountUnits % sorted.length;

	for (const s of sorted) addPayout(dist, s, baseUnits * unit);
	for (let i = 0; i < sorted.length && remUnits > 0; i += 1) {
		addPayout(dist, sorted[i], unit);
		remUnits -= 1;
	}
	return dist;
};

export const computeStud8Payout = (
	pot: number,
	stakes: Stakes,
	hiWinners: SeatIndex[],
	lowWinners: SeatIndex[] | null,
): Stud8Payout => {
	const payout: Stud8Payout = {} as Stud8Payout;
	const unit = stakes.ante;

	assertMultipleOfUnit(pot, unit, "pot");

	// Low が成立しないなら Hi 総取り
	if (!lowWinners || lowWinners.length === 0) {
		const dist = splitAmongWinnersByUnit(pot, hiWinners, unit);
		for (const [k, v] of Object.entries(dist)) addPayout(payout, Number(k) as SeatIndex, v);
		return payout;
	}

	// ante単位で半分ずつ。奇数ユニットなら Hi に +1 unit
	const potUnits = pot / unit; // integer
	const hiUnits = Math.floor((potUnits + 1) / 2); // ceil
	const lowUnits = Math.floor(potUnits / 2); // floor

	const hiPot = hiUnits * unit;
	const lowPot = lowUnits * unit;

	const hiDist = splitAmongWinnersByUnit(hiPot, hiWinners, unit);
	const lowDist = splitAmongWinnersByUnit(lowPot, lowWinners, unit);

	for (const [k, v] of Object.entries(hiDist)) addPayout(payout, Number(k) as SeatIndex, v);
	for (const [k, v] of Object.entries(lowDist)) addPayout(payout, Number(k) as SeatIndex, v);

	return payout;
};

// ------------------------------
// GameState に適用する例（showdown）
// - logs に Hi/Low 両方出す
// - stack に払い戻し
// - winnerIndexes は「何か(Hi or Low)を取った seat」をまとめて入れる
//
// 注意: ActionType に showdown が無いので action:"x" を仮置き
// ------------------------------
export const resolveShowdownStud8 = (state: GameState): GameState => {
	const gs = structuredClone(state);

	const entries = gs.players.map((p) => ({
		seat: p.seat,
		alive: p.alive,
		cards7: [...p.holeCards, ...p.upcards],
	}));

	const { hiWinners, lowWinners, hiBest, lowBest } = pickStud8WinnersFromPlayers(entries);

	const payout = computeStud8Payout(gs.pot, gs.stakes, hiWinners, lowWinners);

	// 払い戻し反映
	for (const p of gs.players) {
		p.stack += payout[p.seat] ?? 0;
	}

	gs.pot = 0;
	gs.handFinished = true;

	// winnerIndexes（互換のためまとめる）
	const winnersSet = new Set<SeatIndex>([...hiWinners, ...(lowWinners ?? [])]);
	gs.winnerIndexes = [...winnersSet].sort((a, b) => a - b) as SeatIndex[];

	// 各プレイヤーのショーダウン表記（Hi/Low 両方）
	for (const p of entries) {
		const hi = evaluateHandHi(p.cards7);
		const low = evaluateHandStud8Low(p.cards7);

		gs.logs.push({
			street: "showdown",
			seat: p.seat,
			action: "x", // 仮置き
			cards: formatStud8Showdown(hi, low),
			amount: payout[p.seat] ?? 0,
		} satisfies ActionLog);
	}

	// サマリ（任意）
	gs.logs.push({
		street: "showdown",
		seat: hiWinners[0] ?? 0,
		action: "x",
		cards: `WIN HI:${hiWinners.join(",")} / LOW:${lowWinners ? lowWinners.join(",") : "-"}`,
	} satisfies ActionLog);

	// 参考：ベストハンドをどこかで使うなら返してもOK（ここでは未使用）
	void hiBest;
	void lowBest;

	return gs;
};
