import { render, showToast, state } from '../app'
import { createInitialSendForm, createInitialTrustlineForm } from '../types'
import type { Network } from '../types'
import {
  fetchAccountInfo,
  isValidAssetCode,
  isValidPublicKey,
  isValidSecretKey,
  submitPayment,
  submitTrustline,
} from '../utils/stellar'

export function bindEvents(): void {
  document.addEventListener('click', handleClick)

  document.getElementById('send-destination')?.addEventListener('input', (e) => {
    state.sendForm.destination = (e.target as HTMLInputElement).value
  })
  document.getElementById('send-amount')?.addEventListener('input', (e) => {
    state.sendForm.amount = (e.target as HTMLInputElement).value
  })
  document.getElementById('send-memo')?.addEventListener('input', (e) => {
    state.sendForm.memo = (e.target as HTMLInputElement).value
  })
  document.getElementById('send-asset')?.addEventListener('change', (e) => {
    state.sendForm.asset = (e.target as HTMLSelectElement).value
    render()
  })

  document.getElementById('trustline-code')?.addEventListener('input', (e) => {
    state.trustlineForm.assetCode = (e.target as HTMLInputElement).value
  })
  document.getElementById('trustline-issuer')?.addEventListener('input', (e) => {
    state.trustlineForm.assetIssuer = (e.target as HTMLInputElement).value
  })
  document.getElementById('trustline-limit')?.addEventListener('input', (e) => {
    state.trustlineForm.limit = (e.target as HTMLInputElement).value
  })
}

function handleClick(e: Event): void {
  const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null
  if (!target) return
  const action = target.dataset['action']

  switch (action) {
    case 'set-network':
      state.network = target.dataset['net'] as Network
      state.error = null
      render()
      break

    case 'connect':
      void handleConnect()
      break

    case 'disconnect':
      Object.assign(state, {
        view: 'connect',
        account: null,
        accountInfo: null,
        loading: false,
        error: null,
        sendForm: createInitialSendForm(),
        trustlineForm: createInitialTrustlineForm(),
      })
      render()
      break

    case 'goto-send':
      state.view = 'send'
      state.sendForm = createInitialSendForm()
      render()
      break

    case 'goto-receive':
      state.view = 'receive'
      render()
      break

    case 'goto-trustline':
      state.view = 'trustline'
      state.trustlineForm = createInitialTrustlineForm()
      render()
      break

    case 'goto-dashboard':
      state.view = 'dashboard'
      render()
      break

    case 'refresh':
      void handleRefresh()
      break

    case 'copy-address': {
      const val = target.dataset['value'] ?? ''
      navigator.clipboard.writeText(val).then(() => {
        target.textContent = 'Copied!'
        target.classList.add('copied')
        setTimeout(() => {
          target.textContent = 'Copy'
          target.classList.remove('copied')
        }, 2000)
        showToast('Address copied to clipboard', 'success')
      })
      break
    }

    case 'submit-send':
      void handleSend()
      break

    case 'submit-trustline':
      void handleAddTrustline()
      break

    case 'open-stellar-lab': {
      const pk = target.dataset['pk'] ?? ''
      const net = state.network === 'mainnet' ? 'public' : 'testnet'
      window.open(`https://stellar.expert/explorer/${net}/account/${pk}`, '_blank')
      break
    }
  }
}

async function handleConnect(): Promise<void> {
  const input = document.getElementById('public-key-input') as HTMLInputElement | null
  const pk = input?.value.trim() ?? ''

  if (!isValidPublicKey(pk)) {
    state.error = 'Invalid public key. It must start with G and be 56 characters long.'
    render()
    return
  }

  state.loading = true
  state.error = null
  state.account = { publicKey: pk, network: state.network }
  render()

  try {
    state.accountInfo = await fetchAccountInfo(pk, state.network)
    state.view = 'dashboard'
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Failed to load account.'
    state.view = 'connect'
    state.account = null
  } finally {
    state.loading = false
    render()
  }
}

async function handleRefresh(): Promise<void> {
  if (!state.account) return
  state.loading = true
  render()
  try {
    state.accountInfo = await fetchAccountInfo(state.account.publicKey, state.network)
    showToast('Account refreshed', 'success')
  } catch {
    showToast('Failed to refresh', 'error')
  } finally {
    state.loading = false
    state.view = 'dashboard'
    render()
  }
}

async function handleSend(): Promise<void> {
  const f = state.sendForm
  const secretInput = document.getElementById('send-secret') as HTMLInputElement | null
  const secret = secretInput?.value.trim() ?? ''

  if (!isValidPublicKey(f.destination)) {
    state.sendForm.error = 'Invalid destination address.'
    render()
    return
  }
  if (!f.amount || parseFloat(f.amount) <= 0) {
    state.sendForm.error = 'Enter a valid amount.'
    render()
    return
  }
  if (!isValidSecretKey(secret)) {
    state.sendForm.error = 'Invalid secret key. It must start with S and be 56 characters.'
    render()
    return
  }

  const info = state.accountInfo!
  const balance = info.balances.find((b) => (b.isNative ? f.asset === 'XLM' : b.assetCode === f.asset))
  const assetIssuer = balance?.assetIssuer ?? null

  state.sendForm.submitting = true
  state.sendForm.error = null
  render()

  try {
    const hash = await submitPayment({
      secretKey: secret,
      destination: f.destination,
      amount: f.amount,
      assetCode: f.asset,
      assetIssuer,
      memo: f.memo,
      network: state.network,
    })

    showToast(`Payment sent! Tx: ${hash.slice(0, 8)}…`, 'success')
    state.view = 'dashboard'
    state.sendForm = createInitialSendForm()
    state.accountInfo = await fetchAccountInfo(state.account!.publicKey, state.network)
    render()
  } catch (err) {
    state.sendForm.error = err instanceof Error ? err.message : 'Transaction failed.'
    state.sendForm.submitting = false
    render()
  }
}

async function handleAddTrustline(): Promise<void> {
  const f = state.trustlineForm
  const secretInput = document.getElementById('trustline-secret') as HTMLInputElement | null
  const secret = secretInput?.value.trim() ?? ''

  if (!isValidAssetCode(f.assetCode)) {
    state.trustlineForm.error = 'Asset code must be 1-12 letters or digits.'
    render()
    return
  }
  if (!isValidPublicKey(f.assetIssuer)) {
    state.trustlineForm.error = 'Invalid issuer address.'
    render()
    return
  }
  if (!isValidSecretKey(secret)) {
    state.trustlineForm.error = 'Invalid secret key. It must start with S and be 56 characters.'
    render()
    return
  }

  state.trustlineForm.submitting = true
  state.trustlineForm.error = null
  render()

  try {
    const hash = await submitTrustline({
      secretKey: secret,
      assetCode: f.assetCode.trim(),
      assetIssuer: f.assetIssuer.trim(),
      limit: f.limit,
      network: state.network,
    })

    showToast(`Trustline added! Tx: ${hash.slice(0, 8)}…`, 'success')
    state.view = 'dashboard'
    state.trustlineForm = createInitialTrustlineForm()
    state.accountInfo = await fetchAccountInfo(state.account!.publicKey, state.network)
    render()
  } catch (err) {
    state.trustlineForm.error = err instanceof Error ? err.message : 'Transaction failed.'
    state.trustlineForm.submitting = false
    render()
  }
}
