import { useContext } from "react";
import Link from "next/link";
import { Card } from "@/components/Section";
import Loader from "@/components/Loader";
import Chains from "@/components/Section/Chains";
import Quantity from "@/components/Section/Quantity";
import { TransactionContext } from "@/providers/TransactionProvider";
import { supportedChains } from "@/lib/constants";

const style = {
    content: `bg-[#191B1F] w-[30rem] rounded-2xl p-4`,
    formHeader: `px-2 flex items-center justify-between font-semibold text-xl`,
    formTitle: `px2 flex items-center justify-center font-bold text-2xl`,
    transferPropInput: `bg-transparent placeholder:text-[#B2B9D2] outline-none w-full`,
    transferPropInput2: `bg-transparent text-white outline-none w-full`,
    transferPropContainer: `bg-[#20242A] my-3 rounded-2xl p-4 border border-[#20242A] hover:border-[#41444F] flex justify-between`,
    swapButton: `bg-[#3898FF] w-full my-2 rounded-2xl py-4 px-8 text-xl font-semibold flex items-center justify-center cursor-pointer border border-[#2172E5] hover:border-[#234169]`,
    swapPassed: `bg-[#444444] my-2 rounded-2xl py-4 px-8 text-xl font-semibold flex items-center justify-center`,
};

const getChainName = (chainId: number) => {
    return supportedChains.find((chain) => chain.id === chainId)?.name;
};

const getTokenName = (chainId: number) => {
    return supportedChains.find((chain) => chain.id === chainId)?.nativeCurrency
        .symbol;
};

const isUserOpSupported = (chainId: number) => {
    return (
        getChainName(chainId) === "Goerli" ||
        getChainName(chainId) === "Optimism Goerli" ||
        getChainName(chainId) === "Polygon Mumbai"
        // getChainName(chainId) === "Sepolia"
    );
};

export const Main = () => {
    const {
        status,
        isLoading,
        formData,
        swapDetails,
        handleChange,
        sendCloseSwapTransaction,
        sendOpenSwapTransaction,
        sendCloseSwapUserOp,
    } = useContext(TransactionContext);

    const handleSubmit = (e: any) => {
        if (!isLoading) {
            const { recipient } = formData;
            e.preventDefault();
            sendOpenSwapTransaction();
        }
    };

    return (
        <div className="-mx-4 grid max-w-2xl grid-cols-1 gap-y-10 sm:mx-auto lg:-mx-8 lg:max-w-none lg:grid-cols-2 xl:mx-0 xl:gap-x-8 place-items-center">
            {status === "new" && (
                <>
                    <Card>
                        <div className={style.formTitle}>You Send</div>
                        <div className={style.formHeader}>
                            <div>Value</div>
                        </div>
                        <Quantity />
                        <div className={style.formHeader}>
                            <div>Receiving Address</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <input
                                type="text"
                                className={style.transferPropInput}
                                placeholder="0x..."
                                value={formData.recipient}
                                onChange={(e) =>
                                    handleChange(e.target.value, "recipient")
                                }
                            />
                        </div>
                        <div className={style.formHeader}>
                            <div>Receiving Chain</div>
                        </div>
                        <Chains />
                        {isLoading ? (
                            <div className={style.swapPassed}>
                                Swap (pending)
                            </div>
                        ) : (
                            <button
                                disabled={
                                    isLoading || !formData.recipient
                                        ? true
                                        : false
                                }
                                onClick={(e) => handleSubmit(e)}
                                className={style.swapButton}
                            >
                                Swap
                            </button>
                        )}
                    </Card>
                </>
            )}
            {status !== "new" && (
                <>
                    <Card>
                        <div className={style.formTitle}>You Send</div>
                        <div className={style.formHeader}>
                            <div>Value</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <div className={style.transferPropInput2}>
                                {swapDetails.value.toString() +
                                    " " +
                                    getTokenName(swapDetails.sendingChainID)}
                            </div>
                        </div>

                        <div className={style.formHeader}>
                            <div>Chain</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <div className={style.transferPropInput2}>
                                {getChainName(swapDetails.sendingChainID)}
                            </div>
                        </div>

                        <div className={style.formHeader}>
                            <div>Expiration time</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <div className={style.transferPropInput2}>
                                {new Date(
                                    swapDetails.originalSwapTimestamp * 1000
                                ).toUTCString()}
                            </div>
                        </div>

                        <div className={style.formHeader}>
                            <div>To</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <div className={style.transferPropInput2}>
                                {swapDetails.recipient}
                            </div>
                        </div>

                        <div className={style.formHeader}>
                            <a
                                href={swapDetails.originalTransactionLink}
                                target="_blank"
                            >
                                Swap ID
                            </a>
                        </div>
                        <div className={style.transferPropContainer}>
                            <Link
                                className={style.transferPropInput2}
                                target="_blank"
                                href={swapDetails.originalTransactionLink}
                            >
                                {swapDetails.originalSwapID}
                            </Link>
                        </div>
                        {status === "open" && (
                            <div className={style.swapPassed}>
                                Swap Opened (waiting for mirror swap)
                            </div>
                        )}
                        {status !== "open" && (
                            <div className={style.swapPassed}>Swap Opened</div>
                        )}
                    </Card>
                </>
            )}
            {status !== "new" && status !== "open" && (
                <>
                    <Card>
                        <div className={style.formTitle}>We give</div>
                        <div className={style.formHeader}>
                            <div>Value</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <div className={style.transferPropInput2}>
                                {swapDetails.value.toString() +
                                    " " +
                                    getTokenName(swapDetails.receivingChainID)}
                            </div>
                        </div>

                        <div className={style.formHeader}>
                            <div>Chain</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <div className={style.transferPropInput2}>
                                {getChainName(swapDetails.receivingChainID)}
                            </div>
                        </div>

                        <div className={style.formHeader}>
                            <div>Expiration time</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <div className={style.transferPropInput2}>
                                {new Date(
                                    swapDetails.mirrorSwapTimestamp * 1000
                                ).toUTCString()}
                            </div>
                        </div>

                        <div className={style.formHeader}>
                            <div>To</div>
                        </div>
                        <div className={style.transferPropContainer}>
                            <div className={style.transferPropInput2}>
                                {swapDetails.recipient}
                            </div>
                        </div>

                        <div className={style.formHeader}>
                            <a
                                href={swapDetails.mirrorTransactionLink}
                                target="_blank"
                            >
                                Swap ID
                            </a>
                        </div>
                        <div className={style.transferPropContainer}>
                            <Link
                                href={swapDetails.mirrorTransactionLink}
                                target="_blank"
                            >
                                {swapDetails.mirrorSwapID}
                            </Link>
                        </div>
                        {status === "closeable" && (
                            <div>
                                <button
                                    onClick={() => sendCloseSwapTransaction()}
                                    className={style.swapButton}
                                >
                                    Close Swap (with transaction)
                                </button>
                                {isUserOpSupported(
                                    swapDetails.receivingChainID
                                ) && (
                                    <button
                                        onClick={() => sendCloseSwapUserOp()}
                                        className={style.swapButton}
                                    >
                                        Close Swap (with userOp)
                                    </button>
                                )}
                            </div>
                        )}
                        {status === "closing" && (
                            <div className={style.swapPassed}>
                                Waiting for confirmation
                            </div>
                        )}
                        {status === "closed" && (
                            <div className={style.swapPassed}>Success</div>
                        )}
                        {status === "error" && (
                            <div>
                                <button
                                    onClick={() => sendCloseSwapUserOp()}
                                    className={style.swapButton}
                                >
                                    {swapDetails.error}
                                </button>
                                <button
                                    onClick={() => sendCloseSwapTransaction()}
                                    className={style.swapButton}
                                >
                                    Close Swap (with transaction)
                                </button>
                            </div>
                        )}
                    </Card>
                </>
            )}
            {isLoading ? <Loader /> : null}
        </div>
    );
};
