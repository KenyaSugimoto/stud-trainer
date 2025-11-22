import { MAX_RAISES_PER_STREET } from "../consts/consts";
import type { ActionType, GameState } from "../types/types";

// 次のアクターのseat indexを取得
export const getNextActorIndex = (state: GameState): number => {
	const count = state.playerCount;
	let idx = state.currentActorIndex;

	while (true) {
		idx = (idx + 1) % count;
		if (state.players[idx].alive) return idx;
	}
};

// 指定したアクションを適用して新しいGameStateを返す
export const applyAction = (state: GameState, action: ActionType, amount?: number): GameState => {
	const actor = state.currentActorIndex;
	const player = state.players[actor];

	// --- プレイヤーの情報更新 ---
	player.lastAction = action;

	if (action === "f") {
		player.alive = false;
	}

	if (action === "c" || action === "b" || action === "r" || action === "bri" || action === "comp") {
		state.pot += amount ?? 0;
		player.totalBetThisRound += amount ?? 0;
	}

	// --- ログを残す ---
	state.logs.push({
		street: state.street,
		seat: actor,
		action,
		cards: "", // 後で表記に差し替える
		size: amount,
	});

	// --- 1人以下になったらハンド終了 ---
	const aliveCount = state.players.filter((p) => p.alive).length;
	if (aliveCount <= 1) {
		const winner = aliveCount === 1 ? state.players.findIndex((p) => p.alive) : null;
		return {
			...state,
			handFinished: true,
			winnerIndexes: winner !== null ? [winner] : null,
		};
	}

	// --- 次のアクターへ ---
	const next = getNextActorIndex(state);

	return {
		...state,
		players: [...state.players],
		currentActorIndex: next,
	};
};

// 指定したプレイヤーが実行可能なアクションを取得
export const getAllowedActions = (state: GameState, seat: number): ActionType[] => {
	const street = state.street;
	const actions = state.actionsThisStreet;

	// bring-in 判定
	const isBringIn = street === "3rd" && state.bringInIndex === seat;

	// このストリートの誰かが bet / comp / raise をしたか？
	const someoneBet = actions.some((a) => a.type === "b" || a.type === "comp" || a.type === "r");

	// raise の回数（bet/comp/r を全部カウント）
	const raiseCount = actions.filter((a) => a.type === "b" || a.type === "comp" || a.type === "r").length;
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
