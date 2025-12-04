
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  profile?: {
    bio?: string
    joinDate: string
    coursesCompleted: number
    certificatesEarned: string[]
    friends: string[]
    skillLevel: string
    preferredSubjects: string[]
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updatedUser: User) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeoutId)
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              avatar_url: userData.avatar_url,
              profile: userData.profile
            })
          } else {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              avatar_url: firebaseUser.photoURL || '',
              profile: undefined
            })
            console.warn('Firestore user document missing for UID:', firebaseUser.uid)
          }
        } catch (err) {
          console.error('Error fetching Firestore user document:', err)
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            avatar_url: firebaseUser.photoURL || '',
            profile: undefined
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 5000)

    return () => {
      unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      throw new Error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Create user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
        profile: {
          bio: "",
          joinDate: new Date().toISOString(),
          coursesCompleted: 0,
          certificatesEarned: [],
          friends: [],
          skillLevel: "Beginner",
          preferredSubjects: []
        }
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser)
      setUser(newUser)
    } catch (error: any) {
      throw new Error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await firebaseSignOut(auth)
    } catch (error: any) {
      throw new Error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (updatedUser: User) => {
    try {
      // Only update the fields that have changed
      await updateDoc(doc(db, 'users', updatedUser.id), {
        name: updatedUser.name,
        avatar_url: updatedUser.avatar_url,
        profile: updatedUser.profile
      })
      setUser(updatedUser)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>{children}</AuthContext.Provider>
}
