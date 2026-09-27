# ✦ StellarDash

A local-first Stellar wallet dashboard built with TypeScript and Vite. View your balances, transaction history, and send payments, manage trustlines to custom assets, and share a QR code to receive — all from the browser with no server or signup required.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)
![Stellar](https://img.shields.io/badge/Stellar-SDK%2012-7B68EE?style=flat&logo=stellar&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite&logoColor=white)
![CI](https://github.com/deslawson/Emlawlabs/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

## Features

- **View Balances** — See all your XLM and custom asset balances with available amounts
- **Transaction History** — View your recent payments, receives, swaps, and trustline changes with links to Stellar Expert
- **Send Payments** — Sign and submit payments directly in the browser using your secret key
- **Add Trustlines** — Opt in to hold a custom asset by adding a trustline to its issuer, with an optional limit
- **Receive** — Show your address (and a scannable QR code) for others to send to
- **Testnet & Mainnet** — Switch between networks easily
- **No backend** — Talks directly to Horizon API, nothing is stored or sent to any server of ours
- **Animated starfield** — Because space

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+

### Installation

```bash
git clone https://github.com/deslawson/Emlawlabs.git
cd Emlawlabs
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Try it on Testnet

1. Go to [Stellar Friendbot](https://laboratory.stellar.org/#account-creator?network=test) to generate and fund a testnet account
2. Copy the public key (starts with `G`)
3. Paste it into StellarDash on Testnet mode
4. Explore your account!

## Sending Payments

To send a payment, you'll need your **secret key** (starts with `S`). It is used only to sign the transaction locally in your browser — it is never sent to any server.

> ⚠️ Never share your secret key with anyone. Only use this on trusted devices.

## Adding a Trustline

Stellar requires an account to explicitly "trust" an asset before it can
hold it. From the dashboard, click **+ Add Trustline**, enter the asset
code and the issuer's public key, sign with your secret key, and the asset
will appear in your balance list once the trustline is created. Each
trustline reserves 0.5 XLM from your account balance while it's active.

## Project Structure

```
Emlawlabs/
├── index.html
├── src/
│   ├── main.ts               # entry point
│   ├── app.ts                 # state + render loop + starfield
│   ├── types/
│   │   └── index.ts           # shared TypeScript types
│   ├── utils/
│   │   ├── stellar.ts         # Horizon API, tx building, formatting (unit tested)
│   │   ├── stellar.test.ts    # unit tests for the above
│   │   ├── dom.ts             # HTML escaping helper
│   │   └── qrcode.ts          # QR code image URL builder
│   ├── views/                 # pure render functions, one per screen
│   │   ├── connect.ts
│   │   ├── dashboard.ts
│   │   ├── send.ts
│   │   ├── receive.ts
│   │   ├── trustline.ts
│   │   ├── nav.ts
│   │   └── toast.ts
│   ├── handlers/
│   │   └── actions.ts         # event wiring + async actions
│   └── styles/
│       └── main.css           # design system + all styles
├── .github/workflows/ci.yml   # type-check, test, build on every push/PR
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

Views are pure `(state) => htmlString` functions; anything that mutates
state or talks to the network lives in `handlers/` or `utils/stellar.ts`.
See [CONTRIBUTING.md](CONTRIBUTING.md) for more detail.

## Tech Stack

| Tool | Purpose |
|---|---|
| **TypeScript** | Strictly typed app logic (strict mode, no implicit any) |
| **Vite** | Dev server and bundler |
| **Vitest** | Unit tests for the Stellar/Horizon utility layer |
| **@stellar/stellar-sdk** | Transaction building and signing |
| **Stellar Horizon API** | Account data and transaction submission |

## Testing

```bash
npm test          # run once
npm run test:watch # watch mode
npm run type-check # strict TypeScript check
```

These, plus a production build, run automatically in GitHub Actions on
every push and pull request — see `.github/workflows/ci.yml`.

## Deploying to GitHub Pages

```bash
npm run build
npm run deploy
```

(`gh-pages` is already a dev dependency, and `vite.config.ts` uses a
relative `base: './'`, so the build works unchanged under any GitHub
Pages subpath.)

## Contributing

This project is part of the [Stellar Wave Program](https://www.drips.network/wave/stellar). Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the project structure, dev setup, and how to submit a PR.

## Security

- Secret keys are used only in-memory for transaction signing and are never logged, stored, or transmitted
- All Horizon requests go directly to `horizon.stellar.org` or `horizon-testnet.stellar.org`
- Public keys shown on the Receive screen are sent to a public QR-code image service purely to render the QR code — public keys aren't sensitive, so this carries no security risk; secret keys are never sent anywhere

## License

[MIT](LICENSE)
