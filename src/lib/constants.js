import abi from "./AtomicCloak.json";

export const contractABI = abi.abi;

import {
    goerli,
    sepolia,
    gnosisChiado,
    polygonMumbai,
    optimismGoerli,
    zkSyncTestnet,
} from "wagmi/chains";

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

export const supportedChains = [
    goerli,
    sepolia,
    polygonMumbai,
    optimismGoerli,
    // mantleTestnet,
];

export const contractAddress = process.env.NEXT_PUBLIC_ATOMIC_CLOAK_ADDRESS;
export const TIME_LOCK = 240;
