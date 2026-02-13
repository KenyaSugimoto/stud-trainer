# UI実装サマリー

## 実装日
2024年（実装日を記入）

## 実装内容

### 1. ルーティング設定
- **react-router-dom** を追加
- `/` - ゲーム設定画面（SCR-001）
- `/game` - ゲーム画面（SCR-002）

### 2. 共通コンポーネント

#### ナビゲーション
- `AppHeader` - ヘッダーコンポーネント（戻るボタン、ゲームタイプ表示、リセットボタン）

#### フォーム
- `FormField` - フォームフィールドのラッパー（ラベル、エラー表示対応）
- `Input` - テキスト入力コンポーネント（エラー状態対応）
- `Select` - セレクトボックスコンポーネント（エラー状態対応）

#### フィードバック
- `Toast` / `ToastContainer` - トースト通知コンポーネント
- `ConfirmDialog` - 確認ダイアログコンポーネント

#### 状態表示
- `LoadingSpinner` - ローディングスピナー
- `EmptyState` - 空状態表示コンポーネント
- `ErrorState` - エラー状態表示コンポーネント

### 3. カスタムフック

- `useToast` - トースト通知の管理
- `useConfirmDialog` - 確認ダイアログの管理

### 4. 型定義

- `src/types/ui.ts` - UI関連の型定義
  - `ScreenState` - 画面状態（loading/empty/error/success）
  - `Toast` / `ToastType` - トースト通知の型
  - `ConfirmDialogState` - 確認ダイアログの型
  - `FormError` - フォームエラーの型

### 5. モックデータ

- `src/mocks/gameMocks.ts` - ゲーム関連のモックデータ
  - `createMockPlayers` - モックプレイヤー生成
  - `createMockGameState` - モックゲーム状態生成

### 6. ページコンポーネント

#### SCR-001: ゲーム設定画面
- **ファイル**: `src/pages/GameSetupPage.tsx`
- **状態管理**: loading/empty/error/success を実装
- **機能**:
  - プレイヤー数選択（2〜7人）
  - ゲームタイプ選択（STUD_HI / RAZZ / STUD_8）
  - 初期スタック入力（プリセットボタン付き）
  - バリデーション
  - ゲーム開始処理

#### SCR-002: ゲーム画面
- **ファイル**: `src/pages/GamePage.tsx`
- **状態管理**: loading/empty/error/success を実装
- **機能**:
  - ゲーム情報表示（ストリート、ポット、ブリングイン）
  - 現在アクター表示
  - プレイヤー情報一覧
  - アクションボタン群
  - ショーダウン表示
  - Next Hand ボタン

### 7. 画面仕様書

- `.documents/07_screen_specs/SCR-001_game_setup.md` - ゲーム設定画面の仕様
- `.documents/07_screen_specs/SCR-002_game.md` - ゲーム画面の仕様

## ファイル構成

```
src/
├── App.tsx                    # ルーティング設定
├── components/
│   ├── common/
│   │   ├── AppHeader.tsx
│   │   ├── Toast.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── FormField.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   └── index.ts
│   ├── GameSetupScreen.tsx    # 既存（今後削除予定）
│   └── GameScreen.tsx         # 既存（今後削除予定）
├── pages/
│   ├── GameSetupPage.tsx      # SCR-001
│   └── GamePage.tsx           # SCR-002
├── hooks/
│   ├── useGameStore.tsx       # 既存
│   ├── useToast.tsx          # 新規
│   └── useConfirmDialog.tsx   # 新規
├── types/
│   ├── types.ts               # 既存
│   └── ui.ts                  # 新規
└── mocks/
    └── gameMocks.ts           # 新規
```

## 実装方針

### 状態管理
- 各画面で `loading` / `empty` / `error` / `success` の4状態を管理
- Zustand の `useGameStore` と連携

### エラーハンドリング
- フォームバリデーションエラーはインライン表示
- 重大なエラーは `ErrorState` コンポーネントで表示

### ユーザビリティ
- モバイルファーストデザイン
- タップターゲットは最小44px
- キーボード操作にも対応（フォーカス管理）

## 今後の拡張予定

1. **ポーカーテーブルUI**
   - PokerStars風のテーブル表示
   - 円形レイアウトの座席配置

2. **アクションログ表示**
   - `StreetActionLog` コンポーネント
   - ストリートごとの折りたたみ表示

3. **カード表示の改善**
   - Hole Cards の表示/非表示制御
   - カードの視覚的表現

## 注意事項

- 既存の `GameSetupScreen.tsx` と `GameScreen.tsx` は残していますが、新しいページコンポーネントに移行済み
- `App.tsx` はルーティングベースに変更済み
- 実データ未接続でも操作イメージが伝わる状態を実現

