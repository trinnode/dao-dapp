import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

// Updated RPC configuration to use Alchemy instead of drpc.org
// Reason: drpc.org was returning 408 timeout errors, causing app crashes
const sepoliaWithAlchemy = {
    ...sepolia,
    rpcUrls: {
        default: {
            http: [import.meta.env.VITE_RPC_URL]
        },
        public: {
            http: [import.meta.env.VITE_RPC_URL]
        }
    }
};

export const config = getDefaultConfig({
    appName: "Cohort Xiii Dao dApp - Trinnex",
    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    chains: [sepoliaWithAlchemy], // Using custom Sepolia config with Alchemy RPC
});
