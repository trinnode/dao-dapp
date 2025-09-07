import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { DateTimePicker } from "../DateTimePicker";
import useCreateProposal from "../../hooks/useCreateProposal";
import useBalance from "../../hooks/useBalance";
import { parseEther } from "viem";
import { toast } from "sonner";

export function CreateProposalModal() {
    const [description, setDecription] = useState("");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [deadline, setDeadline] = useState();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const createProposal = useCreateProposal();
    const { balance } = useBalance();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!description.trim()) {
            toast.error("Please enter a description");
            return;
        }
        
        if (!recipient || !recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
            toast.error("Please enter a valid recipient address");
            return;
        }
        
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        
        if (!deadline || deadline <= new Date()) {
            toast.error("Please select a future deadline");
            return;
        }

        setIsSubmitting(true);
        
        try {
            await createProposal(
                description,
                recipient,
                parseEther(amount),
                Math.floor(deadline.valueOf() / 1000)
            );
            
            // Reset form on success
            setDecription("");
            setRecipient("");
            setAmount("");
            setDeadline(undefined);
            setIsOpen(false);
        } catch (error) {
            console.error("Error creating proposal:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Create Proposal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create a New Proposal</DialogTitle>
                        <DialogDescription>
                            Create a new proposal to be executed once all requirements are reached.
                            Your balance: {parseFloat(balance).toFixed(4)} GOV tokens
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description *</Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="Describe your proposal..."
                                value={description}
                                onChange={(e) => setDecription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="recipient">Recipient Address *</Label>
                            <Input
                                id="recipient"
                                name="recipient"
                                placeholder="0x..."
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="amount">Amount (ETH) *</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="0.0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="deadline">Deadline *</Label>
                            <DateTimePicker
                                date={deadline}
                                setDate={setDeadline}
                            />
                        </div>
                    </div>
                    <DialogFooter className="w-full">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !description || !recipient || !amount || !deadline}
                            className="flex-1"
                        >
                            {isSubmitting ? "Creating..." : "Create Proposal"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
