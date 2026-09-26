"use client";

import { getCurrentUser } from "@/services/api/auth.api";
import {
    logout,
    setAuthLoading,
    setCredentials,
} from "@/store/slices/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function AuthProvider({ children }) {
    const dispatch = useDispatch();

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                dispatch(setAuthLoading(false));
                return;
            }

            try {
                const data = await getCurrentUser();

                dispatch(
                    setCredentials({
                        user: data.data,
                        token,
                    })
                );
            } catch (error) {
                localStorage.removeItem("token");
                dispatch(logout());
            }
        };

        restoreSession();
    }, [dispatch]);

    return children;
}