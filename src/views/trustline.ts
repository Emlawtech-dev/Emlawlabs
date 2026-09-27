import type { AppState } from '../types'
import { escHtml } from '../utils/dom'

export function renderTrustline(state: AppState): string {
  const f = state.trustlineForm

  return `
    <div class="panel">
      <div class="panel-card">
        <div class="panel-header">
          <button class="btn-back" data-action="goto-dashboard">← Back</button>
          <h2>Add Trustline</h2>
        </div>

        <p class="form-hint" style="margin-bottom:16px;">
          A trustline lets your account hold a custom asset. It costs 0.5 XLM in
          reserved balance while active.
        </p>

        ${f.error ? `<div class="error-msg">${escHtml(f.error)}</div>` : ''}

        <div class="form-group">
          <label class="form-label">Asset Code</label>
          <input class="form-input" id="trustline-code" type="text"
            placeholder="USDC" maxlength="12" value="${escHtml(f.assetCode)}" spellcheck="false" autocomplete="off"/>
          <p class="form-hint">1–12 letters or digits, e.g. USDC, yXLM</p>
        </div>

        <div class="form-group">
          <label class="form-label">Asset Issuer</label>
          <input class="form-input" id="trustline-issuer" type="text"
            placeholder="G…" value="${escHtml(f.assetIssuer)}" spellcheck="false" autocomplete="off"/>
          <p class="form-hint">The issuing account's public key</p>
        </div>

        <div class="form-group">
          <label class="form-label">Limit (optional)</label>
          <input class="form-input" id="trustline-limit" type="number" step="0.0000001"
            placeholder="Leave empty for maximum" value="${escHtml(f.limit)}" min="0"/>
          <p class="form-hint">Maximum amount of this asset you're willing to hold</p>
        </div>

        <div class="form-group">
          <label class="form-label">Secret Key (to sign)</label>
          <input class="form-input" id="trustline-secret" type="password"
            placeholder="S… (never stored or sent anywhere)" autocomplete="off" spellcheck="false"/>
          <p class="form-hint">Used only to sign the transaction locally in your browser.</p>
        </div>

        <button class="btn-primary" data-action="submit-trustline" ${f.submitting ? 'disabled' : ''}>
          ${f.submitting ? 'Submitting…' : 'Add Trustline'}
        </button>
      </div>
    </div>
  `
}
