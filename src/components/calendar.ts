/**
 * カレンダー表示コンポーネント
 *
 * このコンポーネントは、スプリント期間情報を元にカレンダーを生成し、
 * 各日付のスプリント期間タイプを視覚的に表示します。
 */
import {
  createDate,
  getDayOfWeek,
  getDayOfWeekName,
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  isToday,
} from '../lib/date-utils';
import type { CalendarConfig } from '../lib/params';
import { type PeriodInfo, type SprintPeriod, getAllPeriodsForDate } from '../lib/sprint-calc';

/**
 * カレンダーの日を表すインターフェース
 */
export interface CalendarDay {
  date: Date;
  isToday: boolean;
  periods: PeriodInfo[];
}

/**
 * カレンダーの月を表すインターフェース
 */
export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

/**
 * カレンダーの月データを生成する
 * @param year 年
 * @param month 月（0-11）
 * @param sprintPeriods スプリント期間情報の配列
 * @returns カレンダーの月データ
 */
function generateCalendarMonth(
  year: number,
  month: number,
  sprintPeriods: SprintPeriod[]
): CalendarMonth {
  const firstDay = getFirstDayOfMonth(createDate(year, month));
  const daysInMonth = getDaysInMonth(firstDay);
  const firstDayOfWeek = getDayOfWeek(firstDay);

  const days: CalendarDay[] = [];

  // 月の最初の日の前の空白を追加
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      date: new Date(0), // ダミーの日付
      isToday: false,
      periods: [],
    });
  }

  // 月の日を追加
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isToday: isToday(date),
      periods: getAllPeriodsForDate(date, sprintPeriods),
    });
  }

  return {
    year,
    month,
    days,
  };
}

/**
 * 指定された期間のカレンダーの月データを生成する
 * @param config カレンダー設定
 * @param sprintPeriods スプリント期間情報の配列
 * @returns カレンダーの月データの配列
 */
export function generateCalendarMonths(
  config: CalendarConfig,
  sprintPeriods: SprintPeriod[]
): CalendarMonth[] {
  const months: CalendarMonth[] = [];

  // 中央に表示する日付（指定されていない場合は今日）
  const centerDate = config.centerDate || new Date();
  const centerYear = centerDate.getFullYear();
  const centerMonth = centerDate.getMonth();

  // 表示開始月を計算（中央の月から前に半分の月数）
  const halfMonths = Math.floor(config.displayMonths / 2);
  let startMonth = centerMonth - halfMonths;
  let startYear = centerYear;

  // 年をまたぐ場合の調整（前方向）
  if (startMonth < 0) {
    startYear -= Math.ceil(Math.abs(startMonth) / 12);
    startMonth = 12 + (startMonth % 12);
    if (startMonth === 12) {
      startMonth = 0;
      startYear += 1;
    }
  }

  // 各月のカレンダーを生成
  for (let i = 0; i < config.displayMonths; i++) {
    let year = startYear;
    let month = startMonth + i;

    // 年をまたぐ場合の調整
    if (month > 11) {
      year += Math.floor(month / 12);
      month = month % 12;
    }

    months.push(generateCalendarMonth(year, month, sprintPeriods));
  }

  return months;
}

/**
 * カレンダーをレンダリングする
 * @param container カレンダーを表示するコンテナ要素
 * @param months カレンダーの月データの配列
 */
export function renderCalendar(container: HTMLElement, months: CalendarMonth[]): void {
  // コンテナをクリア
  container.innerHTML = '';

  // 各月のカレンダーを生成
  for (const month of months) {
    const monthElement = document.createElement('div');
    monthElement.className = 'calendar-month';

    // 月のヘッダーを生成
    const headerElement = document.createElement('div');
    headerElement.className = 'month-header';
    headerElement.textContent = `${month.year}年${getMonthName(month.month)}`;
    monthElement.appendChild(headerElement);

    // 曜日の行を生成
    const weekdaysElement = document.createElement('div');
    weekdaysElement.className = 'weekdays';

    for (let i = 0; i < 7; i++) {
      const weekdayElement = document.createElement('div');
      weekdayElement.className = 'weekday';
      weekdayElement.textContent = getDayOfWeekName(i);
      weekdaysElement.appendChild(weekdayElement);
    }

    monthElement.appendChild(weekdaysElement);

    // 日の行を生成
    const daysElement = document.createElement('div');
    daysElement.className = 'days';

    for (const day of month.days) {
      const dayElement = document.createElement('div');

      // 空白の日
      if (day.date.getTime() === 0) {
        dayElement.className = 'day empty';
        daysElement.appendChild(dayElement);
        continue;
      }

      // 日付のクラスを設定
      let className = 'day';

      if (day.isToday) {
        className += ' today';
      }

      dayElement.className = className;

      // 日付の数字を表示
      const dayNumberElement = document.createElement('div');
      dayNumberElement.className = 'day-number';
      dayNumberElement.textContent = day.date.getDate().toString();
      dayElement.appendChild(dayNumberElement);

      // 期間を表示
      if (day.periods.length > 0) {
        const periodsElement = document.createElement('div');
        periodsElement.className = 'periods';

        for (const period of day.periods) {
          const periodElement = document.createElement('div');
          periodElement.className = `period ${period.type}`;
          periodElement.setAttribute('data-sprint-id', period.sprintId);
          periodElement.setAttribute('title', period.tooltip);
          periodsElement.appendChild(periodElement);
        }

        dayElement.appendChild(periodsElement);
      }

      daysElement.appendChild(dayElement);
    }

    monthElement.appendChild(daysElement);
    container.appendChild(monthElement);
  }
}
