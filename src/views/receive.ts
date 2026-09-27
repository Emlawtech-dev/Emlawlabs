import type { AppState } from '../types'
import { escHtml } from '../utils/dom'
import { buildQrCodeUrl } from '../utils/qrcode'

export function renderReceive(state: AppState): string {
  const pk = state.accountInfo!.publicKey
  return `
    <div class="panel">
      <div class="panel-card">
        <div class="panel-header">
          <button class="btn-back" data-action="goto-dashboard">← Back</button>
          <h2>Receive Payment</h2>
        </div>

        <div class="qr-wrap">
          <img class="qr-code" src="${buildQrCodeUrl(pk)}" alt="QR code for ${escHtml(pk)}" width="220" height="220" loading="lazy" />
        </div>

        <div class="receive-address-box">
          <div class="address-full">${escHtml(pk)}</div>
        </div>

        <button class="btn-primary" data-action="copy-address" data-value="${escHtml(pk)}" style="margin-bottom:12px">
          Copy Address
        </button>
        <button class="btn-secondary" style="width:100%" data-action="open-stellar-lab" data-pk="${escHtml(pk)}">
          View on Stellar Expert ↗
        </button>

        <p class="receive-network-note">
          Only send assets on the <strong>${state.network === 'testnet' ? 'Stellar Testnet' : 'Stellar Mainnet'}</strong>.
          Sending from a different network will result in permanent loss.
        </p>
      </div>
    </div>
  `
}
