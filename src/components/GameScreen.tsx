import type { GameState } from "../types/types";

type Props = {
	gameState: GameState;
	setGameState: (gs: GameState) => void;
};

// TODO: 細かいUIは後で実装
export const GameScreen = ({ gameState }: Props) => {
	return (
		<div className="p-4">
			<h2 className="font-bold text-lg">Stud vs CPU</h2>
			<div>Players: {gameState.playerCount}</div>
			<div>Street: {gameState.street}</div>
			<div>Pot: {gameState.pot}</div>
			<div>Deck Remaining: {gameState.deck.length} cards</div>

			<h3 className="mt-4 font-semibold">Player List</h3>
			<ul>
				{gameState.players.map((p) => (
					<li key={p.seat} className="mt-2">
						<div>
							{p.seat}: {p.name}
						</div>
						<div>Hole: {p.holeCards.map((c) => `${c.rank}${c.suit}`).join(" ")}</div>
						<div>Up: {p.upcards.map((c) => `${c.rank}${c.suit}`).join(" ")}</div>
					</li>
				))}
			</ul>
		</div>
	);
};
