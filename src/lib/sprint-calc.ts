/**
 * スプリント期間計算モジュール
 */
import { addDays, isSameDay } from './date-utils';

/**
 * スプリント期間を表すインターフェース
 */
export interface SprintPeriod {
  developmentStart: Date;
  developmentEnd: Date;
  qaStart: Date;
  qaEnd: Date;
  releaseDate: Date;
  nextSprintStart: Date;
}

/**
 * 期間タイプを表す型
 */
export type PeriodType = 'development' | 'qa' | 'release' | 'none';

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
  
  // リリース日はQA期間の終了日の翌日
  const releaseDate = addDays(qaEnd, 1);
  
  // 次のスプリント開始日はリリース日の翌日
  const nextSprintStart = addDays(releaseDate, 1);
  
  return {
    developmentStart: startDate,
    developmentEnd,
    qaStart,
    qaEnd,
    releaseDate,
    nextSprintStart
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
    const period = calculateSprintPeriods(currentStartDate, devDays, qaDays);
    periods.push(period);
    currentStartDate = period.nextSprintStart;
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
  
  // スプリント1サイクルの日数
  const sprintCycleLength = devDays + qaDays + 1; // 開発期間 + QA期間 + リリース日
  
  // 基準日から1サイクル前のスプリント開始日を計算
  let currentStartDate = new Date(startDate);
  currentStartDate.setDate(currentStartDate.getDate() - sprintCycleLength);
  
  for (let i = 0; i < count; i++) {
    const period = calculateSprintPeriods(currentStartDate, devDays, qaDays);
    periods.unshift(period); // 配列の先頭に追加して時系列順にする
    
    // 前のスプリントの開始日を計算
    currentStartDate = new Date(currentStartDate);
    currentStartDate.setDate(currentStartDate.getDate() - sprintCycleLength);
  }
  
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
  
  // 開発期間内かどうか
  if (targetDate >= devStart && targetDate <= devEnd) {
    return 'development';
  }
  
  // QA期間内かどうか
  if (targetDate >= qaStart && targetDate <= qaEnd) {
    return 'qa';
  }
  
  // リリース日かどうか
  if (isSameDay(targetDate, releaseDate)) {
    return 'release';
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