import { describe, expect, it } from 'vitest'
import {
  calculateReserve,
  formatAmount,
  formatDate,
  getHorizonUrl,
  isValidAssetCode,
  isValidPublicKey,
  isValidSecretKey,
  parseBalances,
  parseTransaction,
  shortenKey,
} from './stellar'

describe('getHorizonUrl', () => {
  it('returns the mainnet Horizon URL', () => {
    expect(getHorizonUrl('mainnet')).toBe('https://horizon.stellar.org')
  })

  it('returns the testnet Horizon URL', () => {
    expect(getHorizonUrl('testnet')).toBe('https://horizon-testnet.stellar.org')
  })
})

describe('isValidPublicKey', () => {
  it('accepts a well-formed public key', () => {
    expect(isValidPublicKey('G'.padEnd(56, 'A'))).toBe(true)
  })

  it('rejects a key that does not start with G', () => {
    expect(isValidPublicKey('S'.padEnd(56, 'A'))).toBe(false)
  })

  it('rejects a key of the wrong length', () => {
    expect(isValidPublicKey('GABC')).toBe(false)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(isValidPublicKey(`  ${'G'.padEnd(56, 'A')}  `)).toBe(true)
  })
})

describe('isValidSecretKey', () => {
  it('accepts a well-formed secret key', () => {
    expect(isValidSecretKey('S'.padEnd(56, 'A'))).toBe(true)
  })

  it('rejects a public key passed as a secret key', () => {
    expect(isValidSecretKey('G'.padEnd(56, 'A'))).toBe(false)
  })
})

describe('isValidAssetCode', () => {
  it('accepts 1-12 alphanumeric characters', () => {
    expect(isValidAssetCode('USDC')).toBe(true)
    expect(isValidAssetCode('A')).toBe(true)
    expect(isValidAssetCode('A'.repeat(12))).toBe(true)
  })

  it('rejects codes longer than 12 characters', () => {
    expect(isValidAssetCode('A'.repeat(13))).toBe(false)
  })

  it('rejects codes with symbols', () => {
    expect(isValidAssetCode('US-DC')).toBe(false)
  })
})

describe('shortenKey', () => {
  it('shortens a long key to head…tail', () => {
    const key = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567890ABCDEFGHIJKLMNOPQRST'
    expect(shortenKey(key, 4)).toBe('GABC…QRST')
  })

  it('returns short strings unchanged', () => {
    expect(shortenKey('ABC', 4)).toBe('ABC')
  })
})

describe('formatAmount', () => {
  it('formats zero as "0"', () => {
    expect(formatAmount('0')).toBe('0')
  })

  it('formats a non-numeric string as "0"', () => {
    expect(formatAmount('not-a-number')).toBe('0')
  })

  it('shows more precision for very small amounts', () => {
    expect(formatAmount('0.00001')).toBe('0.0000100')
  })

  it('shows two decimals for amounts in the thousands', () => {
    expect(formatAmount('1234.5')).toBe('1,234.50')
  })
})

describe('calculateReserve', () => {
  it('is 1 XLM with no subentries', () => {
    expect(calculateReserve(0)).toBe(1)
  })

  it('adds 0.5 XLM per subentry', () => {
    expect(calculateReserve(3)).toBe(2.5)
  })
})

describe('formatDate', () => {
  it('reports very recent timestamps as "Just now"', () => {
    expect(formatDate(new Date().toISOString())).toBe('Just now')
  })

  it('reports timestamps from minutes ago in minutes', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(formatDate(fiveMinAgo)).toBe('5m ago')
  })
})

describe('parseBalances', () => {
  it('parses a native XLM balance', () => {
    const result = parseBalances([{ asset_type: 'native', balance: '100.0000000' }])
    expect(result).toEqual([
      { asset: 'XLM', assetCode: 'XLM', assetIssuer: null, balance: '100.0000000', limit: null, isNative: true },
    ])
  })

  it('parses a custom asset balance with an issuer and limit', () => {
    const issuer = 'G'.padEnd(56, 'A')
    const result = parseBalances([
      { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: issuer, balance: '50', limit: '1000' },
    ])
    expect(result).toEqual([
      { asset: `USDC:${issuer}`, assetCode: 'USDC', assetIssuer: issuer, balance: '50', limit: '1000', isNative: false },
    ])
  })
})

describe('parseTransaction', () => {
  const accountId = 'G'.padEnd(56, 'A')

  it('classifies an outgoing payment as sent', () => {
    const tx = parseTransaction(
      {
        id: '1',
        type: 'payment',
        transaction_hash: 'abc',
        created_at: '2026-01-01T00:00:00Z',
        from: accountId,
        to: 'GDEST',
        asset_type: 'native',
        amount: '10',
      },
      accountId
    )
    expect(tx.type).toBe('sent')
    expect(tx.asset).toBe('XLM')
  })

  it('classifies an incoming payment as received', () => {
    const tx = parseTransaction(
      {
        id: '2',
        type: 'payment',
        transaction_hash: 'def',
        created_at: '2026-01-01T00:00:00Z',
        from: 'GSENDER',
        to: accountId,
        asset_type: 'native',
        amount: '10',
      },
      accountId
    )
    expect(tx.type).toBe('received')
  })

  it('classifies a path payment as a swap', () => {
    const tx = parseTransaction(
      {
        id: '3',
        type: 'path_payment_strict_send',
        transaction_hash: 'ghi',
        created_at: '2026-01-01T00:00:00Z',
        source_account: accountId,
        asset_type: 'native',
        amount: '10',
      },
      accountId
    )
    expect(tx.type).toBe('swap')
  })

  it('classifies a change_trust operation as trustline', () => {
    const tx = parseTransaction(
      {
        id: '4',
        type: 'change_trust',
        transaction_hash: 'jkl',
        created_at: '2026-01-01T00:00:00Z',
        source_account: accountId,
        asset_type: 'credit_alphanum4',
        asset_code: 'USDC',
      },
      accountId
    )
    expect(tx.type).toBe('trustline')
    expect(tx.asset).toBe('USDC')
  })
})
