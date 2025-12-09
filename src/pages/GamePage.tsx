// SCR-002: ゲーム画面
// 参照: .documents/06_ui_brief.md
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { PokerTable } from "../components/poker/PokerTable";
import { useGameStore } from "../hooks/useGameStore";
import { useToast } from "../hooks/useToast";
import type { ActionType } from "../types/types";
import { getActionLabel, getAllowedActions } from "../utils/actor";

export const GamePage = () => {
	const navigate = useNavigate();
	const { gameState, applyAction, startNextHand } = useGameStore();
	const { showSuccess, showError } = useToast();

	// Assumption: ゲーム状態に基づく画面状態の判定
	const currentScreenState = useMemo<"loading" | "empty" | "error" | "success">(() => {
		if (!gameState) return "empty";
		if (gameState.street === "3rd" && gameState.bringInIndex === null) return "loading";
		// Assumption: エラー状態の判定は将来的に拡張可能
		return "success";
	}, [gameState]);

	// 現在のアクター
	const actor = gameState?.currentActorIndex ?? null;

	// 現在のアクターが実行可能なアクションを取得
	const allowed = useMemo<ActionType[]>(() => {
		if (!gameState) return [];
		if (gameState.street === "3rd" && gameState.bringInIndex === null) return [];
		if (gameState.currentActorIndex === null) return [];
		return getAllowedActions(gameState, gameState.currentActorIndex);
	}, [gameState]);

	// empty状態
	if (currentScreenState === "empty") {
		return (
			<EmptyState
				title="ゲームが開始されていません"
				message="ゲーム設定から新規ゲームを開始してください"
				action={
					<button
						type="button"
						onClick={() => navigate("/")}
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						ゲーム設定へ
					</button>
				}
			/>
		);
	}

	// loading状態
	if (currentScreenState === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner message="ハンドを準備中…" />
			</div>
		);
	}

	// error状態（将来の拡張用）
	if (currentScreenState === "error") {
		return (
			<ErrorState
				message="ゲーム状態に不整合が発生しました。ゲームをリセットしてください。"
				action={
					<button
						type="button"
						onClick={() => {
							useGameStore.getState().reset();
							navigate("/");
						}}
						className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						ゲームをリセット
					</button>
				}
			/>
		);
	}

	// success状態（通常表示）
	if (!gameState || actor === null) {
		return (
			<ErrorState
				message="ゲーム状態が取得できませんでした"
				action={
					<button
						type="button"
						onClick={() => navigate("/")}
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						ゲーム設定へ戻る
					</button>
				}
			/>
		);
	}

	const handleAction = (action: ActionType) => {
		try {
			applyAction(action, actor);
		} catch (error) {
			showError("アクションの実行に失敗しました");
			console.error("Action error:", error);
		}
	};

	const handleNextHand = () => {
		try {
			startNextHand();
			showSuccess("次のハンドを開始しました");
		} catch (error) {
			showError("次のハンドの開始に失敗しました");
			console.error("Next hand error:", error);
		}
	};

	return (
		<div className="h-full bg-gray-900 overflow-hidden flex flex-col">
			<div className="w-full mx-auto px-4 py-2 flex-1 flex flex-col min-h-0">
				{/* ポーカーテーブル - 残りのスペースを占有、ただしアクションボタン群のスペースを確保 */}
				<div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
					<PokerTable gameState={gameState} currentActorIndex={actor} />
				</div>

				{/* アクションボタン群 - shrink-0で固定サイズ、確実に表示されるように */}
				{!gameState.handFinished && (
					<div className="shrink-0 bg-gray-800 rounded-lg shadow-md p-3 mt-2 mb-2 border border-gray-700">
						<h3 className="text-base md:text-lg font-semibold text-white mb-2 md:mb-3">アクション</h3>
						<div className="flex flex-wrap gap-2">
							{allowed.length > 0 ? (
								allowed.map((action) => (
									<button
										key={action}
										type="button"
										onClick={() => handleAction(action)}
										className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
									>
										{getActionLabel(action)}
									</button>
								))
							) : (
								<p className="text-gray-400 text-sm md:text-base">アクション待機中...</p>
							)}
						</div>
					</div>
				)}

				{/* Next Hand ボタン - shrink-0で固定サイズ、確実に表示されるように */}
				{gameState.handFinished && (
					<div className="shrink-0 bg-gray-800 rounded-lg shadow-md p-3 mt-2 mb-2 border border-gray-700">
						<button
							type="button"
							onClick={handleNextHand}
							className="w-full px-4 py-3 md:px-6 md:py-4 bg-green-600 text-white text-base md:text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
						>
							Next Hand
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
