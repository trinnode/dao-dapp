import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CreateProposalModal } from "../CreateProposalModal";
import { isAddressEqual } from "viem";
import { useAccount } from "wagmi";
import { Toaster } from "sonner";
import { useState } from "react";
import useBalance from "../../hooks/useBalance";
import useContractBalance from "../../hooks/useContractBalance";

const AppLayout = ({ children, chairPersonAddress }) => {
    const { address } = useAccount();
    const { balance, isLoading: balanceLoading } = useBalance();
    const { contractBalance, isLoading: contractBalanceLoading } = useContractBalance();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Check if current user is the chairperson
    const isChairperson = address && chairPersonAddress && isAddressEqual(chairPersonAddress, address);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-amber-50 to-amber-200">
            {/* Desktop Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex justify-between items-center h-16 lg:h-20">
                        <span className="text-xl lg:text-2xl font-extrabold text-amber-700 tracking-tight">
                            DAO dApp
                        </span>
                        <div className="flex gap-2 lg:gap-4 xl:gap-6 items-center">
                            {/* User Balance */}
                            {address && (
                                <div className="flex items-center gap-2 bg-white/90 px-3 lg:px-4 py-2 rounded-xl shadow border border-amber-200">
                                    <span className="text-gray-500 font-medium text-sm lg:text-base">Balance:</span>
                                    <span className="font-bold text-amber-700 text-sm lg:text-base">
                                        {balanceLoading ? "..." : `${parseFloat(balance).toFixed(2)} GOV`}
                                    </span>
                                </div>
                            )}
                            
                            {/* Contract Balance - Only visible to chairperson */}
                            {isChairperson && (
                                <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 px-3 lg:px-4 py-2 rounded-xl shadow border border-green-200">
                                    <span className="text-gray-500 font-medium text-sm lg:text-base">Contract:</span>
                                    <span className="font-bold text-green-700 text-sm lg:text-base">
                                        {contractBalanceLoading ? "..." : `${parseFloat(contractBalance).toFixed(4)} ETH`}
                                    </span>
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        Available
                                    </span>
                                </div>
                            )}
                            
                            <div className="scale-90 lg:scale-100">
                                <ConnectButton />
                            </div>
                            {isChairperson && (
                                <div className="scale-90 lg:scale-100">
                                    <CreateProposalModal />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden">
                        <div className="flex justify-between items-center h-16 py-2">
                            <span className="text-lg font-extrabold text-amber-700 tracking-tight">
                                DAO dApp
                            </span>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-md text-amber-700 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile Menu */}
                        {isMobileMenuOpen && (
                            <div className="border-t border-amber-200 pb-4">
                                <div className="flex flex-col gap-3 pt-4">
                                    {/* User Balance */}
                                    {address && (
                                        <div className="flex items-center justify-between bg-white/90 px-4 py-3 rounded-xl shadow border border-amber-200">
                                            <span className="text-gray-500 font-medium">Your Balance:</span>
                                            <span className="font-bold text-amber-700">
                                                {balanceLoading ? "..." : `${parseFloat(balance).toFixed(2)} GOV`}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Contract Balance - Only visible to chairperson */}
                                    {isChairperson && (
                                        <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 rounded-xl shadow border border-green-200">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 font-medium">Contract Balance:</span>
                                                <span className="text-xs text-green-600">Available for proposals</span>
                                            </div>
                                            <span className="font-bold text-green-700">
                                                {contractBalanceLoading ? "..." : `${parseFloat(contractBalance).toFixed(4)} ETH`}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Connect Button */}
                                    <div className="flex justify-center py-2">
                                        <ConnectButton />
                                    </div>
                                    
                                    {/* Create Proposal Button for Chairperson */}
                                    {isChairperson && (
                                        <div className="flex justify-center py-2">
                                            <CreateProposalModal />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full py-4 sm:py-6 lg:py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white/80 rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white/80 backdrop-blur-md shadow-inner p-4 mt-4 sm:mt-6 lg:mt-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="text-amber-700 font-semibold text-sm sm:text-base">
                        &copy; COHORT XIII {new Date().getFullYear()} | Trinnex
                    </div>
                </div>
            </footer>
            <Toaster />
        </div>
    );
};

export default AppLayout;
