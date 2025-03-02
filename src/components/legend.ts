/**
 * 凡例表示コンポーネント
 */

/**
 * 凡例項目を表すインターフェース
 */
interface LegendItem {
  className: string;
  label: string;
}

/**
 * 凡例をレンダリングする
 * @param container 凡例を表示するコンテナ要素
 */
export function renderLegend(container: HTMLElement): void {
  const legendItems: LegendItem[] = [
    { className: 'development', label: '開発期間' },
    { className: 'qa', label: 'QA期間' },
    { className: 'release', label: 'リリース日' },
    { className: 'today', label: '今日' }
  ];
  
  // コンテナをクリア
  container.innerHTML = '';
  
  // 凡例項目を生成
  legendItems.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'legend-item';
    
    const colorBox = document.createElement('span');
    colorBox.className = `color-box ${item.className}`;
    itemElement.appendChild(colorBox);
    
    const label = document.createElement('span');
    label.textContent = item.label;
    itemElement.appendChild(label);
    
    container.appendChild(itemElement);
  });
}