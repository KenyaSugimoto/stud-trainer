import { rankHiValue, rankRazzValue } from "../consts/consts";
import type { ActionType, Evaluate7Result, GameState, HandRank, SeatIndex } from "../types/types";
import { getAllowedActions } from "./actor";
import { evaluateHandHi, isBetterHand } from "./evaluateStudHi";
import { type Evaluate7RazzResult, evaluateHandRazz, isBetterLowScore } from "./evaluatorRazz";
import { evaluateHandStud8 } from "./evaluatorStud8";

/**
 * 3rd StreetでのCPUアクション決定
 * アップカードの強さで判断（Stud Hiなら最強、Razzなら最弱）
 */
const decideAction3rd = (gameState: GameState, seat: SeatIndex): ActionType => {
	const player = gameState.players[seat];
	const allowedActions = getAllowedActions(gameState, seat);
	const gameType = gameState.gameType;

	// bring-inの場合はbring-inを実行
	if (allowedActions.includes("bri")) {
		return "bri";
	}

	// アップカードの強さを評価
	if (player.upcards.length === 0) {
		// アップカードがない場合はcall（安全策）
		return allowedActions.includes("c") ? "c" : allowedActions[0];
	}

	const upcard = player.upcards[0];
	let upcardValue: number;

	if (gameType === "RAZZ") {
		// Razz: 低いカードが強い
		upcardValue = rankRazzValue[upcard.rank];
	} else {
		// Stud Hi / Stud8: 高いカードが強い
		upcardValue = rankHiValue[upcard.rank];
	}

	// 他のプレイヤーのアップカードと比較
	const otherPlayers = gameState.players.filter((p) => p.seat !== seat && p.alive && p.upcards.length > 0);
	let isStrongest = true;
	let isWeakest = true;

	for (const other of otherPlayers) {
		const otherUpcard = other.upcards[0];
		let otherValue: number;

		if (gameType === "RAZZ") {
			otherValue = rankRazzValue[otherUpcard.rank];
		} else {
			otherValue = rankHiValue[otherUpcard.rank];
		}

		if (gameType === "RAZZ") {
			// Razz: 低い方が強い
			if (otherValue < upcardValue) isStrongest = false;
			if (otherValue > upcardValue) isWeakest = false;
		} else {
			// Stud Hi: 高い方が強い
			if (otherValue > upcardValue) isStrongest = false;
			if (otherValue < upcardValue) isWeakest = false;
		}
	}

	// アクション決定
	if (isStrongest && allowedActions.includes("comp")) {
		return "comp";
	}
	if (isStrongest && allowedActions.includes("r")) {
		return "r";
	}
	if (isWeakest && allowedActions.includes("f")) {
		return "f";
	}
	// デフォルトはcall
	return allowedActions.includes("c") ? "c" : allowedActions[0];
};

/**
 * 4th以降でのCPUアクション決定
 * ボードの強さで判断し、相手のボードと比較して「強→raise / 中→call / 弱→fold」
 */
const decideAction4thPlus = (gameState: GameState, seat: SeatIndex): ActionType => {
	const player = gameState.players[seat];
	const allowedActions = getAllowedActions(gameState, seat);
	const gameType = gameState.gameType;

	// 自分のボードを評価（見えているカードのみ）
	const visibleCards = [...player.holeCards.filter(() => true), ...player.upcards];
	if (visibleCards.length < 5) {
		// カードが5枚未満の場合は評価できないのでcall
		return allowedActions.includes("c") ? "c" : allowedActions[0];
	}

	// 自分のボードの強さを評価（最良の5枚を選ぶ）
	let myEvaluation: Evaluate7Result | Evaluate7RazzResult;
	if (gameType === "STUD_HI") {
		myEvaluation = evaluateHandHi(visibleCards);
	} else if (gameType === "RAZZ") {
		myEvaluation = evaluateHandRazz(visibleCards);
	} else if (gameType === "STUD_8") {
		const stud8Eval = evaluateHandStud8(visibleCards);
		myEvaluation = stud8Eval.hi;
	} else {
		// デフォルトはSTUD_HI
		myEvaluation = evaluateHandHi(visibleCards);
	}
	if (
		gameType === "RAZZ"
			? (myEvaluation as Evaluate7RazzResult).category === null
			: (myEvaluation as Evaluate7Result).rank === null
	) {
		// 評価できない場合はcall
		return allowedActions.includes("c") ? "c" : allowedActions[0];
	}

	// 他のプレイヤーのボードと比較
	const otherPlayers = gameState.players.filter((p) => p.seat !== seat && p.alive);
	let strongerCount = 0;
	let weakerCount = 0;
	let equalCount = 0;

	for (const other of otherPlayers) {
		const otherVisibleCards = [...other.holeCards.filter(() => true), ...other.upcards];
		if (otherVisibleCards.length < 5) {
			// カードが5枚未満の場合は無視
			continue;
		}

		let otherEvaluation: Evaluate7Result | Evaluate7RazzResult;
		if (gameType === "STUD_HI") {
			otherEvaluation = evaluateHandHi(otherVisibleCards);
		} else if (gameType === "RAZZ") {
			otherEvaluation = evaluateHandRazz(otherVisibleCards);
		} else if (gameType === "STUD_8") {
			const stud8Eval = evaluateHandStud8(otherVisibleCards);
			otherEvaluation = stud8Eval.hi;
		} else {
			otherEvaluation = evaluateHandHi(otherVisibleCards);
		}

		if (
			gameType === "RAZZ"
				? (otherEvaluation as Evaluate7RazzResult).category === null
				: (otherEvaluation as Evaluate7Result).rank === null
		) {
			// 評価できない場合は無視
			continue;
		}

		if (gameType === "RAZZ") {
			// Razz: 低いscoreの方が強い
			if (
				isBetterLowScore((otherEvaluation as Evaluate7RazzResult).score, (myEvaluation as Evaluate7RazzResult).score)
			) {
				strongerCount++;
			} else if (
				isBetterLowScore((myEvaluation as Evaluate7RazzResult).score, (otherEvaluation as Evaluate7RazzResult).score)
			) {
				weakerCount++;
			} else {
				equalCount++;
			}
		} else {
			// STUD_HI, STUD_8: 高いrank/scoreの方が強い
			if (
				isBetterHand(
					(otherEvaluation as Evaluate7Result).rank as HandRank,
					(otherEvaluation as Evaluate7Result).score,
					(myEvaluation as Evaluate7Result).rank as HandRank,
					(myEvaluation as Evaluate7Result).score,
				)
			) {
				strongerCount++;
			} else if (
				isBetterHand(
					(myEvaluation as Evaluate7Result).rank as HandRank,
					(myEvaluation as Evaluate7Result).score,
					(otherEvaluation as Evaluate7Result).rank as HandRank,
					(otherEvaluation as Evaluate7Result).score,
				)
			) {
				weakerCount++;
			} else {
				equalCount++;
			}
		}
	}

	const totalComparisons = strongerCount + weakerCount + equalCount;
	if (totalComparisons === 0) {
		// 比較対象がない場合はcall
		return allowedActions.includes("c") ? "c" : allowedActions[0];
	}

	// 強さの比率で判断
	const strongerRatio = strongerCount / totalComparisons;
	const weakerRatio = weakerCount / totalComparisons;

	// 強い（weakerCountが多い = 自分が強い）→ raise
	if (weakerRatio > 0.5 && allowedActions.includes("r")) {
		return "r";
	}
	if (weakerRatio > 0.5 && allowedActions.includes("comp")) {
		return "comp";
	}
	if (weakerRatio > 0.5 && allowedActions.includes("b")) {
		return "b";
	}

	// 弱い（strongerCountが多い = 自分が弱い）→ fold
	if (strongerRatio > 0.5 && allowedActions.includes("f")) {
		return "f";
	}

	// 中程度 → call
	return allowedActions.includes("c") ? "c" : allowedActions[0];
};

/**
 * CPUのアクションを決定する
 */
export const decideCpuAction = (gameState: GameState, seat: SeatIndex): ActionType => {
	const street = gameState.street;

	if (street === "3rd") {
		return decideAction3rd(gameState, seat);
	} else {
		return decideAction4thPlus(gameState, seat);
	}
};
