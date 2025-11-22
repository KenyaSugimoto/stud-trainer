// components/GameSetupScreen.tsx
import { useState } from "react";
import type { GameType } from "../types/types";

type Props = {
	onStart: (playerCount: number, gameType: GameType) => void;
};

export const GameSetupScreen = ({ onStart }: Props) => {
	const [playerCount, setPlayerCount] = useState(2);
	const [gameType, setGameType] = useState<GameType>("STUD_HI");

	return (
		<div className="p-4 flex flex-col items-center gap-6 text-center">
			<h1 className="text-xl font-bold">ゲーム設定</h1>

			{/* プレイ人数 */}
			<div className="flex flex-col items-center gap-2">
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

			{/* ゲームタイプ */}
			<div className="flex flex-col items-center gap-2">
				<p className="font-semibold">ゲームタイプ</p>
				<select
					value={gameType}
					onChange={(e) => setGameType(e.target.value as GameType)}
					className="border p-2 rounded"
				>
					<option value="STUD_HI">Seven Card Stud (Hi)</option>
					<option value="RAZZ">Razz</option>
					<option value="STUD8">Seven Card Stud 8-or-Better</option>
				</select>
			</div>

			{/* スタート */}
			<button
				type="button"
				onClick={() => onStart(playerCount, gameType)}
				className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
			>
				START
			</button>
		</div>
	);
};
