
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useAuth } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { signInAnonymously } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Mail, Zap } from "lucide-react"
import Image from "next/image"

export default function WelcomePage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && user && hasMounted) {
      const checkOnboarding = async () => {
        setIsRedirecting(true)
        try {
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists() && userSnap.data().onboardingComplete) {
            router.push("/home")
          } else {
            router.push("/onboarding")
          }
        } catch (error) {
          setIsRedirecting(false)
        }
      }
      checkOnboarding()
    }
  }, [user, loading, db, router, hasMounted])

  const handleFastLogin = async () => {
    setIsRedirecting(true)
    try {
      await signInAnonymously(auth)
      router.push("/onboarding?fast=true")
    } catch (error) {
      console.error("Fast login failed", error)
      setIsRedirecting(false)
    }
  }

  // To prevent hydration errors, always render the splash/loading state
  // until the component has mounted on the client.
  if (!hasMounted || loading || isRedirecting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-screen">
        <div className="animate-in fade-in zoom-in duration-700 ease-out">
          <h1 className="text-5xl font-logo text-primary drop-shadow-sm">MatchFlow</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/welcome/1200/1800" 
          alt="Premium background" 
          fill 
          className="object-cover opacity-20"
          priority
          data-ai-hint="romance background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-12 px-8 text-center max-w-lg">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-5xl font-logo text-primary leading-none">MatchFlow</h1>
            <p className="text-lg font-body text-foreground/80 italic leading-relaxed text-balance">
              Where sophisticated hearts connect with purpose.
            </p>
          </div>
        </div>

        <div className="w-full space-y-4 pt-8">
          <Button 
            className="w-full rounded-full h-16 text-lg font-headline bg-primary hover:bg-primary/90 shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95" 
            onClick={() => router.push("/login")}
          >
            <Mail className="w-6 h-6" />
            Continue with Email
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full rounded-full h-16 text-lg font-headline border-2 border-primary/20 text-primary hover:bg-primary/5 shadow-md flex items-center justify-center gap-3 transition-all active:scale-95" 
            onClick={handleFastLogin}
          >
            <Zap className="w-6 h-6 fill-primary/10" />
            Fast Login
          </Button>
        </div>

        <div className="pt-12 space-y-2 opacity-60">
          <p className="text-[10px] font-body uppercase tracking-[0.2em] font-bold">
            The Premier Experience
          </p>
          <p className="text-[10px] font-body uppercase tracking-[0.1em]">
            Exclusively for East Africa
          </p>
        </div>
      </div>
    </div>
  )
}
