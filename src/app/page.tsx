
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"

/**
 * Entry Point for MatchFlow.
 * Displays a welcome screen and handles authentication redirection.
 * Uses a hydration check to ensure the server and initial client render match perfectly.
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
      // Small delay to allow the user to see the welcome branding
      const timer = setTimeout(() => {
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
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [mounted, authLoading, user, db, router])

  // To prevent hydration mismatch, the server and first client render MUST be identical.
  // We render a simple white screen until the component has mounted on the client.
  if (!mounted) {
    return (
      <div className="flex-1 bg-white min-h-screen" />
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-screen">
      <div className="animate-in fade-in zoom-in duration-700 ease-out flex flex-col items-center gap-6">
        <h1 className="text-5xl font-logo text-[#FF3B30] drop-shadow-sm">
          MatchFlow
        </h1>

        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-[#FF3B30] animate-spin" />
          <p className="text-[10px] font-black text-[#FF3B30]/60 uppercase tracking-widest">
            Connecting...
          </p>
        </div>
      </div>
    </div>
  )
}
