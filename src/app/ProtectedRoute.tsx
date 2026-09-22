import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import type { JSX } from "react";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, isOtpVerified , isLoading} = useAuth();

    if (isLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
        // return(null);
    }

    if (isAuthenticated && !isOtpVerified) {
        return <Navigate to="/otp" replace />;
    }

    return children;
};
