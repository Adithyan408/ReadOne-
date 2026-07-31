import { createContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import {type User, onAuthStateChanged} from "firebase/auth"

import {auth} from "../firebase/firebase"

type AuthContextType = {
    user : User | null;
    setUser: Dispatch<SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | null>(null)

export default function AuthProvider({children}:{children:ReactNode}){
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        return onAuthStateChanged(auth, (user) => {
            setUser(user)
        })
    }, [])
    return (
        <AuthContext.Provider value={{user, setUser}}>
            {children}
        </AuthContext.Provider>
    )
}