import {Head, Html, Main, NextScript} from "next/document";

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1a56db" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://tenantguard.net" />
      </Head>
      <body>
        <Main/>
        <NextScript/>
      </body>
    </Html>
  );
}
