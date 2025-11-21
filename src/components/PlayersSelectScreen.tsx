import { useState } from "react";

type Props = {
	onStart: (playerCount: number) => void;
};

export const PlayersSelectScreen = ({ onStart }: Props) => {
	const [count, setCount] = useState(2);

	return (
		<div className="p-4 flex flex-col items-center gap-6 text-center">
			<h1 className="text-xl font-bold">プレイ人数を選択</h1>

			<select value={count} onChange={(e) => setCount(Number(e.target.value))} className="border p-2 rounded">
				{Array.from({ length: 7 }, (_, i) => i + 2).map((n) => (
					<option key={n} value={n}>
						{n}人
					</option>
				))}
			</select>

			<button
				type="button"
				onClick={() => onStart(count)}
				className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
			>
				START
			</button>
		</div>
	);
};
