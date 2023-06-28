import React, { useState, useEffect } from "react";
import fetch from "node-fetch";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import {
    supportedChains,
    TIME_LOCK,
    atmenSwapABI,
    atmenSwapAddress,
    ecCommitmentABI,
    ecCommitmentAddress,
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

const getContracts = async (chainID) => {
    if (chainID) {
        const chain = supportedChains.find((chain) => chain.id === chainID);
        const provider = new ethers.providers.JsonRpcProvider(
            chain.rpcUrls.default.http[0]
        );

        const atmenSwap = new ethers.Contract(
            atmenSwapAddress,
            atmenSwapABI,
            provider
        );
        const ecCommit = new ethers.Contract(
            ecCommitmentAddress,
            ecCommitmentABI,
            provider
        );

        return { atmenSwap, ecCommit };
    }
    const provider = new ethers.providers.Web3Provider(eth);
    const signer = provider.getSigner();

    const atmenSwap = new ethers.Contract(
        atmenSwapAddress,
        atmenSwapABI,
        signer
    );
    const ecCommit = new ethers.Contract(
        ecCommitmentAddress,
        ecCommitmentABI,
        signer
    );

    return { atmenSwap, ecCommit };
};

export const TransactionProvider = ({ children }) => {
    const router = useRouter();
    // global app states
    const [currentAccount, setCurrentAccount] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("new");
    const [formData, setFormData] = useState({
        recipient: "",
        amount: "0.002",
        receivingChainName: supportedChains[0].name,
    });
    const [swapDetails, setSwapDetails] = useState({
        originalSwapID: "",
        mirrorSwapID: "",
        sharedSecret: "",
        qx1: "",
        qy1: "",
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

    // to connect to the wallet
    const connectWallet = async (metamask = eth) => {
        try {
            if (!metamask) return alert("Please install metamask ");

            const accounts = await metamask.request({
                method: "eth_requestAccounts",
            });

            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object.");
        }
    };

    // to check wallet connection
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

    /* 
    to send transaction 
    */
    const sendOpenSwapTransaction = async (
        metamask = eth,
        connectedAccount = currentAccount
    ) => {
        console.log("sendOpenSwapTransaction");
        try {
            if (!metamask) return alert("Please install metamask ");
            const { recipient, amount, receivingChainName } = formData;

            const { atmenSwap, ecCommit } = await getContracts();
            const parsedAmount = ethers.utils.parseEther(amount);

            const secretKey = ethers.utils.randomBytes(32);
            console.log("secretKey: ", Buffer.from(secretKey).toString("hex"));
            const [qx1, qy1] = await ecCommit.ecmul(
                await ecCommit.gx(),
                await ecCommit.gy(),
                ethers.BigNumber.from(secretKey)
            );

            const swapID = await ecCommit.commitmentFromPoint(qx1, qy1);
            console.log("swapID: ", swapID);

            const provider = atmenSwap.provider;
            const blockNumBefore = await provider.getBlockNumber();
            const blockBefore = await provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;

            const sharedSecret = ethers.utils.randomBytes(32);
            const mirrorSwapID = await ecCommit.commitmentFromSharedSecret(
                qx1,
                qy1,
                sharedSecret
            );
            console.log("mirrorSwapID: ", mirrorSwapID);

            const receivingChainID = supportedChains.find(
                (chain) => chain.name === receivingChainName
            ).id;
            const _swapDetails = {
                originalSwapID: swapID,
                mirrorSwapID: mirrorSwapID,
                sharedSecret: "0x" + Buffer.from(sharedSecret).toString("hex"),
                qx1: qx1._hex,
                qy1: qy1._hex,
                sendingChainID: provider.network.chainId,
                receivingChainID: receivingChainID,
                recipient: recipient,
                secretKey: "0x" + Buffer.from(secretKey).toString("hex"),
                originalSwapTimestamp: timestampBefore + 2 * TIME_LOCK, // initial swap has a longer timelock
                mirrorSwapTimestamp: "",
                value: ethers.utils.formatEther(parsedAmount),
            };
            setSwapDetails(_swapDetails);

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
                    sendingChainID: _swapDetails.sendingChainID,
                    receivingChainID: _swapDetails.receivingChainID,
                    recipient: recipient,
                }),
            });
            console.log("Swap saved to backend");
            const trs = await atmenSwap.openETHSwap(
                _swapDetails.originalSwapID,
                _swapDetails.originalSwapTimestamp,
                process.env.NEXT_PUBLIC_BACKEND_ADDRESS,
                {
                    value: parsedAmount,
                }
            );

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

            const contracts = await getContracts(_swapDetails.receivingChainID);
            const atmenSwapReceivingChain = contracts.atmenSwap;
            atmenSwapReceivingChain.on("Open", async (_swapID, event) => {
                console.log(
                    "Open event received",
                    _swapID,
                    _swapDetails.mirrorSwapID
                );
                if (_swapID === _swapDetails.mirrorSwapID) {
                    const commitmentTimelock =
                        await atmenSwapReceivingChain.commitments(_swapID);

                    _swapDetails.mirrorSwapTimestamp = commitmentTimelock;
                    _swapDetails.mirrorTransactionLink = getTransactionLink(
                        _swapDetails.receivingChainID,
                        event.transactionHash
                    );
                    setSwapDetails(_swapDetails);
                    setStatus("closeable");
                    setIsLoading(false);
                    atmenSwapReceivingChain.removeAllListeners(); //Maybe dangerous if several swaps open
                }
            });
        } catch (error) {
            setIsLoading(false);
            console.error(error);
        }
    };

    const sendCloseSwapTransaction = async () => {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [
                    {
                        chainId:
                            "0x" +
                            parseInt(swapDetails.receivingChainID).toString(16),
                    },
                ],
            });
            console.log("You have switched to the right network");
        } catch (switchError) {
            console.log("Please switch to the right network");
            const chainData = getChainData(swapDetails.receivingChainID);
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId:
                            "0x" +
                            parseInt(swapDetails.receivingChainID).toString(16),
                        chainName: chainData.name,
                        rpcUrls: chainData.rpcUrls.default.http,
                        blockExplorerUrls: [
                            chainData.blockExplorers.default.url,
                        ],
                        nativeCurrency: chainData.nativeCurrency,
                    },
                ],
            });
            return;
        }

        const { atmenSwap, ecCommit } = await getContracts();
        const curveOrder = await ecCommit.q();

        let newSecretKey =
            BigInt(swapDetails.secretKey) + BigInt(swapDetails.sharedSecret);
        newSecretKey %= BigInt(curveOrder._hex);
        console.log(
            "newSecretKey: ",
            swapDetails.mirrorSwapID,
            "0x" + newSecretKey.toString(16)
        );
        try {
            const closeTrs = await atmenSwap.close(
                swapDetails.mirrorSwapID,
                "0x" + newSecretKey.toString(16),
                { gasLimit: 1000000 }
            );
            setIsLoading(true);
            setStatus("closing");
            await closeTrs.wait();
            setIsLoading(false);
            setStatus("closed");
        } catch (error) {
            alert("Transaction failed: " + error.message);
            setIsLoading(false);
        }
    };

    const sendCloseSwapUserOp = async () => {
        const { atmenSwap, ecCommit } = await getContracts(
            swapDetails.receivingChainID
        );
        const fieldOrder = BigInt(await ecCommit.q());

        const modifiedSecret =
            (BigInt(swapDetails.secretKey) + BigInt(swapDetails.sharedSecret)) %
            fieldOrder;

        console.log(
            "\n\nmodifiedSecret: ",
            swapDetails.mirrorSwapID,
            swapDetails.secretKey,
            swapDetails.sharedSecret,
            modifiedSecret.toString(16).padStart(64, "0")
        );

        const nonce = await atmenSwap.getNonce();

        const userOp = {
            sender: atmenSwapAddress,
            nonce: nonce.toString(),
            initCode: "0x",
            callData:
                swapDetails.mirrorSwapID +
                `${modifiedSecret.toString(16).padStart(64, "0")}` +
                "fc334e8c",
            callGasLimit: "0x06E360",
            verificationGasLimit: "0X00",
            preVerificationGas: "0x00",
            maxFeePerGas: "0x06E360",
            maxPriorityFeePerGas: "0x6f",
            paymasterAndData: "0x",
            signature: "0x",
        };

        // estimate gas cost by running validateSignature_test

        const chain = supportedChains.find(
            (chain) => chain.id === swapDetails.receivingChainID
        );
        const provider = new ethers.providers.JsonRpcProvider(
            chain.rpcUrls.default.http[0]
        );
        const feeData = await provider.getFeeData();
        console.log("feeData", feeData);

        // userOp.maxFeePerGas = feeData.maxFeePerGas._hex;
        // userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas._hex;
        const preVerificationGas =
            await atmenSwap.estimateGas.validateSignature_test(userOp);
        console.log("preVerificationGas", preVerificationGas.toNumber());
        userOp.preVerificationGas =
            "0x" + (2 * preVerificationGas.toNumber() + 1000).toString(16);
        userOp.verificationGasLimit = userOp.preVerificationGas;

        //test if userOp is valid
        const preVerificationTest = await atmenSwap.validateSignature_test(
            userOp
        );
        console.log("preVerificationTest", preVerificationTest);

        if (preVerificationTest !== true) {
            setStatus("error");
            swapDetails.error = "Error: preVerificationTest failed";
            setSwapDetails(swapDetails);
            return;
        }

        const payload = {
            jsonrpc: "2.0",
            id: 1,
            method: "eth_sendUserOperation",
            params: [userOp, process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS],
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
                connectWallet,
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
