/**
 * URLパラメータ処理モジュール
 */
import { formatDate, parseDate } from './date-utils';

/**
 * カレンダー設定を表すインターフェース
 */
export interface CalendarConfig {
  startDayOfWeek: number; // スプリント開始曜日（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
  developmentDays: number; // 開発期間の日数
  qaDays: number; // QA期間の日数
  displayMonths: number; // 表示する月数
  centerDate?: Date; // 中央に表示する日付（指定しない場合は今日）
}

/**
 * デフォルトのカレンダー設定
 */
const DEFAULT_CONFIG: CalendarConfig = {
  startDayOfWeek: 2, // デフォルトは火曜日
  developmentDays: 7, // デフォルトの開発期間は7日
  qaDays: 7, // デフォルトのQA期間は7日
  displayMonths: 3, // デフォルトの表示月数は3ヶ月
  centerDate: new Date(), // デフォルトでは今日を中央に表示
};

/**
 * URLパラメータからカレンダー設定を解析する
 * @param url URL
 * @returns カレンダー設定
 */
export function parseUrlParams(url: URL): CalendarConfig {
  const params = url.searchParams;

  // 開始曜日のパラメータを取得
  let startDayOfWeek = DEFAULT_CONFIG.startDayOfWeek;
  const startDayParam = params.get('startDay');
  if (startDayParam) {
    const day = Number.parseInt(startDayParam, 10);
    if (!Number.isNaN(day) && day >= 0 && day <= 6) {
      startDayOfWeek = day;
    } else {
      console.error('Invalid start day of week:', startDayParam);
    }
  }

  // 開発期間のパラメータを取得
  let developmentDays = DEFAULT_CONFIG.developmentDays;
  const devParam = params.get('dev');
  if (devParam) {
    const days = Number.parseInt(devParam, 10);
    if (!Number.isNaN(days) && days > 0) {
      developmentDays = days;
    } else {
      console.error('Invalid development days:', devParam);
    }
  }

  // QA期間のパラメータを取得
  let qaDays = DEFAULT_CONFIG.qaDays;
  const qaParam = params.get('qa');
  if (qaParam) {
    const days = Number.parseInt(qaParam, 10);
    if (!Number.isNaN(days) && days > 0) {
      qaDays = days;
    } else {
      console.error('Invalid QA days:', qaParam);
    }
  }

  // 表示月数のパラメータを取得
  let displayMonths = DEFAULT_CONFIG.displayMonths;
  const monthsParam = params.get('months');
  if (monthsParam) {
    const months = Number.parseInt(monthsParam, 10);
    if (!Number.isNaN(months) && months > 0 && months <= 12) {
      displayMonths = months;
    } else {
      console.error('Invalid display months:', monthsParam);
    }
  }

  // 中央に表示する日付のパラメータを取得
  let centerDate = DEFAULT_CONFIG.centerDate;
  const centerParam = params.get('center');
  if (centerParam) {
    try {
      centerDate = parseDate(centerParam);
    } catch (e) {
      console.error('Invalid center date format:', centerParam);
    }
  }

  return {
    startDayOfWeek,
    developmentDays,
    qaDays,
    displayMonths,
    centerDate,
  };
}

/**
 * カレンダー設定からURLを生成する
 * @param config カレンダー設定
 * @returns URLパラメータを含むURL文字列
 */
export function generateUrlWithParams(config: CalendarConfig): string {
  const url = new URL(window.location.href);

  // 現在のURLパラメータをクリア
  url.search = '';

  // 開始曜日のパラメータを設定
  url.searchParams.set('startDay', config.startDayOfWeek.toString());

  // 開発期間のパラメータを設定
  url.searchParams.set('dev', config.developmentDays.toString());

  // QA期間のパラメータを設定
  url.searchParams.set('qa', config.qaDays.toString());

  // 表示月数のパラメータを設定
  url.searchParams.set('months', config.displayMonths.toString());

  // 中央に表示する日付のパラメータを設定（指定されている場合）
  if (config.centerDate) {
    url.searchParams.set('center', formatDate(config.centerDate));
  }

  return url.toString();
}
