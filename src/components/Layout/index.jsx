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
        <div className="w-full h-full">
            <header className="h-20 bg-amber-100 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <span className="text-lg font-bold">DAO dApp</span>
                    <div className="flex gap-4 items-center">
                        {address && (
                            <div className="text-sm bg-white px-3 py-1 rounded-lg shadow-sm">
                                <span className="text-gray-600">Balance: </span>
                                <span className="font-semibold">
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
            <main className="min-h-[calc(100vh-10rem)] w-full">
                <div className="container mx-auto">{children}</div>
            </main>
            <footer className="h-20 bg-amber-100 p-4">
                <div className="container mx-auto">
                    &copy; cohort xiii {new Date().getFullYear()}
                </div>
            </footer>
            <Toaster />
        </div>
    );
};

export default AppLayout;
