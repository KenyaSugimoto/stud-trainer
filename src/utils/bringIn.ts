import { rankHiValue, rankRazzValue, suitValue } from "../consts/consts";
import type { Card, GameState, PlayerState, SeatIndex } from "../types/types";

const upcardOf = (p: PlayerState): Card => p.upcards[0];

/**
 * bring-inを支払うべきプレイヤーのseatインデックスを計算する
 * - Stud Hi / Stud8: 最も弱いアップカード（低いrank、同じなら弱いsuit）
 * - Razz: 最も高いアップカード（高いrank、同じなら強いsuit）
 * @param state - 現在のゲーム状態
 * @returns bring-inプレイヤーのseatインデックス（該当者がいない場合は0）
 */
export const computeBringIn = (state: GameState): SeatIndex => {
	const alivePlayers = state.players.filter((p) => p.alive);

	let best: PlayerState | null = null;

	for (const p of alivePlayers) {
		const card = upcardOf(p);
		if (!card) continue;

		if (!best) {
			best = p;
			continue;
		}

		// 比較対象のカード
		const currentCard = card;
		const bestCard = upcardOf(best);

		// 現在のゲームに応じた rank 値を取得
		const rankVal = state.gameType === "RAZZ" ? rankRazzValue : rankHiValue;

		const currentRank = rankVal[currentCard.rank];
		const bestRank = rankVal[bestCard.rank];

		// 比較ロジック
		const shouldReplace =
			state.gameType === "RAZZ"
				? currentRank > bestRank || (currentRank === bestRank && suitValue[currentCard.suit] > suitValue[bestCard.suit])
				: currentRank < bestRank ||
					(currentRank === bestRank && suitValue[currentCard.suit] < suitValue[bestCard.suit]);

		// bring-in候補 更新
		if (shouldReplace) {
			best = p;
		}
	}

	if (!best) {
		throw new Error("bring-in判定: 有効なプレイヤーが見つかりません");
	}
	return best.seat;
};
