import atmenSwapAbi from "./AtmenSwap.json";
import ecCommitmentAbi from "./ECCommitment.json";
export const atmenSwapABI = atmenSwapAbi.abi;
export const ecCommitmentABI = ecCommitmentAbi.abi;

import { goerli, sepolia, polygonMumbai, optimismGoerli } from "wagmi/chains";

const mantleTestnet = {
    id: 5001,
    name: "Mantle Testnet",
    network: "mantle",
    nativeCurrency: {
        decimals: 18,
        name: "Mantle Testnet",
        symbol: "MNT",
    },
    rpcUrls: {
        default: {
            http: ["https://rpc.testnet.mantle.xyz"],
        },
        public: {
            http: ["https://rpc.testnet.mantle.xyz"],
        },
    },
    blockExplorers: {
        default: {
            name: "Mantle Ringwood",
            url: "https://explorer.testnet.mantle.xyz",
        },
    },
};

export const supportedChains = [goerli, sepolia, polygonMumbai, optimismGoerli];

export const atmenSwapAddress = process.env.NEXT_PUBLIC_ATMEN_SWAP_ADDRESS;
export const ecCommitmentAddress = process.env.NEXT_PUBLIC_ECCOMMIT_ADDRESS;
export const TIME_LOCK = 240;
