"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface User {
  id: string
  name: string
  avatar: string
  email?: string
}

interface UserContextValue {
  currentUser: User
  setCurrentUser: (user: User) => void
}

const defaultUser: User = {
  id: "1",
  name: "John Doe",
  avatar: "JD",
  email: "john@example.com",
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser)

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}



