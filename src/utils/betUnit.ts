import type { ActionType, GameState } from "../types/types";

export const getStreetBetUnit = (state: GameState): number => {
	const { street, stakes } = state;

	// showdown ではベットが発生しないので0で返す
	if (street === "showdown") {
		return 0;
	}

	// 3rd, 4thは smallBet
	if (street === "3rd" || street === "4th") {
		return stakes.smallBet;
	}

	// 5th〜7th は bigBet
	return stakes.bigBet;
};

// 指定プレイヤーがコールする金額を取得
export const getToCall = (state: GameState, seat: number): number => {
	const maxBet = Math.max(...state.players.map((p) => p.totalBetThisRound));
	const me = state.players[seat];
	return Math.max(0, maxBet - me.totalBetThisRound);
};

export const calcBetAmount = (state: GameState, seat: number, actionType: ActionType): number => {
	const { stakes, street } = state;

	// showdown ではベットが発生しないので0で返す
	if (street === "showdown") {
		return 0;
	}

	const toCall = getToCall(state, seat);
	const unit = getStreetBetUnit(state);

	// --- 共通: check / fold は 0 ---
	if (actionType === "x" || actionType === "f") {
		return 0;
	}

	// --- call ---
	if (actionType === "c") {
		return toCall;
	}

	// --- 3rd の bring-in / complete ---
	if (street === "3rd") {
		if (actionType === "bri") {
			// 純粋に bring-in 分
			return stakes.bringIn;
		}

		if (actionType === "comp") {
			return stakes.smallBet;
		}
	}

	// --- 通常の bet（誰もまだ bet していない前提）---
	if (actionType === "b") {
		// 3rd の 「最初の complete」もここで unit=smallBet として扱える
		return unit;
	}

	// --- raise ---
	if (actionType === "r") {
		// まずコール額で揃え、さらに unit 分を上乗せ
		return toCall + unit;
	}

	// 想定外
	return 0;
};

// ante 回収
export const collectAntes = (state: GameState): GameState => {
	const gs: GameState = structuredClone(state);

	const ante = gs.stakes?.ante ?? 0;
	if (ante <= 0) return gs;

	let pot = gs.pot;

	gs.players = gs.players.map((p) => {
		if (!p.alive) return p;

		// スタックが足りない場合も一応ケア
		const pay = Math.min(p.stack, ante);

		if (pay <= 0) return p;

		pot += pay;

		return {
			...p,
			stack: p.stack - pay,
		};
	});

	gs.pot = pot;
	return gs;
};
