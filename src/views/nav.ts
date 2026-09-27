import type { AppState } from '../types'

export function renderNav(state: AppState): string {
  if (state.view === 'connect') return ''
  return `
    <nav class="top-nav">
      <div class="nav-logo">
        <span class="logo-dot"></span>
        StellarDash
      </div>
      <div class="nav-spacer"></div>
      <div class="network-badge">
        <span class="dot ${state.network}"></span>
        ${state.network === 'testnet' ? 'Testnet' : 'Mainnet'}
      </div>
      <button class="btn-disconnect" data-action="disconnect">Disconnect</button>
    </nav>
  `
}
