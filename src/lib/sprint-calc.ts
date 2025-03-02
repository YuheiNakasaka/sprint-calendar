/**
 * スプリント期間計算モジュール
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
  developmentStart: Date;
  developmentEnd: Date;
  qaStart: Date;
  qaEnd: Date;
  releaseDate: Date;
  nextSprintStart: Date;
  sprintId?: string; // スプリントを識別するためのID
}

/**
 * 期間タイプを表す型
 */
export type PeriodType = 'development' | 'qa' | 'release' | 'none';

/**
 * 期間情報を表すインターフェース
 */
export interface PeriodInfo {
  type: PeriodType;
  sprintId: string;
  startDate: Date;
}

/**
 * 指定された日付に該当する全ての期間を取得する
 * @param date 判定する日付
 * @param sprintPeriods スプリント期間情報の配列
 * @returns 期間情報の配列
 */
export function getAllPeriodsForDate(date: Date, sprintPeriods: SprintPeriod[]): PeriodInfo[] {
  const results: PeriodInfo[] = [];
  
  sprintPeriods.forEach((sprint, index) => {
    const type = getCurrentPeriodType(date, sprint);
    if (type !== 'none') {
      // リリース日を基準にしたスプリントIDを生成
      const releaseDate = sprint.releaseDate;
      const sprintId = `Sprint-${releaseDate.getFullYear()}/${releaseDate.getMonth() + 1}/${releaseDate.getDate()}`;
      
      results.push({
        type,
        sprintId,
        startDate: sprint.developmentStart
      });
    }
  });
  
  // 期間の重なりを考慮して並び替え
  // 開発期間を先に、QA期間を後に表示
  results.sort((a, b) => {
    // 'none'は含まれないことが保証されているため、as constで型を制限
    const typeOrder = {
      development: 0,
      qa: 1,
      release: 2
    } as const;
    
    // 型アサーションを使用して安全に比較
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
  
  // スプリント開始曜日を取得
  const startDayOfWeek = getDayOfWeek(startDate);
  
  // リリース日はQA期間終了後の直近のスプリント開始曜日
  const dayAfterQaEnd = addDays(qaEnd, 1);
  const releaseDate = getNearestDayOfWeek(startDayOfWeek, dayAfterQaEnd, true);
  
  // 次のスプリント開始日は現在のスプリントの開発期間中に開始
  // 開発期間の途中（例：開発期間の後半）で次のスプリントを開始
  const nextSprintStartOffset = Math.floor(devDays / 2); // 開発期間の半分の時点
  const nextSprintStart = addDays(startDate, nextSprintStartOffset);
  
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
  
  // 開発期間の半分の日数を計算
  const nextSprintOffset = Math.floor(devDays / 2);
  
  for (let i = 0; i < count; i++) {
    const period = calculateSprintPeriods(currentStartDate, devDays, qaDays);
    periods.push(period);
    
    // 次のスプリートの開始日を現在のスプリントの開発期間の半分の時点に設定
    currentStartDate = addDays(currentStartDate, nextSprintOffset);
    
    // スプリントIDを設定
    period.sprintId = `Sprint-${period.releaseDate.getFullYear()}/${period.releaseDate.getMonth() + 1}/${period.releaseDate.getDate()}`;
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
  
  // 開発期間の半分の日数を計算
  const sprintOffset = Math.floor(devDays / 2);
  
  // 最初のスプリントの開始日を計算
  let currentStartDate = new Date(startDate);
  currentStartDate = addDays(currentStartDate, -sprintOffset * count);
  
  for (let i = 0; i < count; i++) {
    const period = calculateSprintPeriods(currentStartDate, devDays, qaDays);
    
    // スプリントIDを設定
    period.sprintId = `Sprint-${period.releaseDate.getFullYear()}/${period.releaseDate.getMonth() + 1}/${period.releaseDate.getDate()}`;
    
    periods.unshift(period); // 配列の先頭に追加して時系列順にする
    
    // 次のスプリートの開始日を計算
    currentStartDate = addDays(currentStartDate, sprintOffset);
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