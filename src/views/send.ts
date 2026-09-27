import type { AppState } from '../types'
import { escHtml } from '../utils/dom'
import { formatAmount } from '../utils/stellar'

export function renderSend(state: AppState): string {
  const info = state.accountInfo!
  const f = state.sendForm
  const selectedBalance = info.balances.find(
    (b) => (f.asset === 'XLM' && b.isNative) || b.assetCode === f.asset
  )
  const available = selectedBalance
    ? (selectedBalance.isNative ? info.xlmAvailable : selectedBalance.balance)
    : '0'

  return `
    <div class="panel">
      <div class="panel-card">
        <div class="panel-header">
          <button class="btn-back" data-action="goto-dashboard">← Back</button>
          <h2>Send Payment</h2>
        </div>

        ${f.error ? `<div class="error-msg">${escHtml(f.error)}</div>` : ''}

        <div class="form-group">
          <label class="form-label">Destination Address</label>
          <input class="form-input" id="send-destination" type="text"
            placeholder="G…" value="${escHtml(f.destination)}" spellcheck="false" autocomplete="off"/>
          <p class="form-hint">Stellar public key of the recipient</p>
        </div>

        <div class="form-group">
          <label class="form-label">Asset</label>
          <select class="asset-select" id="send-asset">
            ${info.balances.map((b) => `
              <option value="${escHtml(b.assetCode)}" ${f.asset === b.assetCode ? 'selected' : ''}>
                ${escHtml(b.assetCode)} — ${formatAmount(b.balance)} available
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Amount</label>
          <input class="form-input" id="send-amount" type="number" step="0.0000001"
            placeholder="0.00" value="${escHtml(f.amount)}" min="0"/>
          <p class="available-hint">Available: ${formatAmount(available)} ${escHtml(f.asset)}</p>
        </div>

        <div class="form-group">
          <label class="form-label">Memo (optional)</label>
          <input class="form-input" id="send-memo" type="text"
            placeholder="Optional note" maxlength="28" value="${escHtml(f.memo)}"/>
          <p class="form-hint">Max 28 characters. Required by some exchanges.</p>
        </div>

        <div class="form-group">
          <label class="form-label">Secret Key (to sign)</label>
          <input class="form-input" id="send-secret" type="password"
            placeholder="S… (never stored or sent anywhere)" autocomplete="off" spellcheck="false"/>
          <p class="form-hint">Used only to sign the transaction locally in your browser.</p>
        </div>

        <button class="btn-primary" data-action="submit-send" ${f.submitting ? 'disabled' : ''}>
          ${f.submitting ? 'Sending…' : 'Send Payment'}
        </button>
      </div>
    </div>
  `
}
