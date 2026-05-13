
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { useUser, useFirestore } from "@/firebase"
import { Heart } from "lucide-react"

/**
 * Root Redirector with Splash Screen.
 * Now checks for onboarding completion before deciding destination.
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
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router, db])

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black min-h-screen">
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <Heart className="w-16 h-16 text-[#00A2FF] fill-current shadow-[0_0_40px_rgba(0,162,255,0.4)] animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-logo text-white tracking-tight">MatchFlow</h1>
          <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.5em] ml-2">Connect with Heart</p>
        </div>
      </div>
    </div>
  )
}
