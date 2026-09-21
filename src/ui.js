/** DOM helpers: reading forms, writing numbers, tabs. No simulation math lives here. */

export const $ = (id) => document.getElementById(id);

export function num(id) {
  return parseFloat($(id).value);
}

export function int(id) {
  return parseInt($(id).value, 10);
}

export function money(v, digits = 2) {
  if (!Number.isFinite(v)) return '—';
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function fixed(v, digits = 4) {
  return Number.isFinite(v) ? v.toFixed(digits) : '—';
}

export function pct(v, digits = 2) {
  return Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : '—';
}

export function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

export function setAll(ids, text) {
  for (const id of ids) setText(id, text);
}

/** Simple tab strip: buttons with data-tab switch panels with matching ids. */
export function initTabs(onChange) {
  const buttons = [...document.querySelectorAll('.tab-button')];
  const select = (name) => {
    for (const b of buttons) {
      const on = b.dataset.tab === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      const panel = $(b.dataset.tab);
      if (panel) panel.hidden = !on;
    }
    onChange?.(name);
  };
  for (const b of buttons) b.addEventListener('click', () => select(b.dataset.tab));
  select(buttons[0]?.dataset.tab);
  return select;
}

export function setBusy(button, busy, label) {
  button.disabled = busy;
  button.textContent = busy ? 'Running…' : label;
}

export function setProgress(id, fraction) {
  const el = $(id);
  if (el) el.style.setProperty('width', `${Math.round(fraction * 100)}%`);
}

/** Read the sampler choice shared by every tab. */
export function samplerSpec() {
  const method = $('sampler').value;
  return { method, seed: int('seed') };
}
