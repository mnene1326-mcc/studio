
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Check onboarding status to decide where to send the user
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

  return (
    <div className="flex-1 flex flex-col p-6 space-y-8">
      <header className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/"><ChevronLeft className="w-6 h-6" /></Link>
        </Button>
        <h2 className="text-2xl font-headline text-primary flex-1 text-center pr-10">Login</h2>
      </header>

      <form onSubmit={handleLogin} className="space-y-6">
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
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="rounded-xl h-12"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full rounded-full h-12 text-lg font-headline"
        >
          {loading ? "Logging in..." : "Continue"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
