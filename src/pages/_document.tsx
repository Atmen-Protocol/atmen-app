import { Html, Head, Main, NextScript } from "next/document";

function Document() {
    return (
        <Html className="h-full scroll-smooth bg-black text-white antialiased [font-feature-settings:'ss01']" lang="en">
            <Head>
                <link rel="icon" href="/favicons/favicon.ico" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Lexend:wght@400;500&display=swap" />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css"
                    integrity="sha384-Um5gpz1odJg5Z4HAmzPtgZKdTBHZdw8S29IecapCSB31ligYPhHQZMIlWLYQGVoc"
                    crossOrigin="anonymous"
                />
            </Head>
            <body className="flex h-full flex-col">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}

export default Document;
