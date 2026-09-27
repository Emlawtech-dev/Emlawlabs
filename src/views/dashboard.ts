import type { AppState } from '../types'
import { escHtml } from '../utils/dom'
import { calculateReserve, formatAmount, formatDate, shortenKey } from '../utils/stellar'

const TX_ICONS: Record<string, string> = {
  sent: '↑',
  received: '↓',
  swap: '⇄',
  trustline: '⛓',
  other: '·',
}

export function renderDashboard(state: AppState): string {
  const info = state.accountInfo!
  const pk = info.publicKey

  return `
    <div class="dashboard">
      <div class="account-header">
        <div class="account-avatar">◈</div>
        <div class="account-info">
          <div class="account-address">
            <span>${shortenKey(pk, 8)}</span>
            <button class="btn-copy" data-action="copy-address" data-value="${escHtml(pk)}">Copy</button>
          </div>
          <div class="account-meta">
            ${info.subentryCount} trustline${info.subentryCount !== 1 ? 's' : ''}
            ${info.homeDomain ? ` · ${escHtml(info.homeDomain)}` : ''}
          </div>
        </div>
        <div class="account-actions">
          <button class="btn-action send" data-action="goto-send">↑ Send</button>
          <button class="btn-action receive" data-action="goto-receive">↓ Receive</button>
          <button class="btn-refresh" data-action="refresh">↺ Refresh</button>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Assets</div>
            <button class="btn-add-trustline" data-action="goto-trustline">+ Add Trustline</button>
          </div>
          <div class="balance-list">
            ${info.balances.map((b) => `
              <div class="balance-item">
                <div class="asset-icon ${b.isNative ? 'xlm' : ''}">
                  ${escHtml(b.assetCode.slice(0, 3))}
                </div>
                <div class="asset-details">
                  <div class="asset-code">${escHtml(b.assetCode)}</div>
                  ${b.assetIssuer ? `<div class="asset-issuer">${shortenKey(b.assetIssuer, 4)}</div>` : ''}
                </div>
                <div>
                  <div class="asset-balance">${formatAmount(b.balance)}</div>
                  ${b.isNative ? `<div class="available-label">${formatAmount(info.xlmAvailable)} avail.</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title">Account Info</div>
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-label">Network</div>
              <div class="stat-value">${state.network === 'testnet' ? 'Testnet' : 'Mainnet'}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Subentries</div>
              <div class="stat-value">${info.subentryCount}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">XLM Reserve</div>
              <div class="stat-value">${calculateReserve(info.subentryCount).toFixed(1)} XLM</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Assets</div>
              <div class="stat-value">${info.balances.length}</div>
            </div>
          </div>
        </div>

        <div class="card tx-card">
          <div class="card-title">Recent Transactions</div>
          <div class="tx-list">
            ${info.transactions.length === 0
              ? `<div class="empty-tx">No recent transactions found</div>`
              : info.transactions.map((tx) => `
                <div class="tx-item">
                  <div class="tx-icon ${tx.type}">${TX_ICONS[tx.type] ?? '·'}</div>
                  <div class="tx-details">
                    <div class="tx-type">${tx.type}</div>
                    <div class="tx-address">${
                      tx.type === 'sent'
                        ? `To: ${shortenKey(tx.to || '?', 6)}`
                        : `From: ${shortenKey(tx.from || '?', 6)}`
                    }</div>
                  </div>
                  <div class="tx-right">
                    <div class="tx-amount ${tx.type}">
                      ${tx.type === 'sent' ? '−' : '+'}${formatAmount(tx.amount)} ${escHtml(tx.asset)}
                    </div>
                    <div class="tx-time">${formatDate(tx.createdAt)}</div>
                    <a class="tx-hash-link"
                      href="https://stellar.expert/explorer/${state.network === 'mainnet' ? 'public' : 'testnet'}/tx/${tx.hash}"
                      target="_blank" rel="noopener">
                      ${tx.hash.slice(0, 8)}…
                    </a>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    </div>
  `
}
