
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Heart, Mail, Zap } from "lucide-react"

/**
 * WelcomePage - The entry point for the application.
 * Features MatchFlow branding and primary navigation to login/registration.
 */
export default function WelcomePage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const db = useFirestore()

  // If already logged in, provide a way to jump straight to home
  // but keep the Welcome screen as the main entry as requested.
  useEffect(() => {
    if (!loading && user) {
      const checkOnboarding = async () => {
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists() && userSnap.data().onboardingComplete) {
          router.push("/home")
        }
      }
      checkOnboarding()
    }
  }, [user, loading, db, router])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in zoom-in duration-700 bg-gradient-to-b from-background to-secondary/20">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-full shadow-xl mx-auto w-fit">
          <Heart className="w-16 h-16 text-primary fill-primary/10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-headline text-primary tracking-tight">MatchFlow</h1>
          <p className="text-muted-foreground font-body text-lg italic">Connect with Heart, Flow with Soul</p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button 
          className="w-full rounded-full h-14 text-lg font-headline bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center gap-2" 
          onClick={() => router.push("/register")}
        >
          <Mail className="w-5 h-5" />
          Continue with Email
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full rounded-full h-14 text-lg font-headline border-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm flex items-center justify-center gap-2" 
          onClick={() => router.push("/login")}
        >
          <Zap className="w-5 h-5 fill-primary/10" />
          Fast Login
        </Button>

        {user && !loading && (
          <Button 
            variant="link" 
            className="w-full text-primary font-body"
            onClick={() => router.push("/home")}
          >
            Enter MatchFlow as member
          </Button>
        )}
      </div>

      <footer className="absolute bottom-10 text-[10px] text-muted-foreground font-body uppercase tracking-widest opacity-60">
        Premium Dating for East Africa
      </footer>
    </div>
  )
}
