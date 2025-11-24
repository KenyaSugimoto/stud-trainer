import "./App.css";
import { GameScreen } from "./components/GameScreen";
import { GameSetupScreen } from "./components/GameSetupScreen";
import { useGameStore } from "./hooks/useGameStore";

export default function App() {
	const gameState = useGameStore((s) => s.gameState);

	return <div className="min-h-screen">{!gameState ? <GameSetupScreen /> : <GameScreen />}</div>;
}
