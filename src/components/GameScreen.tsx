import type { GameState } from "../types/types";

type Props = {
	gameState: GameState;
	setGameState: (gs: GameState) => void;
};

export const GameScreen = ({ gameState }: Props) => {
	return (
		<div className="p-4">
			<h2 className="font-bold text-lg">Stud vs CPU</h2>
			<div>Players: {gameState.playerCount}</div>
			<div>Street: {gameState.street}</div>
			<div>Pot: {gameState.pot}</div>

			<h3 className="mt-4 font-semibold">Player List</h3>
			<ul>
				{gameState.players.map((p) => (
					<li key={p.seat}>
						{p.seat}: {p.name} {p.isHuman && "(You)"}
					</li>
				))}
			</ul>
		</div>
	);
};
