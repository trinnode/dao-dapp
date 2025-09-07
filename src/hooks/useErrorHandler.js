import { useState, useCallback } from "react";
import { toast } from "sonner";

const useErrorHandler = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAsync = useCallback(async (asyncFunction, options = {}) => {
        const { 
            loadingMessage = "Processing...", 
            successMessage = "Operation completed successfully",
            errorMessage = "An error occurred",
            showLoading = true,
            showSuccess = true,
            showError = true
        } = options;

        setIsLoading(true);
        setError(null);

        if (showLoading) {
            toast.loading(loadingMessage);
        }

        try {
            const result = await asyncFunction();
            
            if (showSuccess) {
                toast.success(successMessage);
            }
            
            return result;
        } catch (err) {
            const errorMsg = err?.message || errorMessage;
            setError(errorMsg);
            
            if (showError) {
                toast.error(errorMsg);
            }
            
            console.error("Operation failed:", err);
            throw err;
        } finally {
            setIsLoading(false);
            toast.dismiss();
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isLoading,
        error,
        handleAsync,
        clearError,
    };
};

export default useErrorHandler;
