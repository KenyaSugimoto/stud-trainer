// SCR-001: ゲーム設定画面
// 参照: .documents/06_ui_brief.md
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "../components/common/ErrorState";
import { FormField, Input, Select } from "../components/common/FormField";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { DEFAULT_INITIAL_STACK } from "../consts/consts";
import { useGameStore } from "../hooks/useGameStore";
import { useToast } from "../hooks/useToast";
import type { GameType } from "../types/types";
import type { ScreenState } from "../types/ui";

export const GameSetupPage = () => {
	const navigate = useNavigate();
	const startGame = useGameStore((s) => s.startGame);
	const { showError, showSuccess } = useToast();

	const [screenState, setScreenState] = useState<ScreenState>("success");
	const [playerCount, setPlayerCount] = useState(2);
	const [gameType, setGameType] = useState<GameType>("STUD_HI");
	const [initialStack, setInitialStack] = useState(DEFAULT_INITIAL_STACK);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Assumption: バリデーション関数
	const validate = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (playerCount < 2 || playerCount > 7) {
			newErrors.playerCount = "プレイヤー数は2〜7人の範囲で入力してください";
		}

		if (initialStack <= 0) {
			newErrors.initialStack = "初期スタックは1以上を入力してください";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleStartGame = () => {
		if (!validate()) {
			setScreenState("error");
			return;
		}

		setScreenState("loading");

		try {
			// Assumption: ゲーム開始処理は同期的だが、将来的に非同期になる可能性を考慮
			startGame(playerCount, gameType, initialStack);
			showSuccess("ゲームを開始しました");
			setScreenState("success");
			navigate("/game");
		} catch (error) {
			setScreenState("error");
			showError("ゲームの開始に失敗しました");
			console.error("Game start error:", error);
		}
	};

	// loading状態
	if (screenState === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner message="ハンドを初期化中…" />
			</div>
		);
	}

	// error状態
	if (screenState === "error" && Object.keys(errors).length === 0) {
		return (
			<ErrorState
				message="ゲーム状態に不整合が発生しました。ゲームをリセットしてください。"
				action={
					<button
						type="button"
						onClick={() => {
							setScreenState("success");
							setErrors({});
						}}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
					>
						再試行
					</button>
				}
			/>
		);
	}

	// success状態（通常表示）
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-2xl mx-auto px-4 py-8">
				{/* ページタイトル */}
				<div className="mb-8 text-center">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">ゲーム設定</h2>
				</div>

				{/* フォーム */}
				<div className="bg-white rounded-lg shadow-md p-6 space-y-6">
					<FormField label="プレイヤー数" error={errors.playerCount} required>
						<Select
							value={playerCount.toString()}
							onChange={(e) => {
								setPlayerCount(Number(e.target.value));
								setErrors((prev) => ({ ...prev, playerCount: "" }));
							}}
							options={Array.from({ length: 6 }, (_, i) => ({
								value: (i + 2).toString(),
								label: `${i + 2}人`,
							}))}
							error={errors.playerCount}
						/>
					</FormField>

					<FormField label="種目" required>
						<Select
							value={gameType}
							onChange={(e) => setGameType(e.target.value as GameType)}
							options={[
								{ value: "STUD_HI", label: "Seven Card Stud (Hi)" },
								{ value: "RAZZ", label: "Razz" },
								{ value: "STUD_8", label: "Stud Hi-Lo 8-or-Better" },
							]}
						/>
					</FormField>

					<FormField label="初期スタック" error={errors.initialStack} required>
						<div className="flex gap-2">
							<Input
								type="number"
								value={initialStack}
								onChange={(e) => {
									setInitialStack(Number(e.target.value));
									setErrors((prev) => ({ ...prev, initialStack: "" }));
								}}
								min={1}
								className="flex-1"
								error={errors.initialStack}
							/>
							{/* Assumption: プリセットボタン */}
							<button
								type="button"
								onClick={() => setInitialStack(10000)}
								className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
							>
								10k
							</button>
							<button
								type="button"
								onClick={() => setInitialStack(20000)}
								className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
							>
								20k
							</button>
							<button
								type="button"
								onClick={() => setInitialStack(30000)}
								className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
							>
								30k
							</button>
						</div>
					</FormField>

					{/* エラー表示 */}
					{Object.keys(errors).length > 0 && (
						<div className="bg-red-50 border border-red-200 rounded p-4">
							<p className="text-sm text-red-600">入力内容を確認してください</p>
						</div>
					)}
				</div>

				{/* 主CTA */}
				<div className="mt-6">
					<button
						type="button"
						onClick={handleStartGame}
						className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						ゲーム開始
					</button>
				</div>
			</div>
		</div>
	);
};
