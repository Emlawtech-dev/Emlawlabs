# Contributing to StellarDash

Thanks for your interest in improving StellarDash! This is a small, focused
project, so the bar for contributing is low — issues, ideas, and PRs are all
welcome.

## Development setup

```bash
git clone https://github.com/Emlawtech-dev/Emlawlabs.git
cd Emlawlabs
npm install
npm run dev
```

The app talks directly to the Stellar Horizon API from the browser — there's
no backend to run.

## Before opening a PR

```bash
npm run type-check   # TypeScript, strict mode
npm test             # unit tests (vitest)
npm run build        # production build
```

All three run in CI on every push and pull request; a PR won't be merged if
any of them fail.

## Project structure

```
src/
├── main.ts            # entry point
├── app.ts              # state + render loop + starfield
├── types/               # shared TypeScript types
├── utils/
│   ├── stellar.ts       # Horizon API calls, tx building, formatting (unit tested)
│   ├── dom.ts            # HTML escaping helper
│   └── qrcode.ts         # QR code URL builder
├── views/                # pure render functions, one per screen
└── handlers/
    └── actions.ts        # event wiring + async actions (connect, send, add trustline...)
```

Views are pure functions: `(state) => htmlString`. Anything that mutates
state or talks to the network lives in `handlers/` or `utils/stellar.ts`,
which keeps the rendering logic easy to test and reason about.

## Ideas for contributions

* Offer swaps via path payments
* Support multiple saved accounts / a "recent accounts" list
* Add a `.env`-driven custom Horizon URL for private/testnet-like networks
* More unit tests around the render functions (e.g. with `jsdom`)

## Reporting issues

Please open an issue before submitting a larger PR so we can agree on the
approach first. For small fixes (typos, obvious bugs), feel free to just
send the PR.

## Security

This app is non-custodial and stores nothing server-side. If you find a
security issue (e.g. a way a secret key could leak), please open an issue
describing it — there's no funds at stake in the app itself, but we still
want to know.

