import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState({
        token: null,
        voterName: null,
        constituency: null,
        last4: null,
    });

    const login = (data) =>
        setAuth({
            token: data.token,
            voterName: data.voter_name,
            constituency: data.constituency,
            last4: data.aadhaar_last4,
        });

    const logout = () =>
        setAuth({
            token: null,
            voterName: null,
            constituency: null,
            last4: null,
        });

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
