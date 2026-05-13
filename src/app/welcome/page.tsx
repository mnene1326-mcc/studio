
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Mail, Zap, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { signInAnonymously } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useAuth, useUser, useFirestore } from "@/firebase"
import Image from "next/image"

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if logged in and onboarding is complete before skipping
  useEffect(() => {
    if (!authLoading && user) {
      const checkRedirect = async () => {
        try {
          const userRef = doc(db, "users", user.uid)
          const snap = await getDoc(userRef)
          if (snap.exists() && snap.data().onboardingComplete) {
            router.replace("/home")
          }
          // Note: We don't auto-redirect to onboarding here to avoid losing query params like ?fast=true
        } catch (e) {
          // Stay on welcome
        }
      }
      checkRedirect()
    }
  }, [user, authLoading, router, db])

  const handleFastLogin = async () => {
    setLoading(true)
    try {
      await signInAnonymously(auth)
      router.push("/onboarding?fast=true")
    } catch (error) {
      setLoading(false)
    }
  }

  if (!mounted || authLoading) {
    return <div className="flex-1 bg-black min-h-screen" />
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/matchwelcome/1000/1500" 
          alt="Welcome" 
          fill 
          className="object-cover opacity-60 grayscale-[0.2]"
          data-ai-hint="couple romance"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-8 pt-24 pb-20 justify-between items-center text-center">
        <div className="flex flex-col items-center justify-center space-y-10 mt-6">
          <div className="relative">
            <Heart className="w-14 h-14 text-[#00A2FF] fill-current drop-shadow-[0_0_30px_rgba(0,162,255,0.6)] animate-pulse" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-logo text-white drop-shadow-2xl tracking-tight">
              MatchFlow
            </h1>
            <p className="text-white/70 font-black text-[9px] uppercase tracking-[0.6em] ml-2">
              Connect with Heart
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-5 mb-6">
          <Button 
            onClick={() => router.push("/login")}
            className="w-full h-16 rounded-full bg-[#00A2FF] hover:bg-[#0081CC] text-white font-black text-sm tracking-widest uppercase shadow-2xl active:scale-95 transition-all"
          >
            <div className="flex items-center justify-center gap-3">
              <Mail className="w-5 h-5" />
              Continue with Email
            </div>
          </Button>

          <Button 
            disabled={loading}
            onClick={handleFastLogin}
            variant="outline"
            className="w-full h-16 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/20 font-black text-sm tracking-widest uppercase active:scale-95 transition-all"
          >
            <div className="flex items-center justify-center gap-3">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 text-[#FFD600] fill-current" />
              )}
              Fast matching
            </div>
          </Button>

          <div className="pt-8">
            <p className="text-[10px] text-white/40 font-bold px-6 leading-relaxed">
              By entering, you confirm you are 18+ and agree to our <span className="underline text-white/60">Terms</span> and <span className="underline text-white/60">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
