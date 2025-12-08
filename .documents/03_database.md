# データベース設計（Stud Trainer）

## 1. 使用DB

### 現状（v0）
- 種類:
  - なし（ゲーム状態はすべてブラウザメモリ上 / Zustand に保持）
- 理由:
  - オフライン・単一ユーザー前提のシミュレーション用途であり、常時保存は必須でないため
  - 実装コストを下げるため、まずは DB を導入しない

### 将来（v1 以降の候補）
- 種類候補:
  - SQLite / PostgreSQL（例えば Supabase / Neon 等のマネージドサービス）
- 理由（簡易）:
  - ハンド履歴・スタック推移・アクションログの蓄積・分析を行いたい場合に有用
  - Web アプリからの利用実績が多く、ホスティングも容易

## 2. テーブル一覧（将来拡張案）

| テーブル名 | 目的                               |
|-----------|------------------------------------|
| users     | ユーザーアカウント（任意機能）     |
| game_logs | 各ハンドの結果・メタ情報           |
| actions   | 各ハンド中のアクション詳細         |
| players   | ハンドごとのプレイヤー情報スナップ |

## 3. テーブル定義（例）

### users
| カラム名   | 型        | 必須 | 備考       |
|-----------|-----------|------|------------|
| id        | uuid      | YES  | PK         |
| name      | varchar   | YES  | ユーザー名 |
| created_at| timestamp | YES  | 作成日時   |

### game_logs
| カラム名     | 型        | 必須 | 備考                                    |
|-------------|-----------|------|-----------------------------------------|
| id          | uuid      | YES  | PK                                      |
| user_id     | uuid      | NO   | users.id（匿名利用を許容する場合は任意）|
| created_at  | timestamp | YES  | ハンド終了時間                          |
| game_type   | varchar   | YES  | StudHi / Razz / Stud8 等               |
| player_count| int       | YES  | プレイヤー数                            |
| winner_seats| json      | YES  | 勝者の seat 配列                        |
| pot         | int       | YES  | 最終 pot                                |
| metadata    | json      | NO   | 任意メタ情報                            |

### actions
| カラム名   | 型        | 必須 | 備考                           |
|-----------|-----------|------|--------------------------------|
| id        | uuid      | YES  | PK                             |
| log_id    | uuid      | YES  | game_logs.id への FK           |
| street    | varchar   | YES  | "3rd" / "4th" / ... / "showdown" |
| seat      | int       | YES  | 行動プレイヤー seat           |
| action    | varchar   | YES  | "f" / "c" / "b" / "r" / "bri" など |
| amount    | int       | NO   | ベット額                       |
| created_at| timestamp | YES  | アクション発生時間             |

### players
| カラム名     | 型      | 必須 | 備考                             |
|-------------|---------|------|----------------------------------|
| id          | uuid    | YES  | PK                               |
| log_id      | uuid    | YES  | game_logs.id への FK             |
| seat        | int     | YES  | 0-origin or 1-origin seat index  |
| name        | varchar | YES  | プレイヤー名                     |
| start_stack | int     | YES  | ハンド開始時スタック             |
| end_stack   | int     | YES  | ハンド終了時スタック             |

## 4. リレーション（簡易）

```text
users (1) ---- (N) game_logs

game_logs (1) ---- (N) actions
game_logs (1) ---- (N) players
```

この DB 設計はあくまで将来のログ蓄積を想定したものであり、現時点の実装では利用しない。
必要になったタイミングでスキーマを詳細化・更新する。
