import type { GameState, GameType, PlayerState } from "../types/types";
import { createDeck, shuffle } from "./card";

export const initGameState = (playerCount: number, gameType: GameType): GameState => {
	const deck = shuffle(createDeck());

	const players: PlayerState[] = [];
	for (let seat = 0; seat < playerCount; seat++) {
		const isHuman = seat === 0;

		players.push({
			seat: seat as SeatIndex,
			name: isHuman ? "You" : `CPU${seat}`,
			isHuman,
			alive: true,
			stack: 100,
			holeCards: [],
			upcards: [],
			lastAction: null,
			totalBetThisRound: 0,
		});
	}

	const gs: GameState = {
		playerCount,
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
