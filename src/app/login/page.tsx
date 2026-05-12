
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Mail, UserPlus, Loader2 } from "lucide-react"
import Link from "next/link"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"

export default function UnifiedAuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()

  const generateMatchFlowId = () => {
    const min = 1000000; // 7 digits
    const max = 999999999; // 9 digits
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists() && userSnap.data().onboardingComplete) {
        router.push("/home")
      } else {
        router.push("/onboarding")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      })
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both email and password.",
      })
      return
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters.",
      })
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      const userData = {
        uid: user.uid,
        email: user.email,
        matchFlowId: generateMatchFlowId(),
        onboardingComplete: false,
        createdAt: serverTimestamp(),
      }

      const userRef = doc(db, "users", user.uid)
      
      setDoc(userRef, userData)
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: userData,
          } satisfies SecurityRuleContext)
          errorEmitter.emit('permission-error', permissionError)
        })
      
      router.push("/onboarding")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      })
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-10 bg-background min-h-screen">
      <header className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-xl font-headline text-primary flex-1 text-center pr-10">Email Access</h2>
      </header>

      <div className="flex-1 flex flex-col justify-center space-y-8 max-w-sm mx-auto w-full">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-headline text-primary">Welcome Back</h1>
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Login or Join MatchFlow</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-tighter ml-1">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="rounded-2xl h-14 border-muted shadow-sm focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" dangerouslySetInnerHTML={{ __html: 'Password' }} className="text-[10px] font-black uppercase tracking-tighter ml-1" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="rounded-2xl h-14 border-muted shadow-sm focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-full h-14 text-base font-headline bg-primary shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5" /> Login</>}
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black text-muted-foreground uppercase">or</span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            <Button 
              type="button"
              variant="outline"
              disabled={loading} 
              onClick={handleRegister}
              className="w-full rounded-full h-14 text-base font-headline border-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Create Account</>}
            </Button>
          </div>
        </form>

        <p className="text-[10px] text-center text-muted-foreground font-body px-8 leading-relaxed">
          By continuing, you agree to MatchFlow's <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
