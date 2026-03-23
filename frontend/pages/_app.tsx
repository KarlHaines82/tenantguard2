import type {AppProps} from "next/app";
import {SessionProvider} from "next-auth/react";
import "../styles/globals.css";
import Chat from "@/components/Chat";
import StaffTodoWidget from "@/components/StaffTodoWidget";
import { GoogleAnalytics } from '@next/third-parties/google'
 
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <GoogleAnalytics gaId="G-VSHHRG05DN" />
    </>
  )
}

export default function App({Component, pageProps: {session, ...pageProps}}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <Chat />
      <StaffTodoWidget />
    </SessionProvider>
  );
}
