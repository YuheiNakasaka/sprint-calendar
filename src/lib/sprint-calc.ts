/**
 * スプリント期間計算モジュール
 * 
 * このモジュールは、スプリントの期間（開発期間、QA期間、リリース日）を計算するための
 * 関数を提供します。
 * 
 * 例：開発期間が7日間、QA期間も7日間、スプリント開始曜日が火曜日の場合
 * - 2025/03/11(火)リリースのスプリント
 *   - 2025/02/25(火)に開発を開始すると2025/03/03(月)までは開発期間
 *   - 2025/03/04(火)からQA期間が開始され2025/03/10(月)まではQA期間
 *   - 2025/03/11(火)がリリース日
 * - 2025/03/18(火)リリースのスプリント
 *   - 2025/03/04(火)に開発を開始すると2025/03/10(月)までは開発期間
 *   - 2025/03/11(火)からQA期間が開始され2025/03/17(月)まではQA期間
 *   - 2025/03/18(火)がリリース日
 */
import { addDays, isSameDay, getDayOfWeek } from './date-utils';

/**
 * 指定された曜日の直近の日付を計算する
 * @param dayOfWeek 曜日（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
 * @param baseDate 基準日（指定しない場合は今日）
 * @param future 未来の日付を取得するかどうか（falseの場合は過去または今日）
 * @returns 指定された曜日の直近の日付
 */
export function getNearestDayOfWeek(dayOfWeek: number, baseDate: Date = new Date(), future: boolean = false): Date {
  const result = new Date(baseDate);
  const currentDayOfWeek = getDayOfWeek(result);
  
  if (currentDayOfWeek === dayOfWeek && !future) {
    // 今日が指定された曜日で、過去または今日の日付を求める場合は今日を返す
    return result;
  }
  
  let daysToAdd: number;
  
  if (future) {
    // 未来の日付を求める場合
    daysToAdd = (dayOfWeek + 7 - currentDayOfWeek) % 7;
    if (daysToAdd === 0) {
      daysToAdd = 7; // 同じ曜日の場合は次の週
    }
  } else {
    // 過去の日付を求める場合
    daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
    daysToAdd = daysToAdd === 0 ? 0 : daysToAdd - 7; // 同じ曜日の場合は今日
  }
  
  return addDays(result, daysToAdd);
}
/**
 * スプリント期間を表すインターフェース
 */
export interface SprintPeriod {
  developmentStart: Date;  // 開発期間の開始日
  developmentEnd: Date;    // 開発期間の終了日
  qaStart: Date;           // QA期間の開始日
  qaEnd: Date;             // QA期間の終了日
  releaseDate: Date;       // リリース日
  sprintId: string;        // スプリントを識別するためのID（リリース日ベース）
}

/**
 * 期間タイプを表す型
 */
export type PeriodType = 'development' | 'qa' | 'release' | 'none';

/**
 * 期間情報を表すインターフェース
 */
export interface PeriodInfo {
  type: PeriodType;        // 期間タイプ
  sprintId: string;        // スプリントID
  releaseDate: Date;       // リリース日
  tooltip: string;         // ツールチップに表示する情報
}

/**
 * 指定された日付に該当する全ての期間を取得する
 * @param date 判定する日付
 * @param sprintPeriods スプリント期間情報の配列
 * @returns 期間情報の配列
 */
export function getAllPeriodsForDate(date: Date, sprintPeriods: SprintPeriod[]): PeriodInfo[] {
  const results: PeriodInfo[] = [];
  
  // リリース日の昇順でソート
  const sortedPeriods = [...sprintPeriods].sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());
  
  // 各スプリントの期間をチェック
  for (const sprint of sortedPeriods) {
    const type = getCurrentPeriodType(date, sprint);
    if (type !== 'none') {
      // 既に3つの期間が登録されている場合はスキップ
      if (results.length >= 3) {
        continue;
      }
      
      // 期間情報を作成
      const releaseDate = sprint.releaseDate;
      const releaseDateStr = `${releaseDate.getFullYear()}/${String(releaseDate.getMonth() + 1).padStart(2, '0')}/${String(releaseDate.getDate()).padStart(2, '0')}`;
      const sprintId = `Sprint-${releaseDateStr}`;
      
      // ツールチップ情報を作成
      let tooltip = `${releaseDateStr}リリースのスプリント - `;
      if (type === 'development') {
        tooltip += '開発期間';
      } else if (type === 'qa') {
        tooltip += 'QA期間';
      } else if (type === 'release') {
        tooltip += 'リリース日';
      }
      
      // 同じスプリントIDの期間が既に登録されている場合は更新
      const existingIndex = results.findIndex(r => r.sprintId === sprintId);
      if (existingIndex !== -1) {
        // 既存の期間を新しい期間で上書き（優先度の高い期間を保持）
        if (type === 'release' || (type === 'qa' && results[existingIndex].type === 'development')) {
          results[existingIndex] = {
            type,
            sprintId,
            releaseDate: sprint.releaseDate,
            tooltip
          };
        }
      } else {
        // 新しい期間を追加
        results.push({
          type,
          sprintId,
          releaseDate: sprint.releaseDate,
          tooltip
        });
      }
    }
  }
  
  // 期間の重なりを考慮して並び替え（リリース日の昇順、同じリリース日の場合は期間タイプの優先度順）
  results.sort((a, b) => {
    // まずリリース日で比較
    const dateCompare = a.releaseDate.getTime() - b.releaseDate.getTime();
    if (dateCompare !== 0) {
      return dateCompare;
    }
    
    // 同じリリース日の場合は期間タイプで比較
    const typeOrder = {
      development: 0,
      qa: 1,
      release: 2
    } as const;
    
    return typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder];
  });
  
  return results;
}

/**
 * スプリントの開始日から各期間を計算する
 * @param startDate スプリント開始日
 * @param devDays 開発期間の日数
 * @param qaDays QA期間の日数
 * @returns スプリント期間情報
 */
export function calculateSprintPeriods(startDate: Date, devDays: number, qaDays: number): SprintPeriod {
  // 開発期間の終了日は開始日 + 開発日数 - 1
  const developmentEnd = addDays(startDate, devDays - 1);
  
  // QA期間の開始日は開発期間の終了日の翌日
  const qaStart = addDays(developmentEnd, 1);
  
  // QA期間の終了日はQA開始日 + QA日数 - 1
  const qaEnd = addDays(qaStart, qaDays - 1);
  
  // リリース日はQA期間終了日の翌日
  const releaseDate = addDays(qaEnd, 1);
  
  // スプリントIDを生成
  const releaseDateStr = `${releaseDate.getFullYear()}/${String(releaseDate.getMonth() + 1).padStart(2, '0')}/${String(releaseDate.getDate()).padStart(2, '0')}`;
  const sprintId = `Sprint-${releaseDateStr}`;
  
  return {
    developmentStart: startDate,
    developmentEnd,
    qaStart,
    qaEnd,
    releaseDate,
    sprintId
  };
}

/**
 * 指定された開始日から未来の複数のスプリント期間を計算する
 * @param startDate 最初のスプリント開始日
 * @param devDays 開発期間の日数
 * @param qaDays QA期間の日数
 * @param count スプリント数
 * @returns スプリント期間情報の配列
 */
export function getNextNSprints(startDate: Date, devDays: number, qaDays: number, count: number): SprintPeriod[] {
  const periods: SprintPeriod[] = [];
  let currentStartDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    // スプリント開始曜日を取得
    const startDayOfWeek = getDayOfWeek(currentStartDate);
    
    // スプリント期間を計算
    const period = calculateSprintPeriods(currentStartDate, devDays, qaDays);
    periods.push(period);
    
    // 次のスプリントの開始日を計算
    // README.mdの例に基づいて、次のスプリントは前のスプリントのQA開始日と同じ日に開発を開始する
    currentStartDate = new Date(period.qaStart);
  }
  
  return periods;
}

/**
 * 指定された開始日から過去の複数のスプリント期間を計算する
 * @param startDate 基準となるスプリント開始日
 * @param devDays 開発期間の日数
 * @param qaDays QA期間の日数
 * @param count スプリント数
 * @returns スプリント期間情報の配列
 */
export function getPreviousNSprints(startDate: Date, devDays: number, qaDays: number, count: number): SprintPeriod[] {
  const periods: SprintPeriod[] = [];
  
  // 過去のスプリントを逆算
  let previousStartDate = new Date(startDate);
  
  // 現在のスプリントを計算
  const currentSprint = calculateSprintPeriods(startDate, devDays, qaDays);
  periods.push(currentSprint);
  
  // 過去のスプリントを計算
  for (let i = 1; i < count; i++) {
    // 前のスプリントの開発開始日を計算
    // 1週間ごとにスプリントが開始される場合、7日前が前のスプリントの開発開始日
    previousStartDate = addDays(previousStartDate, -7);
    
    const period = calculateSprintPeriods(previousStartDate, devDays, qaDays);
    periods.push(period);
  }
  
  // リリース日の昇順でソート
  periods.sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());
  
  return periods;
}

/**
 * 指定された日付がどの期間タイプに該当するかを判定する
 * @param date 判定する日付
 * @param sprintPeriod スプリント期間情報
 * @returns 期間タイプ
 */
export function getCurrentPeriodType(date: Date, sprintPeriod: SprintPeriod): PeriodType {
  // 日付の時間部分をリセットして比較
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const devStart = new Date(sprintPeriod.developmentStart);
  devStart.setHours(0, 0, 0, 0);
  
  const devEnd = new Date(sprintPeriod.developmentEnd);
  devEnd.setHours(0, 0, 0, 0);
  
  const qaStart = new Date(sprintPeriod.qaStart);
  qaStart.setHours(0, 0, 0, 0);
  
  const qaEnd = new Date(sprintPeriod.qaEnd);
  qaEnd.setHours(0, 0, 0, 0);
  
  const releaseDate = new Date(sprintPeriod.releaseDate);
  releaseDate.setHours(0, 0, 0, 0);
  
  // リリース日かどうか（最優先）
  if (isSameDay(targetDate, releaseDate)) {
    return 'release';
  }
  
  // QA期間内かどうか
  if (targetDate >= qaStart && targetDate <= qaEnd) {
    return 'qa';
  }
  
  // 開発期間内かどうか
  if (targetDate >= devStart && targetDate <= devEnd) {
    return 'development';
  }
  
  return 'none';
}

/**
 * 指定された日付がいずれかのスプリント期間に該当するかを判定する
 * @param date 判定する日付
 * @param sprintPeriods スプリント期間情報の配列
 * @returns 期間タイプ
 */
export function getPeriodTypeForDate(date: Date, sprintPeriods: SprintPeriod[]): PeriodType {
  for (const period of sprintPeriods) {
    const periodType = getCurrentPeriodType(date, period);
    if (periodType !== 'none') {
      return periodType;
    }
  }
  return 'none';
}
