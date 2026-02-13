import { Link, useLocation } from "react-router-dom";
import { useGameStore } from "../../hooks/useGameStore";

export const AppHeader = () => {
	const location = useLocation();
	const gameState = useGameStore((s) => s.gameState);
	const reset = useGameStore((s) => s.reset);

	const isGameScreen = location.pathname === "/game";
	const showBackButton = isGameScreen && gameState !== null;

	return (
		<header className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
			<div className="flex items-center gap-4">
				{showBackButton && (
					<Link
						to="/"
						className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
						onClick={() => {
							// Assumption: ゲーム画面から戻る際にリセットするかは要確認
							// 現状はリセットしない（ユーザーが明示的にリセットボタンを押すまで保持）
						}}
					>
						戻る
					</Link>
				)}
				<h1 className="text-lg font-bold">Stud Trainer</h1>
			</div>
			<div className="flex items-center gap-4">
				{isGameScreen && gameState && (
					<button
						type="button"
						onClick={() => {
							if (confirm("ゲームをリセットしますか？")) {
								reset();
								window.location.href = "/";
							}
						}}
						className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
					>
						リセット
					</button>
				)}
			</div>
		</header>
	);
};
