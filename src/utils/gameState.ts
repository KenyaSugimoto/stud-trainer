import { DEFAULT_STAKES } from "../consts/consts";
import type { GameState, GameType, PlayerState, SeatIndex } from "../types/types";
import { createDeck, shuffle } from "./card";

export const initGameState = (playerCount: number, gameType: GameType, initialStack: number): GameState => {
	const deck = shuffle(createDeck());

	const players: PlayerState[] = [];
	for (let seat = 0; seat < playerCount; seat++) {
		const isHuman = seat === 0;

		players.push({
			seat: seat as SeatIndex,
			name: isHuman ? "You" : `CPU${seat}`,
			isHuman,
			alive: true,
			stack: initialStack,
			holeCards: [],
			upcards: [],
			lastAction: null,
			totalBetThisRound: 0,
		});
	}

	const gs: GameState = {
		playerCount,
		stakes: DEFAULT_STAKES,
		gameType,
		players,
		street: "3rd",
		deck,
		pot: 0,
		bringInIndex: null,
		currentActorIndex: 0,
		actionsThisStreet: [],
		logs: [],
		handFinished: false,
		winnerIndexes: null,
	};

	return gs;
};

export const goToNextStreet = (state: GameState): GameState => {
	const gs = structuredClone(state);

	const nextMap = {
		"3rd": "4th",
		"4th": "5th",
		"5th": "6th",
		"6th": "7th",
		"7th": "showdown",
		showdown: "showdown",
	} as const;

	const current = gs.street;
	const nextStreet = nextMap[current];

	// showdown の場合は何もしない
	if (nextStreet === "showdown") {
		gs.street = "showdown";
		return gs;
	}

	//------------------------------------
	// ★ 4th〜7th のカード配り
	//------------------------------------

	const deck = gs.deck;
	gs.players.forEach((p) => {
		if (!p.alive) return;

		// 配るカードを1枚取り出す
		const card = deck.shift();
		if (!card) {
			console.error("Deck is empty!");
			return;
		}

		if (nextStreet === "7th") {
			// 7th はダウンカード（hole）
			p.holeCards.push(card);
		} else {
			// 4th〜6th はアップカード
			p.upcards.push(card);
		}
	});

	//------------------------------------
	// ★ Street 移行の共通処理
	//------------------------------------

	// 次のストリートを設定
	gs.street = nextStreet;

	// ベット履歴リセット
	gs.players = gs.players.map((p) => ({
		...p,
		totalBetThisRound: 0,
		lastAction: null,
	}));

	gs.actionsThisStreet = [];

	// デッキ更新
	gs.deck = deck;

	return gs;
};
