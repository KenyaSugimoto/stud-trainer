import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppHeader } from "./components/common/AppHeader";
import { ConfirmDialog } from "./components/common/ConfirmDialog";
import { ToastContainer } from "./components/common/Toast";
import { useConfirmDialog } from "./hooks/useConfirmDialog";
import { useToast } from "./hooks/useToast";
import { GamePage } from "./pages/GamePage";
import { GameSetupPage } from "./pages/GameSetupPage";
import "./App.css";

// Assumption: グローバルなToastとConfirmDialogの管理
// 将来的にはContext APIで管理することも検討可能
export default function App() {
	const { toasts, closeToast } = useToast();
	const { dialog, closeDialog } = useConfirmDialog();

	// Assumption: ConfirmDialogは現状未使用だが、将来的にリセット確認などで使用予定

	return (
		<BrowserRouter>
			<div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
				<AppHeader />
				<main className="flex-1 min-h-0 overflow-hidden">
					<Routes>
						<Route path="/" element={<GameSetupPage />} />
						<Route path="/game" element={<GamePage />} />
					</Routes>
				</main>
				<ToastContainer toasts={toasts} onClose={closeToast} />
				<ConfirmDialog dialog={dialog} onClose={closeDialog} />
			</div>
		</BrowserRouter>
	);
}
