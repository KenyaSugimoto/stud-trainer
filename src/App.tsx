import "./App.css";
import { useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { GameSetupScreen } from "./components/GameSetupScreen";
import type { GameState, GameType } from "./types/types";
import { deal3rd } from "./utils/card";
import { initGameState } from "./utils/gameState";

export default function App() {
	const [gameState, setGameState] = useState<GameState | null>(null);

	const handleStart = (playerCount: number, gameType: GameType) => {
		let gs = initGameState(playerCount, gameType);
		gs = deal3rd(gs);
		setGameState(gs);
	};

	return (
		<div className="min-h-screen bg-gray-100 p-4">
			{!gameState ? (
				<GameSetupScreen onStart={handleStart} />
			) : (
				<GameScreen gameState={gameState} setGameState={setGameState} />
			)}
		</div>
	);
}
