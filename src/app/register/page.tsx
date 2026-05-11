
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      const userData = {
        uid: user.uid,
        email: user.email,
        onboardingComplete: false,
        createdAt: serverTimestamp(),
      }

      const userRef = doc(db, "users", user.uid)
      
      setDoc(userRef, userData)
        .catch(async (serverError) => {
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
    <div className="flex-1 flex flex-col p-6 space-y-8">
      <header className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/"><ChevronLeft className="w-6 h-6" /></Link>
        </Button>
        <h2 className="text-2xl font-headline text-primary flex-1 text-center pr-10">Join MatchFlow</h2>
      </header>

      <form onSubmit={handleRegister} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="your@email.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="rounded-xl h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Create Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="Minimum 6 characters" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            className="rounded-xl h-12"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full rounded-full h-12 text-lg font-headline"
        >
          {loading ? "Joining..." : "Continue"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
