import type { AccountInfo, AssetBalance, Network, Transaction } from '../types'

const HORIZON_MAINNET = 'https://horizon.stellar.org'
const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'

export function getHorizonUrl(network: Network): string {
  return network === 'mainnet' ? HORIZON_MAINNET : HORIZON_TESTNET
}

export function isValidPublicKey(key: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(key.trim())
}

export function isValidSecretKey(key: string): boolean {
  return /^S[A-Z2-7]{55}$/.test(key.trim())
}

export function isValidAssetCode(code: string): boolean {
  return /^[A-Za-z0-9]{1,12}$/.test(code.trim())
}

export function shortenKey(key: string, chars = 6): string {
  if (key.length <= chars * 2) return key
  return `${key.slice(0, chars)}…${key.slice(-chars)}`
}

export function formatAmount(amount: string, decimals = 7): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return '0'
  if (num === 0) return '0'
  if (num < 0.0001) return num.toFixed(decimals)
  if (num < 1) return num.toFixed(4)
  if (num < 1000) return num.toFixed(2)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Reserve locked up by the protocol: (2 base + 1 per subentry) * 0.5 XLM. */
export function calculateReserve(subentryCount: number): number {
  return (2 + subentryCount) * 0.5
}

interface RawBalance {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
  balance: string
  limit?: string
}

export function parseBalances(rawBalances: RawBalance[]): AssetBalance[] {
  return rawBalances.map((b) => {
    const isNative = b.asset_type === 'native'
    return {
      asset: isNative ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
      assetCode: isNative ? 'XLM' : (b.asset_code ?? 'Unknown'),
      assetIssuer: isNative ? null : (b.asset_issuer ?? null),
      balance: b.balance,
      limit: isNative ? null : (b.limit ?? null),
      isNative,
    }
  })
}

interface RawOperation {
  id: string
  type: string
  transaction_hash: string
  transaction_successful?: boolean
  created_at: string
  from?: string
  to?: string
  funder?: string
  account?: string
  source_account?: string
  asset_type?: string
  asset_code?: string
  selling_asset_code?: string
  amount?: string
  starting_balance?: string
}

export function parseTransaction(op: RawOperation, accountId: string): Transaction {
  const isSent =
    op.from === accountId ||
    op.source_account === accountId ||
    op.funder === accountId

  const assetCode =
    op.asset_type === 'native'
      ? 'XLM'
      : (op.asset_code ?? op.selling_asset_code ?? 'Unknown')

  let type: Transaction['type'] = 'other'
  if (op.type === 'payment') {
    type = isSent ? 'sent' : 'received'
  } else if (op.type === 'create_account') {
    type = isSent ? 'sent' : 'received'
  } else if (op.type === 'path_payment_strict_send' || op.type === 'path_payment_strict_receive') {
    type = 'swap'
  } else if (op.type === 'change_trust') {
    type = 'trustline'
  }

  return {
    id: op.id,
    hash: op.transaction_hash,
    type,
    asset: assetCode,
    amount: op.amount ?? op.starting_balance ?? '0',
    from: op.from ?? op.funder ?? op.source_account ?? '',
    to: op.to ?? op.account ?? '',
    memo: '',
    createdAt: op.created_at,
    successful: op.transaction_successful ?? true,
    fee: '0',
  }
}

const RELEVANT_OP_TYPES = [
  'payment',
  'create_account',
  'path_payment_strict_send',
  'path_payment_strict_receive',
  'change_trust',
]

export async function fetchAccountInfo(
  publicKey: string,
  network: Network
): Promise<AccountInfo> {
  const base = getHorizonUrl(network)

  const accountRes = await fetch(`${base}/accounts/${publicKey}`)
  if (!accountRes.ok) {
    if (accountRes.status === 404) {
      throw new Error('Account not found on the Stellar network. Make sure it is funded.')
    }
    throw new Error(`Failed to load account: ${accountRes.statusText}`)
  }
  const accountData = await accountRes.json()
  const balances = parseBalances(accountData.balances)

  const xlmBalance = balances.find((b) => b.isNative)
  const reserve = calculateReserve(accountData.subentry_count ?? 0)
  const xlmAvailable = xlmBalance
    ? Math.max(0, parseFloat(xlmBalance.balance) - reserve).toFixed(7)
    : '0'

  const opsRes = await fetch(
    `${base}/accounts/${publicKey}/operations?limit=20&order=desc&include_failed=false`
  )
  const opsData = opsRes.ok ? await opsRes.json() : { _embedded: { records: [] } }
  const records: RawOperation[] = opsData._embedded?.records ?? []
  const transactions: Transaction[] = records
    .filter((op) => RELEVANT_OP_TYPES.includes(op.type))
    .map((op) => parseTransaction(op, publicKey))

  return {
    publicKey,
    balances,
    transactions,
    sequence: accountData.sequence,
    subentryCount: accountData.subentry_count ?? 0,
    homeDomain: accountData.home_domain ?? '',
    xlmAvailable,
  }
}

export async function submitPayment(params: {
  secretKey: string
  destination: string
  amount: string
  assetCode: string
  assetIssuer: string | null
  memo: string
  network: Network
}): Promise<string> {
  // Dynamically import the Stellar SDK to keep the initial bundle light —
  // it's only needed once the user actually signs a transaction.
  const { Keypair, Networks, TransactionBuilder, BASE_FEE, Asset, Operation, Memo, Horizon } =
    await import('@stellar/stellar-sdk')

  const server = new Horizon.Server(getHorizonUrl(params.network))
  const keypair = Keypair.fromSecret(params.secretKey)
  const account = await server.loadAccount(keypair.publicKey())

  const asset = params.assetCode === 'XLM'
    ? Asset.native()
    : new Asset(params.assetCode, params.assetIssuer!)

  const networkPassphrase =
    params.network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: params.destination,
        asset,
        amount: params.amount,
      })
    )
    .setTimeout(30)

  if (params.memo.trim()) {
    builder.addMemo(Memo.text(params.memo.trim()))
  }

  const tx = builder.build()
  tx.sign(keypair)

  const result = await server.submitTransaction(tx)
  return result.hash
}

export async function submitTrustline(params: {
  secretKey: string
  assetCode: string
  assetIssuer: string
  limit: string
  network: Network
}): Promise<string> {
  const { Keypair, Networks, TransactionBuilder, BASE_FEE, Asset, Operation, Horizon } =
    await import('@stellar/stellar-sdk')

  const server = new Horizon.Server(getHorizonUrl(params.network))
  const keypair = Keypair.fromSecret(params.secretKey)
  const account = await server.loadAccount(keypair.publicKey())

  const asset = new Asset(params.assetCode, params.assetIssuer)
  const networkPassphrase =
    params.network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset,
        limit: params.limit.trim() || undefined,
      })
    )
    .setTimeout(30)

  const tx = builder.build()
  tx.sign(keypair)

  const result = await server.submitTransaction(tx)
  return result.hash
}