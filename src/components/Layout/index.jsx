import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CreateProposalModal } from "../CreateProposalModal";
import { isAddressEqual } from "viem";
import { useAccount } from "wagmi";
import { Toaster } from "sonner";
import useBalance from "../../hooks/useBalance";

const AppLayout = ({ children, chairPersonAddress }) => {
    const { address } = useAccount();
    const { balance, isLoading: balanceLoading } = useBalance();

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-amber-50 to-amber-200">
            <header className="h-20 bg-white/80 backdrop-blur-md shadow-md p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <span className="text-2xl font-extrabold text-amber-700 tracking-tight">DAO dApp</span>
                    <div className="flex gap-6 items-center">
                        {address && (
                            <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-xl shadow border border-amber-200">
                                <span className="text-gray-500 font-medium">Balance:</span>
                                <span className="font-bold text-amber-700">
                                    {balanceLoading ? "..." : `${parseFloat(balance).toFixed(4)} GOV`}
                                </span>
                            </div>
                        )}
                        <ConnectButton />
                        {address &&
                            chairPersonAddress &&
                            isAddressEqual(chairPersonAddress, address) && (
                                <CreateProposalModal />
                            )}
                    </div>
                </div>
            </header>
            <main className="flex-1 w-full py-8">
                <div className="container mx-auto bg-white/80 rounded-2xl shadow-lg p-8">
                    {children}
                </div>
            </main>
            <footer className="h-20 bg-white/80 backdrop-blur-md shadow-inner p-4 mt-8">
                <div className="container mx-auto text-center text-amber-700 font-semibold">
                    &copy; COHORT XIII {new Date().getFullYear()} | Trinnex
                </div>
            </footer>
            <Toaster />
        </div>
    );
};

export default AppLayout;
