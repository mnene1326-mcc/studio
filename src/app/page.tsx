
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Heart, Mail, Zap } from "lucide-react"

export default function WelcomePage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists() && userDoc.data().onboardingComplete) {
          router.push("/home")
        } else {
          router.push("/onboarding")
        }
      }
    })
    return () => unsubscribe()
  }, [router, auth, db])

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
      </div>

      <footer className="absolute bottom-10 text-[10px] text-muted-foreground font-body uppercase tracking-widest opacity-60">
        Premium Dating for East Africa
      </footer>
    </div>
  )
}
