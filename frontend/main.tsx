import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "@/App";
// Internal components
import { Toaster } from "@/components/ui/toaster";
import { WalletProvider } from "@/components/WalletProvider";
import { WrongNetworkAlert } from "@/components/WrongNetworkAlert";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <WrongNetworkAlert />
        <Toaster />
      </QueryClientProvider>
    </WalletProvider>
  </React.StrictMode>,
);
