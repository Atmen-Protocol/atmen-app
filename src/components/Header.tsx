import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const style = {
    buttonPadding: `p-1.5 px-1.5`,
    buttonTextContainer: `h-8 flex items-center`,
    nav: `flex-1 flex justify-center items-center`,
    headerLogo: `flex w-1/4 items-center justify-start`,
    headerTitle: `flex w-1/2 text-2xl font-semibold`,
    buttonsContainer: `flex w-full justify-end items-center font-semibold text-xl`,
    wrapper: `p-4 w-screen flex justify-between items-center`,
    button: `flex items-center justify-center rounded-2xl mx-2 text-[0.9rem] text-md font-semibold cursor-pointer bg-sky-500 hover:bg-sky-700 w-[100px]`,
    buttonAccent: `bg-[#191B1F] px-0 border border-[#191B1F] hover:border-[#191B1F] h-full rounded-2xl flex items-center justify-center text-white`,
};

const Header = () => {
    return (
        <header className="py-10">
            <Container>
                <nav className="relative z-50 flex justify-between">
                    <div className="flex items-center md:gap-x-12">
                        <Image src="/images/new_logo.png" alt="react" height={40} width={40} />
                        <h1 className="headerTitle">Atmen Swap</h1>
                    </div>
                    <Link className={style.button} href="/" aria-label="Home">
                        App
                    </Link>
                    <Link className={style.button} href="docs" aria-label="Home">
                        Docs
                    </Link>

                    <div className="flex items-center gap-x-5 md:gap-x-8">
                        <ConnectButton.Custom>
                            {({ chain, account, mounted, openChainModal, openAccountModal, openConnectModal }) => {
                                const ready = mounted;
                                const connected = ready && account && chain;
                                return (
                                    <div
                                        {...(!ready && {
                                            "aria-hidden": true,
                                            style: {
                                                opacity: 0,
                                                pointerEvents: "none",
                                                userSelect: "none",
                                            },
                                        })}
                                    >
                                        {(() => {
                                            if (!connected) {
                                                return (
                                                    <div onClick={() => openConnectModal()} className={`${style.button} ${style.buttonPadding}`}>
                                                        <div className={`${style.buttonAccent} ${style.buttonPadding}`}>Connect Wallet</div>
                                                    </div>
                                                );
                                            }

                                            if (chain.unsupported) {
                                                return (
                                                    <button onClick={openChainModal} type="button" className={`${style.buttonAccent} ${style.buttonPadding}`}>
                                                        <div className={`${style.buttonTextContainer}`}>Unsupported Network</div>
                                                    </button>
                                                );
                                            }

                                            return (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 12,
                                                    }}
                                                >
                                                    <button onClick={openChainModal} type="button" className={`${style.buttonAccent} ${style.buttonPadding}`}>
                                                        {chain.hasIcon && (
                                                            <div
                                                                style={{
                                                                    background: chain.iconBackground,
                                                                    width: 20,
                                                                    height: 20,
                                                                    borderRadius: 999,
                                                                    overflow: "hidden",
                                                                    marginRight: 10,
                                                                }}
                                                            >
                                                                {chain.iconUrl && (
                                                                    <img
                                                                        alt={chain.name ?? "Chain icon"}
                                                                        src={chain.iconUrl}
                                                                        style={{
                                                                            width: 20,
                                                                            height: 20,
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className={`${style.buttonTextContainer}`}>{chain.name}</div>
                                                    </button>

                                                    <button onClick={openAccountModal} type="button" className={`${style.buttonAccent} ${style.buttonPadding}`}>
                                                        <div className={`${style.buttonTextContainer}`}>{account.displayName}</div>
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            }}
                        </ConnectButton.Custom>
                        <div className="-mr-1 md:hidden">{/* <MobileNavigation /> */}</div>
                    </div>
                </nav>
            </Container>
        </header>
    );
};

export default Header;
