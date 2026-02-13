# SCR-002: ゲーム画面

## 基本情報

- **画面ID**: SCR-002
- **URL**: `/game`
- **目的**: 1 ハンドの進行、アクション入力、勝敗判定、チップ分配を行う
- **主CTA**:
  - handFinished時: 「Next Hand」ボタン
  - 進行中: アクションボタン群（fold / call / bet / raise / complete / bring-in / check など）
- **関連フロー**: FLOW-002, FLOW-003

## 画面状態

### loading
- **表示要素**: スピナー + 「ハンドを準備中…」メッセージ
- **発生条件**:
  - 新ハンド開始時のカード配布中
  - `street === "3rd" && bringInIndex === null` の状態
- **ユーザーアクション**: 進行開始を待つ

### empty
- **表示要素**: 「ゲームが開始されていません」+ 「ゲーム設定へ」ボタン
- **発生条件**: `gameState === null`
- **ユーザーアクション**: ゲーム設定画面 (`/`) へ遷移

### error
- **表示要素**: 「ゲーム状態に不整合が発生しました。ゲームをリセットしてください。」+ 「ゲームをリセット」ボタン
- **発生条件**:
  - アクター不在 / 生存プレイヤー 0
  - アクション実行時のエラー
- **ユーザーアクション**: `reset` 実行 → SCR-001 へ戻る

### success
- **表示要素**: 現在ストリート・アクター・プレイヤー情報・アクションボタンが正常に表示
- **発生条件**: 正常なゲーム進行中
- **ユーザーアクション**: アクション入力、Next Hand で連続プレイ

## UI要素

### ゲーム情報ヘッダー
- ゲームタイプ表示
- 現在のストリート表示（3rd / 4th / ... / showdown）
- ポット合計表示
- ブリングインプレイヤー表示（該当時）

### 現在アクター表示
- アクション中のプレイヤー名を強調表示
- 背景色: 黄色系（`bg-yellow-100 border-yellow-400`）

### ショーダウン表示
- 「Showdown」ラベル
- 勝者表示（複数の場合は Split Pot 表示）
- 背景色: 緑色系（`bg-green-100 border-green-400`）

### プレイヤー情報一覧
各プレイヤーについて表示:
- 名前
- スタック（点数/BB表記）
- Total Bet This Round
- Hole Cards / Upcards（カード表示）
  - Assumption: Hole Cards は自分のみ表示、他プレイヤーのHole Cardsは伏せる（実装は要確認）
- Fold 状態表示（Folded プレイヤーは灰色化）
- アクター中/勝者のハイライト

### アクションボタン群
- 現在アクターにのみ表示
- 許可されたアクションのみ表示（`getAllowedActions` で判定）
- アクション種類: fold / call / bet / raise / bring-in / complete / check

### Next Hand ボタン
- `handFinished === true` の時のみ表示
- 押下で `startNextHand` 実行

## 実装ファイル

- `/src/pages/GamePage.tsx`
- `/src/components/common/LoadingSpinner.tsx`
- `/src/components/common/EmptyState.tsx`
- `/src/components/common/ErrorState.tsx`
- `/src/hooks/useGameStore.tsx`（`applyAction`, `startNextHand` 呼び出し）
- `/src/utils/actor.ts`（`getAllowedActions`）

## 備考

- Assumption: カード表示の詳細（Hole Cards の表示/非表示）は実装時に要確認
- Assumption: ポーカーテーブル風の UI（PokerStars風）は将来的に拡張予定
- Assumption: アクションログの表示は将来的に追加予定（`StreetActionLog` コンポーネント）

