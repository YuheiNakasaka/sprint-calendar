/**
 * スプリント早わかりカレンダー
 *
 * このアプリケーションは、アジャイル開発における各スプリントの期間
 * （開発期間、QA期間、リリース日）を視覚的に表示します。
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
import './styles/main.css';
import { generateCalendarMonths, renderCalendar } from './components/calendar';
import { renderLegend } from './components/legend';
import { generateUrlWithParams, parseUrlParams } from './lib/params';
import { getNearestDayOfWeek, getNextNSprints, getPreviousNSprints } from './lib/sprint-calc';

// アプリケーションの初期化
function initApp() {
  // URLパラメータの解析
  const url = new URL(window.location.href);
  const config = parseUrlParams(url);

  // フォームの初期値を設定
  const startDaySelect = document.getElementById('start-day') as HTMLSelectElement;
  const devDaysInput = document.getElementById('dev-days') as HTMLInputElement;
  const qaDaysInput = document.getElementById('qa-days') as HTMLInputElement;
  const displayMonthsInput = document.getElementById('display-months') as HTMLInputElement;

  startDaySelect.value = config.startDayOfWeek.toString();
  devDaysInput.value = config.developmentDays.toString();
  qaDaysInput.value = config.qaDays.toString();
  displayMonthsInput.value = config.displayMonths.toString();

  // スプリント期間の計算
  // 現在の日付から過去と未来のスプリント期間を計算
  const sprintCycleLength = config.developmentDays + config.qaDays + 1; // 開発期間 + QA期間 + リリース日

  // 表示する月数に必要なスプリント数を概算（前後の月も含める）
  const requiredSprints = Math.ceil((config.displayMonths * 31) / sprintCycleLength) * 2;

  // 指定された曜日の直近の過去の日付を計算
  const startDate = getNearestDayOfWeek(config.startDayOfWeek, new Date(), false);

  // 過去のスプリント期間を計算
  const pastSprintPeriods = getPreviousNSprints(
    startDate,
    config.developmentDays,
    config.qaDays,
    requiredSprints
  );

  // 未来のスプリント期間を計算
  const futureSprintPeriods = getNextNSprints(
    startDate,
    config.developmentDays,
    config.qaDays,
    requiredSprints
  );

  // 過去と未来のスプリント期間を結合
  const sprintPeriods = [...pastSprintPeriods, ...futureSprintPeriods];

  // カレンダーの生成と表示
  const calendarContainer = document.getElementById('calendar-container') as HTMLElement;
  if (calendarContainer) {
    const calendarMonths = generateCalendarMonths(config, sprintPeriods);
    renderCalendar(calendarContainer, calendarMonths);
  } else {
    console.error('カレンダーコンテナが見つかりません');
  }

  // 凡例の表示
  const legendContainer = document.querySelector('.legend') as HTMLElement;
  if (legendContainer) {
    renderLegend(legendContainer);
  }

  // 設定フォームのイベントリスナー
  const settingsForm = document.getElementById('settings-form') as HTMLFormElement;
  if (settingsForm) {
    settingsForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // フォームの値を取得
      const newConfig = {
        startDayOfWeek: Number.parseInt(startDaySelect.value, 10),
        developmentDays: Number.parseInt(devDaysInput.value, 10),
        qaDays: Number.parseInt(qaDaysInput.value, 10),
        displayMonths: Number.parseInt(displayMonthsInput.value, 10),
        centerDate: new Date(), // 今日の日付を中央に表示
      };

      // URLを更新して再読み込み
      const newUrl = generateUrlWithParams(newConfig);
      window.location.href = newUrl;
    });
  } else {
    console.error('設定フォームが見つかりません');
  }

  // スプリント情報の表示
  displaySprintInfo(config.startDayOfWeek, config.developmentDays, config.qaDays);
}

/**
 * スプリント情報を表示する
 * @param startDayOfWeek スプリント開始曜日
 * @param devDays 開発期間の日数
 * @param qaDays QA期間の日数
 */
function displaySprintInfo(startDayOfWeek: number, devDays: number, qaDays: number): void {
  // スプリント情報を表示するコンテナを取得
  const infoContainer = document.getElementById('sprint-info');
  if (!infoContainer) return;

  // 現在の日付から直近の過去のスプリント開始曜日を取得
  const startDate = getNearestDayOfWeek(startDayOfWeek, new Date(), false);

  // 3つのスプリント期間を計算
  const sprintPeriods = getNextNSprints(startDate, devDays, qaDays, 3);

  // スプリント情報のHTMLを生成
  let infoHTML = '<h3>スプリント情報</h3>';

  for (const sprint of sprintPeriods) {
    const releaseDate = sprint.releaseDate;
    const releaseDateStr = `${releaseDate.getFullYear()}/${String(releaseDate.getMonth() + 1).padStart(2, '0')}/${String(releaseDate.getDate()).padStart(2, '0')}`;

    const devStartDate = sprint.developmentStart;
    const devStartStr = `${devStartDate.getFullYear()}/${String(devStartDate.getMonth() + 1).padStart(2, '0')}/${String(devStartDate.getDate()).padStart(2, '0')}`;

    const devEndDate = sprint.developmentEnd;
    const devEndStr = `${devEndDate.getFullYear()}/${String(devEndDate.getMonth() + 1).padStart(2, '0')}/${String(devEndDate.getDate()).padStart(2, '0')}`;

    const qaStartDate = sprint.qaStart;
    const qaStartStr = `${qaStartDate.getFullYear()}/${String(qaStartDate.getMonth() + 1).padStart(2, '0')}/${String(qaStartDate.getDate()).padStart(2, '0')}`;

    const qaEndDate = sprint.qaEnd;
    const qaEndStr = `${qaEndDate.getFullYear()}/${String(qaEndDate.getMonth() + 1).padStart(2, '0')}/${String(qaEndDate.getDate()).padStart(2, '0')}`;

    infoHTML += `
      <div class="sprint-info-item">
        <h4>${releaseDateStr}(${getDayOfWeekName(releaseDate.getDay())})リリースのスプリント</h4>
        <ul>
          <li>${devStartStr}(${getDayOfWeekName(devStartDate.getDay())})に開発を開始すると${devEndStr}(${getDayOfWeekName(devEndDate.getDay())})までは開発期間です</li>
          <li>${qaStartStr}(${getDayOfWeekName(qaStartDate.getDay())})からQA期間が開始され${qaEndStr}(${getDayOfWeekName(qaEndDate.getDay())})まではQA期間です</li>
          <li>${releaseDateStr}(${getDayOfWeekName(releaseDate.getDay())})がリリース日になります</li>
        </ul>
      </div>
    `;
  }

  infoContainer.innerHTML = infoHTML;
}

// 曜日の名前を取得する関数
function getDayOfWeekName(dayOfWeek: number): string {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return dayNames[dayOfWeek];
}

// DOMの読み込み完了時にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initApp);
