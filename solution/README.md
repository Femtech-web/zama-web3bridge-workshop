# Confidential Payroll: solution

The complete confidential payroll app, with 31 tests covering encrypted salaries, permissions, payments, and withdrawals.

This folder is a standalone project. Use Node 22 and npm 10+; run all commands here.

```bash
nvm use
npm ci
npm run verify
npm run dev
```

Open [localhost:3000](http://localhost:3000). To use a different port, run `npm run dev -- --port 3001`. After `npm run build`, use `npm start` to run the production app.

## Sepolia setup

Local tests need no secrets or testnet funds. For live transactions, connect a browser wallet on Sepolia and fund it with Sepolia ETH for fees.

Create `.env` from `.env.example` if it does not already exist. Set your dedicated testnet `DEPLOYER_PRIVATE_KEY` and matching `WORKSHOP_EMPLOYER_ADDRESS` locally. Then run:

```bash
npm run compile
npm run check:sepolia
npm run deploy:sepolia
npm run check:sepolia
npm run dev
```

Deployment writes `frontend/deployment.json`. Preserve `deployments/` to resume an interrupted deployment. Keep private keys in the ignored `.env` file. Optional frontend settings are in `frontend/.env.example`; Sepolia needs no Zama API key.

`npm run test:sepolia` sends real testnet transactions through the complete flow. It funds a temporary employee with 0.006 Sepolia ETH and refunds unused fees apart from a small reserve.

## Vercel

Set Root Directory to `solution/frontend`, Framework Preset to **Next.js**, and Node.js to **22.x**. Enable **Include source files outside of the Root Directory in the Build Step** so Vercel can use this project's package and lockfile. Keep Output Directory at its default; `frontend/vercel.json` supplies the install and build commands.

Configure the contract addresses in Vercel using `frontend/.env.example` as the variable list, including `PAYROLL_TREASURY_VIEWING=true` for the updated payroll. WalletConnect and a custom RPC are optional. The deployer private key stays local. Redeploy after changing settings, then open the URL listed under the successful deployment's Domains.

## Commands

- `npm run compile`: compile contracts and update frontend ABIs.
- `npm test`: run local contract tests.
- `npm run lint`: check TypeScript, JavaScript, and Solidity.
- `npm run typecheck`: check contract scripts and frontend types.
- `npm run build`: build the frontend for production.
- `npm run format`: format the project.
- `npm run verify`: run all local checks above, checking formatting without changing files.
