
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"

/**
 * Stabilized Entry Point for MatchFlow.
 * Handles both the splash screen and redirect logic in a single Client Component
 * with a robust hydration strategy to prevent mismatch errors.
 */
export default function WelcomePage() {
  const [isMounted, setIsMounted] = useState(false)
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !authLoading) {
      if (user) {
        const checkOnboarding = async () => {
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
        checkOnboarding()
      } else {
        router.replace("/login")
      }
    }
  }, [isMounted, authLoading, user, db, router])

  // Initial shell must be identical on server and client
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-screen">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl font-logo text-primary drop-shadow-sm">MatchFlow</h1>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Entering MatchFlow...</p>
        </div>
      </div>
    </div>
  )
}
