# 🏗 Scaffold-ETH 2

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on the Ethereum blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, **Privy**, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

-   ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
-   🔐 **[Privy Authentication](https://docs.privy.io/)**: Integrated user authentication (email, social, wallet) via Privy.
-   🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
-   🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
-   🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet (via RainbowKit/Wagmi).
-   🔐 **Integration with Wallet Providers**: Connect to different wallet providers (managed via Privy) and interact with the Ethereum network.

![Debug Contracts tab](https://github.com/scaffold-eth/scaffold-eth-2/assets/55535804/b237af0c-5027-4849-a5c1-2e31495cccb1)

## Requirements

Before you begin, you need to install the following tools:

-   [Node (>= v18.18)](https://nodejs.org/en/download/)
-   Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
-   [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2 + Privy, follow the steps below:

1. Clone the repository and install dependencies:

```bash
git clone <your-repo-url> my-privy-app
cd my-privy-app
yarn install
```

2. Set up environment variables. Copy the example file and add your Privy App ID:

```bash
cp packages/nextjs/.env.example packages/nextjs/.env.local
```

Then, edit `packages/nextjs/.env.local` and set your `NEXT_PUBLIC_PRIVY_APP_ID`:

```env
NEXT_PUBLIC_PRIVY_APP_ID=YOUR_PRIVY_APP_ID # Get yours from https://dashboard.privy.io/
```

_(Optional)_ Add your Alchemy API Key and WalletConnect Project ID if needed for broader network support or specific features.

3. Run a local network in the first terminal:

```bash
yarn chain
```

This command starts a local Ethereum network using Hardhat.

4. On a second terminal, deploy the test contract:

```bash
yarn deploy
```

This command deploys the example smart contract to the local network.

5. On a third terminal, start your NextJS app:

```bash
yarn start
```

Visit your app on: `http://localhost:3000`. You can connect using Privy (wallet, email, etc.) and interact with your smart contract using the `Debug Contracts` page.

**Note on Interacting with Contracts & Reading State:**

This Scaffold-ETH 2 setup uses Privy for user authentication and wallet management. While Privy provides integration utilities for Wagmi (`@privy-io/wagmi`), we've observed potential synchronization issues where the state managed by Privy (e.g., the connected account and chain) might not be correctly reflected in standard Wagmi hooks in all environments or versions.

This affects **both writing and reading** state using Wagmi:

-   **Write Operations:** Relying solely on Wagmi's `useWriteContract` or related Scaffold-ETH hooks (`useScaffoldWriteContract`, `useTransactor`) can lead to errors (like "cannot access account" or disabled buttons). To ensure reliable contract write operations, this template uses a manual approach (demonstrated in `/packages/nextjs/app/debug/_components/contract/WriteOnlyFunctionForm.tsx`) involving creating a Viem `WalletClient` from the provider exposed by Privy's `activeWallet`.

-   **Reading State:** Similarly, using Wagmi's `useAccount` hook might not reliably return the connected address or chain information when the user is logged in via Privy. To reliably display user information like the connected wallet address, use Privy's own hooks:
    ```typescript
    import { usePrivy } from "@privy-io/react-auth";
    import { Address as AddressType } from "viem";
    // ... inside your component ...
    const { user } = usePrivy();
    const connectedAddress = user?.wallet?.address as AddressType | undefined;
    // Now use connectedAddress in your UI
    ```
    See `/packages/nextjs/app/page.tsx` for an example of displaying the connected address using `usePrivy`.

This manual flow and direct use of Privy hooks ensure that interactions and displayed data correctly reflect the user's Privy session, bypassing potential inconsistencies in the Wagmi context state.

---

Run smart contract tests with `yarn hardhat:test`

-   Edit your smart contracts in `packages/hardhat/contracts`
-   Edit your frontend homepage at `packages/nextjs/app/page.tsx`.
-   Edit your deployment scripts in `packages/hardhat/deploy`

## Documentation

Visit the official [Scaffold-ETH 2 docs](https://docs.scaffoldeth.io) for more details on its core features (hooks, components, etc.).

Visit the [Privy docs](https://docs.privy.io) for more information on configuring authentication methods, embedded wallets, and other Privy features.

To know more about the original Scaffold-ETH 2 features, check out the [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
