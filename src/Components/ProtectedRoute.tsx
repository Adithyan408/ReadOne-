import React, { useContext, type ReactNode } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({children}:{children:ReactNode}) {
    const user = useContext(AuthContext)

    if(!user){
        return <Navigate to={"/login"} replace/>
    }
  return <>{children}</>
}

export default ProtectedRoute
