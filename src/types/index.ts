export type Network = 'mainnet' | 'testnet'

export interface WalletAccount {
  publicKey: string
  network: Network
}

export interface AssetBalance {
  asset: string
  assetCode: string
  assetIssuer: string | null
  balance: string
  limit: string | null
  isNative: boolean
}

export interface Transaction {
  id: string
  hash: string
  type: 'sent' | 'received' | 'swap' | 'trustline' | 'other'
  asset: string
  amount: string
  from: string
  to: string
  memo: string
  createdAt: string
  successful: boolean
  fee: string
}

export interface AccountInfo {
  publicKey: string
  balances: AssetBalance[]
  transactions: Transaction[]
  sequence: string
  subentryCount: number
  homeDomain: string
  xlmAvailable: string
}

export type AppView = 'connect' | 'dashboard' | 'send' | 'receive' | 'trustline'

export interface SendForm {
  destination: string
  amount: string
  asset: string
  memo: string
  submitting: boolean
  error: string | null
}

export interface TrustlineForm {
  assetCode: string
  assetIssuer: string
  limit: string
  submitting: boolean
  error: string | null
}

export interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}

export interface AppState {
  view: AppView
  account: WalletAccount | null
  accountInfo: AccountInfo | null
  loading: boolean
  error: string | null
  network: Network
  sendForm: SendForm
  trustlineForm: TrustlineForm
  toast: Toast | null
}

export function createInitialSendForm(): SendForm {
  return { destination: '', amount: '', asset: 'XLM', memo: '', submitting: false, error: null }
}

export function createInitialTrustlineForm(): TrustlineForm {
  return { assetCode: '', assetIssuer: '', limit: '', submitting: false, error: null }
}

export function createInitialState(): AppState {
  return {
    view: 'connect',
    account: null,
    accountInfo: null,
    loading: false,
    error: null,
    network: 'testnet',
    sendForm: createInitialSendForm(),
    trustlineForm: createInitialTrustlineForm(),
    toast: null,
  }
}
