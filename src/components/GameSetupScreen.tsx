// components/GameSetupScreen.tsx
import { useState } from "react";
import { DEFAULT_INITIAL_STACK } from "../consts/consts";
import { useGameStore } from "../hooks/useGameStore";
import type { GameType } from "../types/types";

export const GameSetupScreen = () => {
	const startGame = useGameStore((s) => s.startGame);

	const [playerCount, setPlayerCount] = useState(2);
	const [gameType, setGameType] = useState<GameType>("STUD_HI");
	const [initialStack, setInitialStack] = useState(DEFAULT_INITIAL_STACK);

	return (
		<div className="p-4 flex flex-col items-center gap-6 text-center">
			<h1 className="text-xl font-bold">ゲーム設定</h1>

			<div>
				<p className="font-semibold">プレイ人数</p>
				<select
					value={playerCount}
					onChange={(e) => setPlayerCount(Number(e.target.value))}
					className="border p-2 rounded"
				>
					{Array.from({ length: 7 }, (_, i) => i + 2).map((n) => (
						<option key={n} value={n}>
							{n}人
						</option>
					))}
				</select>
			</div>

			<div>
				<p className="font-semibold">ゲームタイプ</p>
				<select
					value={gameType}
					onChange={(e) => setGameType(e.target.value as GameType)}
					className="border p-2 rounded"
				>
					<option value="STUD_HI">Seven Card Stud (Hi)</option>
					<option value="RAZZ">Razz</option>
					<option value="STUD_8">Stud Hi-Lo 8-or-Better</option>
				</select>
			</div>

			{/* ★ 初期スタック */}
			<div>
				<p className="font-semibold">初期スタック</p>
				<input
					type="number"
					value={initialStack}
					onChange={(e) => setInitialStack(Number(e.target.value))}
					className="border p-2 rounded w-32 text-center"
					min={1}
				/>
			</div>

			<button
				type="button"
				onClick={() => startGame(playerCount, gameType, initialStack)}
				className="px-4 py-2 bg-blue-600 text-white rounded"
			>
				START
			</button>
		</div>
	);
};
