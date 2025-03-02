/**
 * 日付操作ユーティリティ
 */

/**
 * 指定された日数を日付に加算する
 * @param date 基準日
 * @param days 加算する日数
 * @returns 加算後の日付
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 指定された日付が同じ日かどうかを判定する
 * @param date1 日付1
 * @param date2 日付2
 * @returns 同じ日であればtrue
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 指定された日付が今日かどうかを判定する
 * @param date 判定する日付
 * @returns 今日であればtrue
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 指定された日付の月の最初の日を取得する
 * @param date 日付
 * @returns 月の最初の日
 */
export function getFirstDayOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  return result;
}

/**
 * 指定された日付の月の最後の日を取得する
 * @param date 日付
 * @returns 月の最後の日
 */
export function getLastDayOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  return result;
}

/**
 * 指定された日付の月の日数を取得する
 * @param date 日付
 * @returns 月の日数
 */
export function getDaysInMonth(date: Date): number {
  return getLastDayOfMonth(date).getDate();
}

/**
 * 指定された日付の曜日を取得する（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
 * @param date 日付
 * @returns 曜日（0-6）
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * 指定された年月の月を表す日付を生成する
 * @param year 年
 * @param month 月（0-11）
 * @returns 指定された年月の1日の日付
 */
export function createDate(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * 日付を「YYYY-MM-DD」形式の文字列に変換する
 * @param date 日付
 * @returns YYYY-MM-DD形式の文字列
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 「YYYY-MM-DD」形式の文字列を日付に変換する
 * @param dateString YYYY-MM-DD形式の文字列
 * @returns 日付オブジェクト
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 月の名前を取得する
 * @param month 月（0-11）
 * @returns 月の名前
 */
export function getMonthName(month: number): string {
  const monthNames = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];
  return monthNames[month];
}

/**
 * 曜日の名前を取得する
 * @param dayOfWeek 曜日（0-6）
 * @returns 曜日の名前
 */
export function getDayOfWeekName(dayOfWeek: number): string {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return dayNames[dayOfWeek];
}
