import { useMemo, useState } from "react";
import type { ActionLog, Street } from "../../types/types";
import { getActionLabel } from "../../utils/actor";

interface StreetActionLogProps {
	logs: ActionLog[];
	players: Array<{ name: string }>;
}

// ストリートの表示順序
const STREET_ORDER: Street[] = ["3rd", "4th", "5th", "6th", "7th", "showdown"];

export const StreetActionLog = ({ logs, players }: StreetActionLogProps) => {
	const [expandedStreets, setExpandedStreets] = useState<Set<Street>>(new Set(["3rd"])); // デフォルトで3rdを展開

	// ストリートごとにログをグループ化
	const logsByStreet = useMemo(() => {
		const grouped: Record<Street, ActionLog[]> = {
			"3rd": [],
			"4th": [],
			"5th": [],
			"6th": [],
			"7th": [],
			showdown: [],
		};

		logs.forEach((log) => {
			if (grouped[log.street]) {
				grouped[log.street].push(log);
			}
		});

		return grouped;
	}, [logs]);

	const toggleStreet = (street: Street) => {
		setExpandedStreets((prev) => {
			const next = new Set(prev);
			if (next.has(street)) {
				next.delete(street);
			} else {
				next.add(street);
			}
			return next;
		});
	};

	const expandAll = () => {
		setExpandedStreets(new Set(STREET_ORDER));
	};

	const collapseAll = () => {
		setExpandedStreets(new Set());
	};

	// ログが存在するストリートのみ表示
	const streetsWithLogs = STREET_ORDER.filter((street) => logsByStreet[street].length > 0);

	if (streetsWithLogs.length === 0) {
		return (
			<div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
				<h3 className="text-lg font-semibold text-white mb-2">アクションログ</h3>
				<p className="text-sm text-gray-400">アクションログがありません</p>
			</div>
		);
	}

	return (
		<div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-white">アクションログ</h3>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={expandAll}
						className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
					>
						全て展開
					</button>
					<button
						type="button"
						onClick={collapseAll}
						className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
					>
						全て折りたたみ
					</button>
				</div>
			</div>

			<div className="space-y-2">
				{streetsWithLogs.map((street) => {
					const streetLogs = logsByStreet[street];
					const isExpanded = expandedStreets.has(street);

					return (
						<div key={street} className="border border-gray-700 rounded-lg overflow-hidden">
							{/* ストリートヘッダー */}
							<button
								type="button"
								onClick={() => toggleStreet(street)}
								className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 flex items-center justify-between transition-colors"
							>
								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold text-white">{street} Street</span>
									<span className="text-xs text-gray-400">({streetLogs.length}件)</span>
								</div>
								<svg
									className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<title>{isExpanded ? "折りたたむ" : "展開する"}</title>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{/* ログ一覧 */}
							{isExpanded && (
								<div className="px-4 py-2 bg-gray-800">
									{streetLogs.length > 0 ? (
										<div className="space-y-1">
											{streetLogs.map((log, idx) => {
												const player = players[log.seat];
												return (
													<div key={`${street}-${log.seat}-${idx}`} className="flex items-center gap-2 text-sm">
														<span className="font-medium text-gray-200 min-w-[80px]">
															{player?.name ?? `Seat ${log.seat}`}
														</span>
														<span className="text-gray-300">{getActionLabel(log.action)}</span>
														{log.amount !== undefined && log.amount > 0 && (
															<span className="text-blue-400 font-semibold ml-auto">
																${log.amount.toLocaleString()}
															</span>
														)}
														{log.cards && log.cards.length > 0 && (
															<span className="text-xs text-gray-400 ml-2">{log.cards}</span>
														)}
													</div>
												);
											})}
										</div>
									) : (
										<p className="text-sm text-gray-400">アクションなし</p>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};
