import React, { useContext } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Header from "@/components/Header";
import Link from "next/link";
import katex from "katex";

const style = {
    content: `w-[70%] p-8 text-xl items-center justify-between mx-auto leading-normal`,
    subtitle: `px-2 my-b8 flex items-center justify-center font-semibold text-3xl`,
    title: `px2 my-2 flex items-center justify-center font-bold text-4xl`,
    header: `px-2 my-4 flex font-semibold text-2xl`,
    link: `text-blue-600 hover:text-blue-800`,
};
const Eq = (equation: { children: string }) => {
    return (
        <a
            dangerouslySetInnerHTML={{
                __html: katex.renderToString(equation.children, {
                    throwOnError: false,
                }),
            }}
        />
    );
};

const Docs: NextPage = () => {
    return (
        <>
            <Head>
                <title>Atmen Swap</title>
                <meta name="description" content="Privacy preserving cross-chain atomic swaps" />
            </Head>
            <Header />
            <main>
                <div className={style.content}>
                    <div className={style.title}>Atmen Swap</div>
                    <div className={style.subtitle}>Mixer-style privacy preserving cross-chain atomic swaps</div>
                    <div className={style.header}>How it works</div>
                    Atmen Swap is an atomic swap protocol with added privacy. In a normal{" "}
                    <Link className={style.link} target="_blank" href="https://en.bitcoin.it/wiki/Atomic_swap">
                        atomic swap
                    </Link>
                    , Alice and Bob exchange tokens on two different blockchains by creating a pair of transactions and the protocol guarantees that either both
                    transactions happen or none. The two transactions can be linked together because they contain the same hash commitment.
                    <ul> </ul>
                    Atmen Swap provides privacy to users with the following improvements on the atomic swap protocol:
                    <ul className="mt-4">
                        <li className="ml-4">
                            <b>Elliptic Curve Commitments:</b> The hash commitment is replaced with an elliptic curve commitment. Rather than sharing the same
                            commitment, the two transactions are linked together by a secret only known to the two parties. See more in the "Elliptic Curve
                            Commitments" section.
                        </li>
                        <li className="ml-4">
                            <b>Address Hiding:</b> The swap recipient addresses can be brand new accounts never used before and therefore unlinked to the users.
                            We enable this functionality by using{" "}
                            <Link href="https://eips.ethereum.org/EIPS/eip-4337" target="_blank">
                                {" "}
                                account abstraction
                            </Link>
                            . Swaps can be closed by user operations rather than transactions, which means that the receiving addresses must not be prefunded.
                        </li>
                        <li className="ml-4">
                            <b>Swaps Bundling:</b> The app UI only allows for a limited amount of value options, so that linking two specific transactions
                            together becomes even harder. In the next version of the protocol, several swaps coming from different chains can be bundled
                            together into a single transaction, further increasing privacy.
                        </li>
                    </ul>
                    <div className={style.header}>Elliptic Curve Commitments</div>
                    <p>
                        The privacy and atomicity of Atmen Swap relies on the{" "}
                        <a href="https://en.wikipedia.org/wiki/Discrete_logarithm">discrete log problem</a>, the same cryptography that protects Ethereum secret
                        keys. The protocol is similar to Schnorr signatures with an empty message hash.
                    </p>
                    <ol>
                        <li>Alice and Bob agree for a swap.</li>
                        <li>
                            Alice chooses a secret key <Eq> s_A \in Z^*_q</Eq> and computes <Eq> Q_A = G^&#123;s_A&#125; </Eq>, where <Eq> G </Eq> is the
                            generator of <code>secp256k1</code> elliptic curve group. Note that <Eq> s_A </Eq> cannot be recovered from <Eq> Q_A </Eq> .
                        </li>
                        <li>
                            Alice creates an atomic swap with Bob by locking tokens in a contract. Tokens can be withdrawn:
                            <ul className="mt-4">
                                <li className="ml-4">
                                    by Bob after presenting <Eq> s_A </Eq>, or
                                </li>
                                <li className="ml-4">by Alice after the timeout period has elapsed.</li>
                            </ul>
                        </li>
                        <li>
                            Alice generates a random <Eq>z\in Z^*_q</Eq> and sends it together with her preferred receiving address to Bob.
                        </li>
                        <li>
                            Bob computes <Eq> Q_B = Q_A G^z</Eq> and creates an atomic swap with Alice&#39;s receiving address. The timeout must be shorter than
                            on Alice&#39;s contract.
                        </li>
                        <li>
                            At this point Alice can compute <Eq>Q_B</Eq> and withdraw from Bob&#39;s contract by presenting <Eq>s_B = s_A + z</Eq>, since{" "}
                            <Eq> G^&#123;s_B&#125; = Q_B</Eq> . In doing so, she reveals <Eq> s_B</Eq> .
                        </li>
                        <li>
                            Bob can now compute <Eq> s_A = s_B - z</Eq> and withdraw from Alice&#39;s contract.
                        </li>
                    </ol>
                    <div className={style.header}>Vision</div>
                    <ul className="mt-4">
                        <li>
                            <b className="ml-4">Customizable Commitments:</b> We implement commitments in a customizable way. The protocol allows users to
                            select the commitment type most suitable for their application. For instance, if privacy is not required, a normal hash commitment
                            is a cheaper gas option compared to elliptic curve commitments. For more general applications though, we plan to implement ZK
                            commitment schemes, allowing users to prove "interesting" properties of the commitment, such as that the secret also solves a
                            certain cryptographic problem.
                        </li>
                        <li>
                            <b>Generic action on secret reveal:</b> When a secret resolving a commitment is revealed, the protocol allows users to perform any
                            action, for which atomic swaps are only a particular use-case. This allows users to implement a wide range of applications. ZK
                            proofs are especially important in this context.
                        </li>
                        <li>
                            <b>Crypto on-boarding:</b> The protocol does not require to run on a blockchain. We envision a future where the Atmen protocol
                            enables trustless transactions between any currencies, including fiat ones.
                        </li>
                    </ul>
                </div>
            </main>
        </>
    );
};

export default Docs;
