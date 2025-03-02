import './styles/main.css';
import { parseUrlParams, generateUrlWithParams } from './lib/params';
import { calculateSprintPeriods, getNextNSprints, getPreviousNSprints } from './lib/sprint-calc';
import { generateCalendarMonths, renderCalendar } from './components/calendar';
import { renderLegend } from './components/legend';

// アプリケーションの初期化
function initApp() {
  // URLパラメータの解析
  const url = new URL(window.location.href);
  const config = parseUrlParams(url);
  
  // フォームの初期値を設定
  const startDateInput = document.getElementById('start-date') as HTMLInputElement;
  const devDaysInput = document.getElementById('dev-days') as HTMLInputElement;
  const qaDaysInput = document.getElementById('qa-days') as HTMLInputElement;
  const displayMonthsInput = document.getElementById('display-months') as HTMLInputElement;
  
  startDateInput.value = config.startDate.toISOString().split('T')[0];
  devDaysInput.value = config.developmentDays.toString();
  qaDaysInput.value = config.qaDays.toString();
  displayMonthsInput.value = config.displayMonths.toString();
  
  // スプリント期間の計算
  // 現在の日付から過去と未来のスプリント期間を計算
  const centerDate = config.centerDate || new Date();
  const sprintCycleLength = config.developmentDays + config.qaDays + 1; // 開発期間 + QA期間 + リリース日
  
  // 表示する月数に必要なスプリント数を概算（前後の月も含める）
  const requiredSprints = Math.ceil(config.displayMonths * 31 / sprintCycleLength) * 2;
  
  // 過去のスプリント期間を計算
  const pastSprintPeriods = getPreviousNSprints(
    config.startDate,
    config.developmentDays,
    config.qaDays,
    requiredSprints
  );
  
  // 未来のスプリント期間を計算
  const futureSprintPeriods = getNextNSprints(
    config.startDate,
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
        startDate: new Date(startDateInput.value),
        developmentDays: parseInt(devDaysInput.value, 10),
        qaDays: parseInt(qaDaysInput.value, 10),
        displayMonths: parseInt(displayMonthsInput.value, 10),
        centerDate: new Date() // 今日の日付を中央に表示
      };
      
      // URLを更新して再読み込み
      const newUrl = generateUrlWithParams(newConfig);
      window.location.href = newUrl;
    });
  } else {
    console.error('設定フォームが見つかりません');
  }
}

// DOMの読み込み完了時にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initApp);