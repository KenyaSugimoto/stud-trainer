# API設計（Stud Trainer）

## 1. 基本方針

### 現状
- ベースURL:
  - なし（API サーバーを持たないため）
- 認証方式:
  - なし（完全ローカルアプリとして動作）

### 将来拡張方針
- ベースURL（例）: `/api/v1`
- 認証方式候補:
  - JWT + セッション管理
  - Supabase Auth などの外部認証
- 用途:
  - ハンド履歴の永続化
  - 複数デバイス間での履歴共有

## 2. API 一覧（将来案）

| メソッド | パス        | 用途                         |
|----------|-------------|------------------------------|
| POST     | /logs       | ハンド結果を保存             |
| GET      | /logs       | 自分のハンド一覧を取得       |
| GET      | /logs/:id   | 1 ハンドの詳細を取得         |
| DELETE   | /logs/:id   | ハンドログの削除             |

## 3. API 詳細テンプレート & 例

### [ハンド結果保存 API]

- メソッド: POST
- パス: `/api/v1/logs`
- 概要: 1 ハンド分の結果とアクション履歴をサーバーに保存する

#### リクエスト（例）

| フィールド      | 型      | 必須 | 説明                                   |
|----------------|---------|------|----------------------------------------|
| gameType       | string  | YES  | StudHi / Razz / Stud8 等              |
| playerCount    | number  | YES  | 参加プレイヤー数                       |
| players        | array   | YES  | 各プレイヤーの開始・終了スタックなど   |
| winnerSeats    | array   | YES  | 勝者の seat 配列                       |
| pot            | number  | YES  | 最終ポット                             |
| actions        | array   | YES  | ストリートごとのアクション履歴         |
| startedAt      | string  | NO   | ハンド開始時刻 (ISO8601)              |
| finishedAt     | string  | NO   | ハンド終了時刻 (ISO8601)              |

JSON 例:

```json
{
  "gameType": "STUD_HI",
  "playerCount": 3,
  "players": [
    { "seat": 0, "name": "P1", "startStack": 20000, "endStack": 21000 },
    { "seat": 1, "name": "P2", "startStack": 20000, "endStack": 19000 },
    { "seat": 2, "name": "P3", "startStack": 20000, "endStack": 20000 }
  ],
  "winnerSeats": [0],
  "pot": 1000,
  "actions": [
    { "street": "3rd", "seat": 1, "action": "bri", "amount": 100 },
    { "street": "3rd", "seat": 2, "action": "c", "amount": 100 }
  ]
}
```

#### レスポンス

| フィールド | 型     | 説明               |
|-----------|--------|--------------------|
| id        | string | 作成されたログ ID  |
| status    | string | `"ok"` 固定想定    |

レスポンス例:

```json
{
  "id": "log_123456",
  "status": "ok"
}
```

#### エラー
- 400: パラメータ不足 / バリデーションエラー
- 401: 認証エラー（将来導入時）
- 500: サーバー内部エラー

---

### [ハンド一覧取得 API]

- メソッド: GET
- パス: `/api/v1/logs`
- 概要: 自分が保存したハンド一覧を取得する

#### クエリパラメータ例

| フィールド | 型     | 必須 | 説明                                    |
|-----------|--------|------|-----------------------------------------|
| limit     | number | NO   | 取得件数上限（デフォルト 50）          |
| offset    | number | NO   | ページング用オフセット                 |

#### レスポンス例

```json
[
  {
    "id": "log_123456",
    "gameType": "STUD_HI",
    "playerCount": 3,
    "winnerSeats": [0],
    "pot": 1000,
    "finishedAt": "2025-12-08T12:34:56Z"
  }
]
```

現状の実装ではこれら API は存在せず、すべてクライアント内で完結する。
ただし、拡張フェーズで容易に追加できるよう、データ構造と設計方針をここに定義しておく。
