
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Heart } from "lucide-react"

/**
 * Root Redirector with Splash Screen.
 * Uses router.replace to ensure the splash screen doesn't stay in history.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading } = useUser()

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace("/home")
        } else {
          router.replace("/welcome")
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router])

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
