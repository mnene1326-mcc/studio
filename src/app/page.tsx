
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { useUser, useFirestore } from "@/firebase"

/**
 * Root Redirector with Splash Screen.
 * Displays only the branding as requested.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const db = useFirestore()

  useEffect(() => {
    if (!loading) {
      const checkDestination = async () => {
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid)
            const snap = await getDoc(userRef)
            if (snap.exists() && snap.data().onboardingComplete) {
              router.replace("/home")
            } else {
              router.replace("/onboarding")
            }
          } catch (e) {
            router.replace("/onboarding")
          }
        } else {
          router.replace("/welcome")
        }
      }

      const timer = setTimeout(() => {
        checkDestination()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router, db])

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black min-h-screen">
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-logo text-white tracking-tight">MatchFlow</h1>
          <div className="h-1 w-12 bg-[#00A2FF] mx-auto rounded-full opacity-50" />
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.6em] ml-2">
            Connect with Heart
          </p>
        </div>
      </div>
    </div>
  )
}
