
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

export default function RootPage() {
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="bg-primary/10 p-6 rounded-full">
        <Heart className="w-16 h-16 text-primary fill-primary/20" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-headline text-primary">MatchFlow</h1>
        <p className="text-muted-foreground font-body text-lg italic">Connect with Heart, Flow with Soul</p>
      </div>
      <div className="w-full max-w-xs space-y-4">
        <Button 
          className="w-full rounded-full h-12 text-lg font-headline bg-primary hover:bg-primary/90" 
          onClick={() => router.push("/register")}
        >
          Create Account
        </Button>
        <Button 
          variant="outline" 
          className="w-full rounded-full h-12 text-lg font-headline border-primary text-primary hover:bg-primary/10" 
          onClick={() => router.push("/login")}
        >
          Login
        </Button>
      </div>
    </div>
  )
}
