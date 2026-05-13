
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

/**
 * Silent Entry Point for MatchFlow.
 * Handles instant redirection based on auth status without a splash screen.
 */
export default function EntryPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        const checkStatus = async () => {
          try {
            const userRef = doc(db, "users", user.uid)
            const userSnap = await getDoc(userRef)
            if (userSnap.exists() && userSnap.data().onboardingComplete) {
              router.replace("/home")
            } else {
              router.replace("/onboarding")
            }
          } catch (error) {
            router.replace("/login")
          }
        }
        checkStatus()
      } else {
        router.replace("/login")
      }
    }
  }, [authLoading, user, db, router])

  // Minimal empty shell to avoid hydration mismatches
  return null
}
