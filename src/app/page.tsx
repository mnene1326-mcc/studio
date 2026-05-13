
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

/**
 * Silent Entry Point for MatchFlow.
 * Handles instant redirection based on auth status without any visible splash screen.
 * This prevents hydration mismatches by rendering NOTHING during the initial phase.
 */
export default function EntryPage() {
  const [mounted, setMounted] = useState(false)
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading) {
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
  }, [mounted, authLoading, user, db, router])

  // Return null to ensure a silent transition during the redirect phase
  return null
}
