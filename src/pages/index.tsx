import React, { useContext } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Header from "@/components/Header";
import { Main } from "@/components/Main";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>
          Atmen Swap
        </title>
        <meta
          name="description"
          content="Privacy preserving cross-chain atomic swaps"
        />
      </Head>
      <Header />
      <main>
        <Main />
      </main>
    </>
  );
};

export default Home;
