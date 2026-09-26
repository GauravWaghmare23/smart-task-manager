"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";


export default function AuthGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

    useEffect(() => {
        if (loading) {
            return;
        }

        const isLoginPage = pathname === "/login";

        if (!isAuthenticated && !isLoginPage) {
            router.replace("/login");
            return;
        }

        if (isAuthenticated && isLoginPage) {
            if (user?.role === "ADMIN") {
                router.replace("/dashboard/admin");
            } else {
                router.replace("/dashboard/user");
            }
        }

    }, [loading, isAuthenticated, user, pathname, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return children;
}

