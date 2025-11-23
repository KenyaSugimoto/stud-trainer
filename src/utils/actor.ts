import {
	AGGRESSIVE_ACTIONS,
	MAX_RAISES_PER_STREET,
	rankHiValue,
	rankRazzValue,
	suitValue,
	TERMINAL_ACTIONS_VS_BET,
} from "../consts/consts";
import type { ActionType, Card, GameState, GameType, SeatIndex } from "../types/types";
import { computeBringIn } from "./bringIn";

// 次のアクターのseat indexを取得
export const getNextActorIndex = (state: GameState): SeatIndex => {
	const count = state.playerCount;
	let idx = state.currentActorIndex;
	let checked = 0;

	while (checked < count) {
		idx = (idx + 1) % count;
		checked++;
		if (state.players[idx].alive) return idx as SeatIndex;
	}

	throw new Error("次のアクターが見つかりません（全プレイヤーが非アクティブ）");
};

// 指定したプレイヤーが実行可能なアクションを取得
export const getAllowedActions = (state: GameState, seat: number): ActionType[] => {
	const street = state.street;
	const actions = state.actionsThisStreet;

	// bring-in 判定
	const isBringIn = street === "3rd" && state.bringInIndex === seat;

	// このストリートの誰かが bet / comp / raise をしたか？
	const someoneBet = actions.some((a) => AGGRESSIVE_ACTIONS.includes(a.type));
	// raise 回数カウント
	const raiseCount = actions.filter((a) => AGGRESSIVE_ACTIONS.includes(a.type)).length;
	const canRaise = raiseCount < MAX_RAISES_PER_STREET;

	// -----------------------
	// 3RD STREET（bring-in ラウンド）
	// -----------------------
	if (street === "3rd") {
		if (isBringIn) {
			// bring-in プレイヤーは bri / comp のみ
			return ["bri", "comp"];
		}

		// bring-in 以外は fold / call / raise（raise は5betまで）
		const base: ActionType[] = ["f", "c"];
		if (canRaise) base.push("r");
		return base;
	}

	// -----------------------
	// 4TH〜7TH STREET（通常ベット）
	// -----------------------
	if (!someoneBet) {
		// 誰もベットしていない → check / bet
		return ["x", "b"];
	}

	// すでに bet / raise がある → fold / call / raise（5betまで）
	const base: ActionType[] = ["f", "c"];
	if (canRaise) base.push("r");
	return base;
};

export const getActionLabel = (action: ActionType): string => {
	switch (action) {
		case "f":
			return "Fold";
		case "c":
			return "Call";
		case "b":
			return "Bet";
		case "r":
			return "Raise";
		case "x":
			return "Check";
		case "bri":
			return "Bring-In";
		case "comp":
			return "Complete";
		default:
			return "";
	}
};

// ストリート終了判定
export const shouldEndStreet = (state: GameState): boolean => {
	const actions = state.actionsThisStreet;
	const players = state.players;

	// --- 1. 一人を除いて全員 fold → ハンド終わり ---
	const alive = players.filter((p) => p.alive);
	if (alive.length <= 1) return true;

	// --- 2. aggressor（最後にレイズした player）を探す ---
	const latestAggressiveAction = [...actions].reverse().find((a) => AGGRESSIVE_ACTIONS.includes(a.type));

	let aggressorSeat: SeatIndex | null = null;
	if (latestAggressiveAction) {
		aggressorSeat = latestAggressiveAction.player;

		// アグレッサー以外のアクティブプレイヤー全員がcall or foldしていたらストリート終了
		for (const p of alive) {
			if (p.seat === aggressorSeat) continue; // aggressor 自身は除外

			// このプレイヤーの最後のアクションを取得
			const playerLastAction = actions.filter((a) => a.player === p.seat).slice(-1)[0];
			// アクションしていない → 終了しない
			if (!playerLastAction) return false;
			// fold / call 以外のアクション → 終了しない
			if (!TERMINAL_ACTIONS_VS_BET.includes(playerLastAction.type)) {
				return false;
			}
		}
	}

	// 全ての alive プレイヤーが最後のベットに対して c か f 済み
	return true;
};

// アップカードの強さスコア作成
const calcUpcardScore = (cards: Card[], gameType: GameType): number => {
	if (cards.length === 0) return -99999; // ありえない

	const rankValue = gameType === "RAZZ" ? rankRazzValue : rankHiValue;

	// ルール：
	// stud Hi / stud8 → 強い方が大きい値
	// Razz → 弱い方が大きい値にしたいのでマイナスをかける
	// ここでは統一のため「大きいほど強い」という基準で揃える

	let bestScore = -99999;
	for (const c of cards) {
		let score = rankValue[c.rank] * 10 + suitValue[c.suit];

		// Razz → 強さが逆なので rankValue 小さい方を大きくしたい
		if (gameType === "RAZZ") {
			// Razz では小さい rank が強い → マイナスにして逆転
			score = 1000 - score;
		}

		if (score > bestScore) bestScore = score;
	}

	return bestScore;
};

export const getFirstActorForStreet = (state: GameState): SeatIndex => {
	const { gameType, players, street } = state;

	// 3rd Street → bring-in が最初
	if (street === "3rd") {
		return state.bringInIndex ? state.bringInIndex : computeBringIn(state);
	}

	let bestSeat = -1;
	let bestScore = -999999;

	for (const p of players) {
		if (!p.alive) continue;

		const upcards = p.upcards; // 3rd~6th の upcard がすべて入ってる
		const score = calcUpcardScore(upcards, gameType);

		if (score > bestScore) {
			bestScore = score;
			bestSeat = p.seat;
		}
	}

	if (bestSeat === -1) {
		throw new Error("ストリート開始アクター判定: 有効なプレイヤーが見つかりません");
	}

	return bestSeat as SeatIndex;
};
