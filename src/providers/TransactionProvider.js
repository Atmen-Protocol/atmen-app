import React, { useState, useEffect } from "react";
import fetch from "node-fetch";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import {
    supportedChains,
    TIME_LOCK,
    contractABI,
    contractAddress,
} from "@/lib/constants";

export const TransactionContext = React.createContext();

let eth;

// get ethereum Object
if (typeof window !== "undefined") {
    eth = window.ethereum;
}

const getTransactionLink = (chainID, transactionHash) => {
    const chain = supportedChains.find((chain) => chain.id === chainID);
    const blockExplorer = chain.blockExplorers.default;
    return `${blockExplorer.url}/tx/${transactionHash}`;
};

const getChainData = (chainID) => {
    const chain = supportedChains.find((chain) => chain.id === chainID);
    return chain;
};

const getGasPrice = async (chainID) => {
    const chain = supportedChains.find((chain) => chain.id === chainID);
    const provider = new ethers.providers.JsonRpcProvider(
        chain.rpcUrls.default.http[0]
    );
    const gasPrice = await provider.getGasPrice();
    return gasPrice;
};

const getAtomicCloakContract = async (chainID) => {
    if (chainID) {
        const chain = supportedChains.find((chain) => chain.id === chainID);
        const provider = new ethers.providers.JsonRpcProvider(
            chain.rpcUrls.default.http[0]
        );

        const transactionContract = new ethers.Contract(
            contractAddress,
            contractABI,
            provider
        );
        return transactionContract;
    }
    const provider = new ethers.providers.Web3Provider(eth);
    const signer = provider.getSigner();
    const address = contractAddress;

    const transactionContract = new ethers.Contract(
        address,
        contractABI,
        signer
    );
    return transactionContract;
};

const checkIfWalletIsConnected = async (metamask = eth) => {
    try {
        if (!metamask) return alert("Please install metamask ");
        const accounts = await metamask.request({ method: `eth_accounts` });

        if (accounts.length) {
            setCurrentAccount(accounts[0]);
            console.log("Wallet is already connected");
        }
    } catch (error) {
        console.error(error);
        throw new Error("No ethereum object.");
    }
};

const switchNetwork = async (chainID) => {
    checkIfWalletIsConnected();
    const provider = new ethers.providers.Web3Provider(eth);
    if (provider.network.chainId === chainID) return;

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [
                {
                    chainId: "0x" + parseInt(chainId).toString(16),
                },
            ],
        });
        console.log("You have switched to the right network");
    } catch {
        console.log("Please switch to the right network");
        const chainData = getChainData(chainID);
        try {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: "0x" + parseInt(chainId).toString(16),
                        chainName: chainData.name,
                        rpcUrls: chainData.rpcUrls.default.http,
                        blockExplorerUrls: [
                            chainData.blockExplorers.default.url,
                        ],
                        nativeCurrency: chainData.nativeCurrency,
                    },
                ],
            });
        } catch {
            throw new Error("Failed to switch network");
        }
        switchNetwork(chainID);
    }
};

export const TransactionProvider = ({ children }) => {
    const router = useRouter();
    // global app states
    const [currentAccount, setCurrentAccount] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("new");
    const [formData, setFormData] = useState({
        recipient: "",
        amount: "0.001",
        receivingChainName: supportedChains[0].name,
    });
    const [swapDetails, setSwapDetails] = useState({
        originalSwapID: "",
        mirrorSwapID: "",
        sharedSecret: "",
        qx1: "",
        qy1: "",
        qx2: "",
        qy2: "",
        sendingChainID: "",
        receivingChainID: "",
        recipient: "",
        secretKey: "",
        originalSwapTimestamp: "",
        mirrorSwapTimestamp: "",
        value: "",
        originalTransactionLink: "",
        mirrorTransactionLink: "",
        error: "",
    });

    // check connection of wallet
    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    // handle form data
    const handleChange = (value, name) => {
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    // to check wallet connection

    /* 
    to send transaction 
    */
    const sendSwapProposal = async (metamask = eth) => {
        console.log("sendOpenSwapTransaction");
        if (!metamask) return alert("Please install metamask ");

        const { recipient, amount, receivingChainName } = formData;

        // get AtomicCloak contract
        const atomicCloak = await getAtomicCloakContract();
        const parsedAmount = ethers.utils.parseEther(amount);

        const secretKey = ethers.utils.randomBytes(32);
        console.log("secretKey: ", Buffer.from(secretKey).toString("hex"));
        console.log("contract", atomicCloak);
        const [qx1, qy1] = await atomicCloak.commitmentFromSecret(secretKey);
        console.log("here");
        const provider = new ethers.providers.Web3Provider(eth);
        const blockNumBefore = await provider.getBlockNumber();
        const blockBefore = await provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;

        const swapId = await atomicCloak.commitmentToAddress(qx1, qy1);
        console.log("swapId:", swapId, "from", qx1, qy1);

        const _sharedSecret = ethers.utils.randomBytes(32);
        const [qx2, qy2] = await atomicCloak.commitmentFromSharedSecret(
            qx1,
            qy1,
            _sharedSecret
        );

        const mirrorSwapID = await atomicCloak.commitmentToAddress(qx2, qy2);
        const receivingChainID = supportedChains.find(
            (chain) => chain.name === receivingChainName
        ).id;
        const _swapDetails = {
            originalSwapID: swapId,
            mirrorSwapID: mirrorSwapID,
            sharedSecret: "0x" + Buffer.from(_sharedSecret).toString("hex"),
            qx1: qx1._hex,
            qy1: qy1._hex,
            qx2: qx2._hex,
            qy2: qy2._hex,
            sendingChainID: provider.network.chainId,
            receivingChainID: receivingChainID,
            recipient: recipient,
            secretKey: "0x" + Buffer.from(secretKey).toString("hex"),
            originalSwapTimestamp: timestampBefore + 2 * TIME_LOCK, // initial swap has a longer timelock
            mirrorSwapTimestamp: "",
            value: ethers.utils.formatEther(parsedAmount),
        };
        setSwapDetails(_swapDetails);
        try {
            await fetch(process.env.NEXT_PUBLIC_BACKEND_API + "/api/v1/swap", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    originalSwapID: _swapDetails.originalSwapID,
                    mirrorSwapID: _swapDetails.mirrorSwapID,
                    sharedSecret: _swapDetails.sharedSecret,
                    qx1: _swapDetails.qx1,
                    qy1: _swapDetails.qy1,
                    qx2: _swapDetails.qx2,
                    qy2: _swapDetails.qy2,

                    sendingChainID: _swapDetails.sendingChainID,
                    receivingChainID: _swapDetails.receivingChainID,
                    recipient: recipient,
                }),
            });
            setStatus("proposed");
        } catch (error) {
            setIsLoading(false);
            console.error(error);
            return;
        }
    };
    const sendOpenSwapTransaction = async (metamask = eth) => {
        try {
            const trs = await atomicCloak.openETHSwap(
                qx1,
                qy1,
                process.env.NEXT_PUBLIC_BACKEND_ADDRESS, //FIXME: should not hardocde,
                _swapDetails.originalSwapTimestamp,
                {
                    value: parsedAmount,
                }
            );
        } catch (error) {
            setIsLoading(false);
            console.error(error);
            return;
        }
        setIsLoading(true);
        await trs.wait();
        _swapDetails.originalTransactionLink = getTransactionLink(
            _swapDetails.sendingChainID,
            trs.hash
        );
        setSwapDetails(_swapDetails);
        setStatus("open");
        //FIXME: links in page ond't work cause state is not updated at this point but only when function returns
        console.log("Swap opened", _swapDetails);

        const atomicCloakReceivingChain = await getAtomicCloakContract(
            _swapDetails.receivingChainID
        );
        atomicCloakReceivingChain.on("Open", async (_swapID, event) => {
            console.log(
                "Open event received",
                _swapID,
                _swapDetails.mirrorSwapID
            );
            if (_swapID === _swapDetails.mirrorSwapID) {
                const swapPublicData = await atomicCloakReceivingChain.swaps(
                    _swapID
                );
                _swapDetails.mirrorSwapTimestamp = swapPublicData.timelock;
                _swapDetails.mirrorTransactionLink = getTransactionLink(
                    _swapDetails.receivingChainID,
                    event.transactionHash
                );
                setSwapDetails(_swapDetails);
                setStatus("closeable");
                setIsLoading(false);
                atomicCloakReceivingChain.removeAllListeners(); //Maybe dangerous if several swaps open
            }
        });
    };

    const sendCloseSwapTransaction = async () => {
        try {
            switchNetwork(swapDetails.receivingChainID);
        } catch (error) {
            console.error(error);
            return;
        }

        const atomicCloak = await getAtomicCloakContract();
        const curveOrder = await atomicCloak.curveOrder();

        let newSecretKey =
            BigInt(swapDetails.secretKey) + BigInt(swapDetails.sharedSecret);
        newSecretKey %= BigInt(curveOrder._hex);

        const closeTrs = await atomicCloak.closeSwap(
            swapDetails.mirrorSwapID,
            newSecretKey,
            { gasLimit: 1000000 }
        );
        setIsLoading(true);
        setStatus("closing");
        await closeTrs.wait();
        setIsLoading(false);
        setStatus("closed");
    };

    const sendCloseSwapUserOp = async () => {
        const atomicCloak = await getAtomicCloakContract(
            swapDetails.receivingChainID
        );
        const curveOrder = await atomicCloak.curveOrder();

        let newSecretKey =
            BigInt(swapDetails.secretKey) + BigInt(swapDetails.sharedSecret);
        newSecretKey %= BigInt(curveOrder._hex);

        const nonce = await atomicCloak.getNonce();

        let s = newSecretKey.toString(16).padStart(64, "0");
        // while (s.length < 64) {
        //     s = "0" + s;
        // }

        const userOp = {
            sender: contractAddress,
            nonce: nonce.toString(),
            initCode: "0x",
            callData:
                "0x685da727" +
                swapDetails.mirrorSwapID.slice(2).padStart(64, "0") +
                newSecretKey.toString(16).padStart(64, "0"),
            callGasLimit: "0x214C10",
            verificationGasLimit: "0x06E360",
            preVerificationGas: "0x06E360", //fixme: sometimes is too low
            maxFeePerGas: "0x06E360",
            maxPriorityFeePerGas: "0x6f",
            paymasterAndData: "0x",
            signature: "0x",
        };

        // estimate gas cost by running validateSignature_test
        const preVerificationGas =
            await atomicCloak.estimateGas.validateSignature_test(userOp);
        //FIXME: better estimate overhead due to nonce
        const chain = supportedChains.find(
            (chain) => chain.id === swapDetails.receivingChainID
        );
        const provider = new ethers.providers.JsonRpcProvider(
            chain.rpcUrls.default.http[0]
        );
        const feeData = await provider.getFeeData();
        console.log("feeData", feeData);
        userOp.maxFeePerGas = feeData.maxFeePerGas._hex;
        userOp.preVerificationGas =
            "0x" +
            Math.round(1.5 * preVerificationGas + 1000)
                .toString(16)
                .padStart(2, "0");

        const payload = {
            jsonrpc: "2.0",
            id: 1,
            method: "eth_sendUserOperation",
            params: [userOp, "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"],
        };

        console.log("payload", payload);

        let bundlerURL; //FIXME: we shouldnt expose api keys
        if (swapDetails.receivingChainID === 80001) {
            bundlerURL =
                "https://api.stackup.sh/v1/node/" +
                "fde21eaf3765d1c5fa8bc4ba7b42854beb1b3c0775b2d697286932fbcf3dde1d";
        } else if (swapDetails.receivingChainID === 420) {
            bundlerURL =
                "https://api.stackup.sh/v1/node/" +
                "925e1a222d937314eb66a71b3d73975141b5fd6279293ea1c0da2991c123eb49";
        } else if (swapDetails.receivingChainID === 5) {
            bundlerURL =
                "https://api.stackup.sh/v1/node/" +
                "e5739ad56d3a9d370dfba87a6b9ee18a5f02a2f6a271906c377f742f1dad9d80";
        } else if (swapDetails.receivingChainID === 11155111) {
            bundlerURL = "https://cloakbundler.frittura.org";
        } else {
            console.log(
                "User op not available on this network, please close with a normal transaction."
            );
            return;
        }
        setIsLoading(true);
        setStatus("closing");

        const response = await fetch(bundlerURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify(payload),
        });
        const resp = await response.json();
        console.log(resp);
        setIsLoading(false);
        if (resp.error) {
            setStatus("error");
            console.log(resp.error.message);
            swapDetails.error = "Error: " + resp.error.message;
            setSwapDetails(swapDetails);
            return;
        }
        setStatus("closed");
    };

    return (
        <TransactionContext.Provider
            value={{
                currentAccount,
                sendCloseSwapTransaction,
                sendOpenSwapTransaction,
                sendCloseSwapUserOp,
                handleChange,
                formData,
                swapDetails,
                isLoading,
                status,
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
};
