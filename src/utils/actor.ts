import {
	AGGRESSIVE_ACTIONS,
	BET_ACTIONS,
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
	const raiseCount = actions.filter((a) => a.type === "r").length;
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
	const alivePlayers = players.filter((p) => p.alive);
	const street = state.street;

	// alivePlayersが一人以下ならストリート終了
	if (alivePlayers.length <= 1) return true;

	// ショウダウンなら常にストリート終了
	if (street === "showdown") return true;

	//-----------------------------------------
	// 1) BET_ACTION が一度もないケース
	//-----------------------------------------
	const lastBetIndex = (() => {
		for (let i = actions.length - 1; i >= 0; i--) {
			if (BET_ACTIONS.includes(actions[i].type)) return i;
		}
		// 一度も bet/raise/comp/bri がない
		return -1;
	})();

	// 🔹 3rd Street ではチェックラウンドが存在しないので「一斉チェック」はありえない
	if (street === "3rd" && lastBetIndex === -1) {
		return false;
	}

	// 🔹 4th〜7th で、誰もベットせず「全員チェック」の場合だけ終了
	if (street !== "3rd" && lastBetIndex === -1) {
		const actedSet = new Set(actions.map((a) => a.player));
		return alivePlayers.every((p) => actedSet.has(p.seat));
	}

	//-----------------------------------------
	// 2) ここからベット or レイズ or complete/bri があるケース
	//-----------------------------------------
	const lastAggressor = actions[lastBetIndex].player;

	// 最後のベット以降のアクションを抜き出す
	const afterBet = actions.slice(lastBetIndex + 1);

	for (const p of alivePlayers) {
		if (p.seat === lastAggressor) continue;

		const playerActs = afterBet.filter((a) => a.player === p.seat);

		if (playerActs.length === 0) {
			// このプレイヤーはまだベットに対して行動していない
			return false;
		}

		const lastAction = playerActs[playerActs.length - 1];
		if (!TERMINAL_ACTIONS_VS_BET.includes(lastAction.type)) {
			// fold or call で完了していない
			return false;
		}
	}

	// 全員アグレッサーのベットに対して c/f した → ストリート終了
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
