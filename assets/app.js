/* 台湾旅行のしおり: チェックリストの保存と進捗表示
   チェックの状態は、この端末のブラウザ(localStorage)にだけ保存される。 */
(() => {
  'use strict';

  const page = document.body.dataset.page;
  const boxes = Array.from(document.querySelectorAll('.check input[type="checkbox"]'));
  if (!page || boxes.length === 0) return;

  const STORAGE_KEY = 'taiwan-shiori:' + page;

  // 項目名をキーにする(同じ名前が複数あるときは連番を付ける)。
  // 項目の並べ替えや追加をしても、チェックの位置がずれない。
  const seen = new Map();
  const keys = new Map(boxes.map((box) => {
    const title = box.closest('.check').querySelector('.check__title').textContent.replace(/\s+/g, ' ').trim();
    const n = (seen.get(title) || 0) + 1;
    seen.set(title, n);
    return [box, n === 1 ? title : title + '#' + n];
  }));

  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return new Set(Array.isArray(saved) ? saved : []);
    } catch (e) {
      return new Set();
    }
  };

  const save = (checked) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checked)));
    } catch (e) {
      // 保存できない環境では、ページを開いている間だけ有効
    }
  };

  const checked = load();
  boxes.forEach((box) => { box.checked = checked.has(keys.get(box)); });

  const groups = Array.from(document.querySelectorAll('[data-group]'));
  const progressText = document.querySelector('[data-progress-text]');
  const progressBar = document.querySelector('[data-progress-bar]');

  const render = () => {
    const done = boxes.filter((box) => box.checked).length;

    if (progressText) progressText.textContent = done + ' / ' + boxes.length;
    if (progressBar) {
      progressBar.max = boxes.length;
      progressBar.value = done;
    }

    groups.forEach((group) => {
      const items = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      const groupDone = items.filter((box) => box.checked).length;
      const count = group.querySelector('[data-count]');
      if (count) count.textContent = groupDone + '/' + items.length;
      group.toggleAttribute('data-done', items.length > 0 && groupDone === items.length);
    });
  };

  boxes.forEach((box) => {
    box.addEventListener('change', () => {
      if (box.checked) checked.add(keys.get(box));
      else checked.delete(keys.get(box));
      save(checked);
      render();
    });
  });

  // リセット: 確認ダイアログは使えない環境があるので、ボタンを2回押す方式にする
  const resetButton = document.querySelector('[data-reset]');
  if (resetButton) {
    const label = resetButton.textContent;
    let timer = null;

    const disarm = () => {
      clearTimeout(timer);
      timer = null;
      resetButton.textContent = label;
      resetButton.removeAttribute('data-armed');
    };

    resetButton.addEventListener('click', () => {
      if (timer) {
        disarm();
        boxes.forEach((box) => { box.checked = false; });
        checked.clear();
        save(checked);
        render();
        return;
      }
      resetButton.textContent = 'もう一度押すと、チェックをすべて外します';
      resetButton.setAttribute('data-armed', '');
      timer = setTimeout(disarm, 4000);
    });
  }

  render();
})();
