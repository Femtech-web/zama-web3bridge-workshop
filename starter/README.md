# Confidential Payroll: starter

Fill in the 14 numbered TODOs to build confidential payroll. The initial tests run three baseline checks and leave 28 exercise tests pending. Run `npm run test:full` as you complete the lesson.

Search for `Slide 5` or `Step 1` in the code to follow the master guide. Slide numbers match the 16-slide presentation; step numbers match the 14 exercises. Comments marked **Prepared demo** or **Prepared reference** identify code to explain rather than fill in. The [live guide](../workshop-guide/LIVE_WORKSHOP.md#slide-to-code-map) lists the mapping.

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

Use the solution for the live workshop. To deploy your completed starter, set Root Directory to `starter/frontend`, Framework Preset to **Next.js**, and Node.js to **22.x**. Enable **Include source files outside of the Root Directory in the Build Step**. Keep Output Directory at its default; `frontend/vercel.json` supplies the install and build commands.

Configure the contract addresses in Vercel's environment variables using `frontend/.env.example`. The deployer private key stays local. Redeploy after changing settings.

## Commands

- `npm run compile`: compile contracts and update frontend ABIs.
- `npm test`: run local contract tests.
- `npm run lint`: check TypeScript, JavaScript, and Solidity.
- `npm run typecheck`: check contract scripts and frontend types.
- `npm run build`: build the frontend for production.
- `npm run format`: format the project.
- `npm run verify`: run all local checks above, checking formatting without changing files.
