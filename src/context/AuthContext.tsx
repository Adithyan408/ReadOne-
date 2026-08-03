import { createContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import {type User, onAuthStateChanged} from "firebase/auth"

import {auth} from "../firebase/firebase"

export type AuthContextType = {
    user : User | null;
    setUser: Dispatch<SetStateAction<User | null>>;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null)

export default function AuthProvider({children}:{children:ReactNode}){
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        return onAuthStateChanged(auth, (user) => {
            setUser(user)
            setLoading(false)
        })
    }, [])
    return (
        <AuthContext.Provider value={{user, setUser, loading}}>
            {children}
        </AuthContext.Provider>
    )
}