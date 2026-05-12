
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"

export default function WelcomePage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        const checkOnboarding = async () => {
          try {
            const userRef = doc(db, "users", user.uid)
            const userSnap = await getDoc(userRef)
            if (userSnap.exists() && userSnap.data().onboardingComplete) {
              router.push("/home")
            } else {
              router.push("/onboarding")
            }
          } catch (error) {
            router.push("/login")
          }
        }
        checkOnboarding()
      } else {
        router.push("/login")
      }
    }
  }, [authLoading, user, db, router])

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-screen">
      <div className="animate-in fade-in zoom-in duration-700 ease-out flex flex-col items-center gap-6">
        <h1 className="text-5xl font-logo text-primary drop-shadow-sm">MatchFlow</h1>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Entering MatchFlow...</p>
        </div>
      </div>
    </div>
  )
}
