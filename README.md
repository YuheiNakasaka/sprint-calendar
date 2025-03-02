# スプリント早わかりカレンダー

https://sprint-calendar.pages.dev/

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
- カレンダーの日付には最大3件のスプリントの重複までしか発生しない
- レスポンシブデザインによる様々なデバイスでの閲覧対応
  - モバイル端末での長押しによるスプリント詳細表示
  - 画面サイズに応じた最適な表示レイアウト
  - 複数期間の視認性を確保した表示サイズの調整

## 機能要件を満たした場合の表示の具体例
- 開発期間が7日間、QA期間も7日間、スプリント開始曜日が火曜日の場合
  - 2025/03/11(火)リリースのスプリント
    - 2025/02/25(火)に開発を開始すると2025/03/03(月)までは開発期間です
    - 2025/03/04(火)からQA期間が開始され2025/03/10(月)まではQA期間です
    - 2025/03/11(火)がリリース日になります
  - 2025/03/18(火)リリースのスプリント
    - 2025/03/04(火)に開発を開始すると2025/03/10(月)までは開発期間です
    - 2025/03/11(火)からQA期間が開始され2025/03/17(月)まではQA期間です
    - 2025/03/18(火)がリリース日になります
  - 2025/03/25(火)リリースのスプリント
    - 2025/03/11(火)に開発を開始すると2025/03/17(月)までは開発期間です
    - 2025/03/18(火)からQA期間が開始され2025/03/24(月)まではQA期間です
    - 2025/03/25(火)がリリース日になります

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

## 実装詳細

### 1. スプリント期間計算モジュール

スプリントの開始日から各期間（開発期間、QA期間、リリース日）を計算し、期間の重なりを管理するロジックを提供します。

```typescript
// スプリント期間の基本情報
interface SprintPeriod {
  developmentStart: Date;  // 開発期間の開始日
  developmentEnd: Date;    // 開発期間の終了日
  qaStart: Date;           // QA期間の開始日
  qaEnd: Date;             // QA期間の終了日
  releaseDate: Date;       // リリース日
  sprintId: string;        // スプリントを識別するためのID（リリース日ベース）
}

// 特定の日付における期間情報
interface PeriodInfo {
  type: 'development' | 'qa' | 'release' | 'none';  // 期間タイプ
  sprintId: string;        // スプリントID
  releaseDate: Date;       // リリース日
  tooltip: string;         // ツールチップに表示する情報
}

// スプリント期間の計算
function calculateSprintPeriods(startDate: Date, devDays: number, qaDays: number): SprintPeriod;

// 複数スプリントの取得
function getNextNSprints(startDate: Date, devDays: number, qaDays: number, count: number): SprintPeriod[];
function getPreviousNSprints(startDate: Date, devDays: number, qaDays: number, count: number): SprintPeriod[];

// 日付ごとの期間情報の取得
function getAllPeriodsForDate(date: Date, sprintPeriods: SprintPeriod[]): PeriodInfo[];
```

#### 期間計算の仕組み

1. スプリントの開始
   - 各スプリントは指定された開始曜日に開始
   - 次のスプリントは前のスプリントのQA開始日と同じ日に開発を開始
   - これにより自然な形で期間の重なりが発生

2. リリース日の決定
   - QA期間終了日の翌日がリリース日
   - 例：開発期間7日間、QA期間7日間の場合、開発開始から15日目がリリース日

3. 期間の重なり管理
   - 同じ日に複数の期間が存在する場合は優先順位付けて表示
   - 開発期間 → QA期間 → リリース の順で表示
   - 各期間にスプリントIDを付与して識別可能に
   - 最大3つまでの期間を表示（リリース日の昇順でソート）

### 2. URLパラメータ処理モジュール

クエリパラメータを解析し、アプリケーションの設定に変換します。

```typescript
interface CalendarConfig {
  startDayOfWeek: number;    // スプリント開始曜日（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
  developmentDays: number;   // 開発期間の日数
  qaDays: number;            // QA期間の日数
  displayMonths: number;     // 表示する月数
  centerDate?: Date;         // 中央に表示する日付（指定しない場合は今日）
}

function parseUrlParams(url: URL): CalendarConfig;
function generateUrlWithParams(config: CalendarConfig): string;
```

URLパラメータの例：
- `startDay=2` - スプリント開始曜日を火曜日に設定
- `dev=7` - 開発期間を7日間に設定
- `qa=7` - QA期間を7日間に設定
- `months=3` - 表示月数を3ヶ月に設定

### 3. カレンダー表示コンポーネント

月ごとのカレンダーを生成し、各日付のスプリント期間タイプを視覚的に表示します。

```typescript
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
```

カレンダー表示の特徴：
- 今日の日付が特別な色で強調表示
- 各期間タイプ（開発期間、QA期間、リリース日）が異なる色で表示
- 同じ日に複数の期間がある場合は縦に分割して表示
- ホバー時にツールチップでスプリント詳細を表示
- モバイル端末では長押しでツールチップを表示

### 4. スプリント情報表示コンポーネント

現在の設定に基づいた複数のスプリント期間の詳細情報を表示します。

```typescript
function displaySprintInfo(startDayOfWeek: number, devDays: number, qaDays: number): void;
```

スプリント情報表示の特徴：
- 直近の3つのスプリント期間を表示
- 各スプリントの開発期間、QA期間、リリース日を具体的な日付と曜日で表示
- README.mdの「機能要件を満たした場合の表示の具体例」と同じ形式で表示

## データフロー

1. ユーザーがページにアクセス
   - URLパラメータを解析して設定を取得
   - パラメータがない場合はデフォルト値を使用（開始曜日：火曜日、開発期間：7日間、QA期間：7日間、表示月数：3ヶ月）

2. スプリント期間の計算
   - 設定に基づいて複数のスプリント期間を計算
   - 各日付に対して該当する全ての期間を取得
   - スプリントIDを割り当てて期間を識別（リリース日ベース：YYYY/MM/DD形式）

3. カレンダーの生成
   - 表示する月数分のカレンダーデータを生成
   - 各日付に複数の期間情報を割り当て
   - 期間の重なりを考慮したデータ構造の構築（最大3つまでの期間を表示）

4. UI表示
   - カレンダーをレンダリング
   - スプリント情報セクションを表示
   - 複数期間の視覚的な表現（縦分割表示）
   - 期間タイプごとに色分け
   - ツールチップでスプリント詳細を表示
   - 今日の日付を強調表示
   - 凡例を表示

5. ユーザー操作
   - 設定変更時にURLパラメータを更新
   - 新しい設定でカレンダーとスプリント情報を再生成

## 実装済み機能

### 1. スプリント期間計算
- スプリント開始曜日を設定可能
- 開発期間/QA期間の日数を設定可能
- リリース日はQA期間終了日の翌日に自動設定
- 次のスプリントは前のスプリントのQA開始日と同じ日に開発を開始

### 2. カレンダー表示
- 各期間がカレンダー上で色分け表示
- 今日の日付が特別な色で強調表示
- 今日の日付の月が表示月数の真ん中になるように表示
- 月をまたぐスプリント表示に対応
- 同じ日付に複数のスプリント期間を表示可能（最大3つまで）
- 開発期間とQA期間が重なる場合の視覚的な表現（縦分割表示）
- スプリントIDによる期間の識別（リリース日ベース：YYYY/MM/DD形式）
- ホバー時のツールチップでスプリント詳細を表示
- 期間の重なり順序の最適化（リリース日の日付順）

### 3. スプリント情報表示
- 現在の設定に基づいた3つのスプリント期間の詳細情報を表示
- 各スプリントの開発期間、QA期間、リリース日を具体的な日付と曜日で表示
- README.mdの「機能要件を満たした場合の表示の具体例」と同じ形式で表示

### 4. レスポンシブデザイン
- 様々なデバイスでの閲覧に対応
- モバイル端末での長押しによるスプリント詳細表示
- 画面サイズに応じた最適な表示レイアウト
- 複数期間の視認性を確保した表示サイズの調整

## 使用方法

アプリケーションは以下のURLパラメータを受け付けます：

- `startDay`: スプリント開始曜日（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
- `dev`: 開発期間の日数
- `qa`: QA期間の日数
- `months`: 表示する月数（デフォルト: 3）
- `center`: 中央に表示する日付（YYYY-MM-DD形式、指定しない場合は今日）

例: `https://sprint-calendar.example.com/?startDay=2&dev=7&qa=7&months=3`

この例では、以下の設定でカレンダーが表示されます：
- スプリント開始曜日: 火曜日
- 開発期間: 7日間
- QA期間: 7日間
- 表示月数: 3ヶ月

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
