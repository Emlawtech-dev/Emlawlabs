import type { AppState } from '../types'
import { escHtml } from '../utils/dom'

export function renderConnect(state: AppState): string {
  return `
    <div class="connect-screen">
      <div class="connect-card">
        <div class="connect-hero">
          <span class="connect-icon">✦</span>
          <h1>Stellar Dashboard</h1>
          <p>Enter your Stellar public key to view your wallet.<br/>Your key never leaves your browser.</p>
        </div>

        <div class="network-toggle">
          <button class="network-btn ${state.network === 'testnet' ? 'active' : ''}" data-action="set-network" data-net="testnet">
            Testnet
          </button>
          <button class="network-btn ${state.network === 'mainnet' ? 'active' : ''}" data-action="set-network" data-net="mainnet">
            Mainnet
          </button>
        </div>

        ${state.error ? `<div class="error-msg">${escHtml(state.error)}</div>` : ''}

        <div class="form-group">
          <label class="form-label" for="public-key-input">Public Key (G…)</label>
          <input
            id="public-key-input"
            class="form-input"
            type="text"
            placeholder="GABC…XYZ"
            autocomplete="off"
            spellcheck="false"
            value="${escHtml(state.account?.publicKey ?? '')}"
          />
          <p class="form-hint">Your 56-character Stellar public key starting with G</p>
        </div>

        <button class="btn-primary" data-action="connect" ${state.loading ? 'disabled' : ''}>
          ${state.loading ? 'Connecting…' : 'View Wallet'}
        </button>

        <p class="connect-footer">
          Need test XLM? Use the
          <a href="https://laboratory.stellar.org/#account-creator?network=test" target="_blank" rel="noopener">Stellar Friendbot</a>
          to fund a testnet account.
        </p>
      </div>
    </div>
  `
}
