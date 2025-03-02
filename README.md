# スプリント早わかりカレンダー

## プロジェクト概要

このプロジェクトは、アジャイル開発における各スプリントの期間（開発期間、QA期間、リリース日）を視覚的に表示するWebアプリケーションです。エンジニアが現在のスプリント状況や次のリリース日を一目で確認できるようにすることを目的としています。

## 機能要件

- スプリント開始曜日を設定可能（リリース日は自動的に同じ曜日に設定）
- 開発期間/QA期間の日数をクエリパラメーターとして設定可能
- 各期間がカレンダー上で色分け表示される
- 今日の日付が特別な色で強調表示される
- 今日の日付の月が表示月数の真ん中になるように表示
- 月をまたぐスプリント表示に対応
- 同じ日付に複数のスプリント期間を表示可能
  - 開発期間とQA期間が重なる場合の視覚的な表現（縦分割表示）
  - スプリントIDによる期間の識別（リリース日ベース：YYYY/MM/DD形式）
  - ホバー時のツールチップでスプリント詳細を表示
  - 期間の重なり順序の最適化（リリース日の日付順）
- レスポンシブデザインによる様々なデバイスでの閲覧対応
  - モバイル端末での長押しによるスプリント詳細表示
  - 画面サイズに応じた最適な表示レイアウト
  - 複数期間の視認性を確保した表示サイズの調整

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

スプリントの開始日から各期間（開発期間、QA期間、リリース日）を計算し、期間の重なりを管理するロジックを提供します。

```typescript
// スプリント期間の基本情報
interface SprintPeriod {
  developmentStart: Date;
  developmentEnd: Date;
  qaStart: Date;
  qaEnd: Date;
  releaseDate: Date;
  nextSprintStart: Date;
  sprintId?: string; // リリース日ベースのスプリント識別子
}

// 特定の日付における期間情報
interface PeriodInfo {
  type: 'development' | 'qa' | 'release' | 'none';
  sprintId: string;
  startDate: Date;
}

// スプリント期間の計算
function calculateSprintPeriods(startDate: Date, devDays: number, qaDays: number): SprintPeriod;

// 複数スプリントの取得（期間の重なりを考慮）
function getNextNSprints(startDate: Date, devDays: number, qaDays: number, count: number): SprintPeriod[];
function getPreviousNSprints(startDate: Date, devDays: number, qaDays: number, count: number): SprintPeriod[];

// 日付ごとの期間情報の取得
function getAllPeriodsForDate(date: Date, sprintPeriods: SprintPeriod[]): PeriodInfo[];
```

#### 期間計算の仕組み

1. スプリントの開始
   - 各スプリントは前のスプリントの開発期間の半分の時点で開始
   - これにより自然な形で期間の重なりが発生

2. リリース日の決定
   - QA期間終了後の直近のスプリント開始曜日をリリース日に設定
   - リリース日は必ずスプリント開始曜日と同じ曜日

3. 期間の重なり管理
   - 同じ日に複数の期間が存在する場合は優先順位付けて表示
   - 開発期間 → QA期間 → リリース の順で表示
   - 各期間にスプリントIDを付与して識別可能に

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
interface PeriodInfo {
  type: 'development' | 'qa' | 'release' | 'none';
  sprintId: string;
  startDate: Date;
}

interface CalendarDay {
  date: Date;
  isToday: boolean;
  periods: PeriodInfo[]; // 複数の期間を保持
}

interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

// カレンダー生成と表示
function generateCalendarMonths(config: CalendarConfig, periods: SprintPeriod[]): CalendarMonth[];
function renderCalendar(container: HTMLElement, months: CalendarMonth[]): void;

// 期間計算
function getAllPeriodsForDate(date: Date, sprintPeriods: SprintPeriod[]): PeriodInfo[];
```

## データフロー

1. ユーザーがページにアクセス
   - URLパラメータを解析して設定を取得
   - パラメータがない場合はデフォルト値を使用

2. スプリント期間の計算
   - 設定に基づいて複数のスプリント期間を計算
   - 各日付に対して該当する全ての期間を取得
   - スプリントIDを割り当てて期間を識別

3. カレンダーの生成
   - 表示する月数分のカレンダーデータを生成
   - 各日付に複数の期間情報を割り当て
   - 期間の重なりを考慮したデータ構造の構築

4. UI表示
   - カレンダーをレンダリング
   - 複数期間の視覚的な表現（縦分割表示）
   - 期間タイプごとに色分け
   - スプリントIDのツールチップ表示
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