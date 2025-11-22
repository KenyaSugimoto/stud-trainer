// test/helpers.ts

import { DEFAULT_STAKES } from "../../consts/consts";
import type { GameState, PlayerState, SeatIndex } from "../../types/types";

export function makePlayer(seat: SeatIndex): PlayerState {
	return {
		seat,
		name: `P${seat}`,
		isHuman: false,
		alive: true,
		stack: 100,
		holeCards: [],
		upcards: [],
		lastAction: null,
		totalBetThisRound: 0,
	};
}

export function makeState(players: PlayerState[], street: GameState["street"] = "3rd"): GameState {
	return {
		playerCount: players.length,
		players,
		street,
		deck: [],
		pot: 0,
		bringInIndex: null,
		currentActorIndex: 0,
		actionsThisStreet: [],
		logs: [],
		handFinished: false,
		winnerIndexes: null,
		gameType: "STUD_HI",
	};
}
