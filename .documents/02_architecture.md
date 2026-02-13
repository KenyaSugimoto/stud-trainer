# アーキテクチャ設計（Stud Trainer）

## 1. 技術スタック
- フロント:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
- 状態管理:
  - Zustand（`useGameStore`）
- バックエンド:
  - なし（初期バージョンはフロントのみで完結）
- DB / ストレージ:
  - なし（必要に応じて localStorage / IndexedDB / 外部DB を将来検討）
- ホスティング:
  - Vercel（静的サイトとしてデプロイ）

## 2. システム構成（簡易）

初期バージョンでは、全処理がブラウザ内で完結するクライアントサイドアプリケーションとする。

- React SPA
  - 状態: Zustand の `useGameStore`
  - UI コンポーネント:
    - `GameSetupScreen`
    - `GameScreen`

構成イメージ:

```
[Browser]
  └─ React App
       ├─ GameSetupScreen
       ├─ GameScreen
       └─ useGameStore (Zustand)
            ├─ gameState
            ├─ startGame()
            ├─ applyAction()
            └─ reset() / startNextHand()
```

外部サービス連携はなし（将来、ログ保存 API の追加を検討）。

## 3. アプリ構造方針

### 3.1 フロント
- コンポーネント例
  - `GameSetupScreen`:
    - プレイヤー数選択
    - ゲームタイプ選択
    - 初期スタック入力
    - `startGame` 呼び出し
  - `GameScreen`:
    - ポーカーテーブル(PokerStars風)の表示
    - 現在のストリート表示
    - 現在アクター・プレイヤー一覧表示
    - アクションボタン群
    - 勝者表示
    - handFinished 時に Next Hand ボタン表示
- 状態管理:
  - `useGameStore` で `GameState` をグローバルに保持
  - `applyAction` にゲーム進行ロジックを集約
- デザインフレームワーク:
  - Tailwind CSS を利用し、簡潔な UI を構築

### 3.2 ゲームロジック / 「疑似 API 層」

バックエンド API は持たないが、ロジックは以下のユーティリティ層に分離する (必要に応じてユーティリティ関数を追加していく)。:

- `utils/actor.ts`
  - `getAllowedActions`
  - `getFirstActorForStreet`
  - `getNextActorIndex`
  - `shouldEndStreet`
- `utils/betUnit.ts`
  - `calcBetAmount`
  - `collectAntes`
- `utils/bringIn.ts`
  - `computeBringIn`
- `utils/card.ts`
  - `deal3rd`
  - 将来のカード配布ロジック
- `utils/evaluateHand.ts`
  - `evaluateHandHi`
  - `isBetterHand`
- `utils/gameState.ts`
  - `initGameState`
  - `goToNextStreet`

これらを「ローカル API」と見なし、UI からは `useGameStore` 経由で呼び出す。

## 4. データフロー（簡易）

典型的なフロー:

1. GameSetupScreen で設定 → `startGame(playerCount, gameType, initialStack)`
2. `useGameStore` 内で `initGameState` → `collectAntes` → `deal3rd` → `computeBringIn`
3. GameScreen が `gameState` を購読し、UI を描画
4. ユーザーがアクションボタンを押す → `applyAction(action, seat)`
5. `applyAction` 内で:
   - ベット計算、スタック・ポット更新
   - アクションログ追加
   - ストリート終了チェック / showdown / handFinished 判定
6. `gameState` 更新 → React が再レンダリング
7. `handFinished === true` になったら Next Hand ボタンを押下 → `startNextHand()`

シーケンス図イメージ:

```text
[GameScreen] --(click: Bet)--> [useGameStore.applyAction]
[useGameStore] --更新--> gameState
[React] --再描画--> GameScreen
```

## 5. ログ / エラーハンドリング方針
- クライアント側ログ:
  - 開発中は console.log でゲーム進行を確認
  - 必要に応じて、`gs.logs` にアクションログを蓄積
- エラーハンドリング:
  - 想定外の状態（不正なアクター、残りプレイヤー 0 など）は原則起こらない設計とし、
    UI 側で許可されていないアクションはボタン表示しない
  - 重大な不整合が発生した場合には、全体リセット（reset）を推奨

## 6. 運用方針
- デプロイ方法:
  - GitHub リポジトリ → Vercel への自動デプロイ
- バージョン管理方針:
  - main ブランチ: 安定版
  - feature ブランチ: 機能追加・検証用
- 将来の運用拡張:
  - ハンド履歴をサーバー保存する場合は、Next.js API Routes / Supabase 等を導入
