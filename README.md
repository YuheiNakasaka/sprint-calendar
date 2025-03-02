# スプリント早わかりカレンダー

## プロジェクト概要

このプロジェクトは、アジャイル開発における各スプリントの期間（開発期間、QA期間、リリース日）を視覚的に表示するWebアプリケーションです。エンジニアが現在のスプリント状況や次のリリース日を一目で確認できるようにすることを目的としています。

## 機能要件

- 開発期間/QA期間/リリース日をクエリパラメーターとして設定可能
- 各期間がカレンダー上で色分け表示される
- 今日の日付が特別な色で強調表示される
- 月をまたぐスプリント表示に対応
- レスポンシブデザインによる様々なデバイスでの閲覧対応

## 技術スタック

- **言語**: TypeScript
- **ビルドツール**: Vite
- **フロントエンド**: HTML, CSS, TypeScript (フレームワークなし)
- **テスト**: Vitest
- **デプロイ先**: Cloudflare Pages / Amazon S3 (静的ホスティング)

## アーキテクチャ設計

### 全体構造

このアプリケーションは、完全にクライアントサイドで動作する静的Webアプリケーションとして設計されています：

- **クライアントサイド**:
  - URLパラメータ解析
  - カレンダー表示ロジック
  - スプリント期間計算
  - UI表示・操作

### ディレクトリ構造

```
sprint-calendar/
├── README.md                # プロジェクト説明
├── index.html               # エントリーポイントHTML
├── package.json             # npm設定
├── vite.config.ts           # Vite設定
├── tsconfig.json            # TypeScript設定
├── src/
│   ├── lib/                 # 共通ライブラリ
│   │   ├── date-utils.ts    # 日付操作ユーティリティ
│   │   ├── sprint-calc.ts   # スプリント期間計算
│   │   └── params.ts        # URLパラメータ処理
│   ├── components/          # UIコンポーネント
│   │   ├── calendar.ts      # カレンダー表示
│   │   └── legend.ts        # 凡例表示
│   ├── styles/              # スタイルシート
│   │   └── main.css         # メインスタイル
│   └── main.ts              # アプリケーションエントリーポイント
├── public/                  # 静的アセット
│   └── favicon.ico          # ファビコン
└── tests/                   # テスト
    ├── date-utils.test.ts
    ├── sprint-calc.test.ts
    └── params.test.ts
```

## コンポーネント設計

### 1. スプリント期間計算モジュール

スプリントの開始日から各期間（開発期間、QA期間、リリース日）を計算するロジックを提供します。

```typescript
interface SprintPeriod {
  developmentStart: Date;
  developmentEnd: Date;
  qaStart: Date;
  qaEnd: Date;
  releaseDate: Date;
  nextSprintStart: Date;
}

function calculateSprintPeriods(startDate: Date, devDays: number, qaDays: number): SprintPeriod;
function getNextNSprints(startDate: Date, devDays: number, qaDays: number, count: number): SprintPeriod[];
function getCurrentPeriodType(date: Date, sprintPeriod: SprintPeriod): 'development' | 'qa' | 'release' | 'none';
```

### 2. URLパラメータ処理モジュール

クエリパラメータを解析し、アプリケーションの設定に変換します。

```typescript
interface CalendarConfig {
  startDate: Date;
  developmentDays: number;
  qaDays: number;
  displayMonths: number;
}

function parseUrlParams(url: URL): CalendarConfig;
function generateUrlWithParams(config: CalendarConfig): string;
```

### 3. カレンダー表示コンポーネント

月ごとのカレンダーを生成し、各日付のスプリント期間タイプを視覚的に表示します。

```typescript
interface CalendarDay {
  date: Date;
  isToday: boolean;
  periodType: 'development' | 'qa' | 'release' | 'none';
}

interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

function generateCalendarMonths(config: CalendarConfig, periods: SprintPeriod[]): CalendarMonth[];
function renderCalendar(container: HTMLElement, months: CalendarMonth[]): void;
```

## データフロー

1. ユーザーがページにアクセス
   - URLパラメータを解析して設定を取得
   - パラメータがない場合はデフォルト値を使用

2. スプリント期間の計算
   - 設定に基づいて複数のスプリント期間を計算
   - 現在の日付がどの期間に該当するかを判定

3. カレンダーの生成
   - 表示する月数分のカレンダーデータを生成
   - 各日付にスプリント期間タイプを割り当て

4. UI表示
   - カレンダーをレンダリング
   - 期間タイプごとに色分け
   - 今日の日付を強調表示
   - 凡例を表示

5. ユーザー操作
   - 設定変更時にURLパラメータを更新
   - 新しい設定でカレンダーを再生成

## 実装計画

### フェーズ1: 基本設計と環境構築
- プロジェクト構造の作成
- Viteプロジェクトの初期化
- TypeScript設定
- 開発環境のセットアップ

### フェーズ2: コアロジックの実装
- 日付操作ユーティリティの実装
- スプリント期間計算ロジックの実装
- URLパラメータ処理の実装
- 単体テストの作成

### フェーズ3: UIコンポーネント実装
- HTMLの基本構造作成
- カレンダー表示ロジックの実装
- 期間タイプによる色分け表示
- 今日の日付のハイライト表示

### フェーズ4: スタイリングとレスポンシブ対応
- CSSスタイリングの実装
- レスポンシブデザイン対応
- 視覚的フィードバックの改善

### フェーズ5: ビルドと最適化
- Vitestによるテスト実行
- ビルド設定の最適化
- パフォーマンス改善
- 静的ホスティング用のデプロイ設定

## 使用方法

アプリケーションは以下のURLパラメータを受け付けます：

- `start`: スプリント開始日（YYYY-MM-DD形式）
- `dev`: 開発期間の日数
- `qa`: QA期間の日数
- `months`: 表示する月数（デフォルト: 3）

例: `https://sprint-calendar.example.com/?start=2025-01-14&dev=7&qa=7&months=2`

## 開発方法

### 環境構築

```bash
# プロジェクトのクローン
git clone https://github.com/yourusername/sprint-calendar.git
cd sprint-calendar

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### ビルドとデプロイ

```bash
# プロジェクトのビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# Cloudflare Pagesへのデプロイ例
# (Cloudflare Pagesと連携済みのGitHubリポジトリにプッシュするだけ)
git push origin main
```