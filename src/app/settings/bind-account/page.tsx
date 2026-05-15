
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { EmailAuthProvider, linkWithCredential } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ShieldCheck, Loader2, ShieldAlert } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function BindAccountPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const passwordStrength = useMemo(() => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    return (strength / 5) * 100
  }, [password])

  const strengthColor = useMemo(() => {
    if (passwordStrength < 40) return "bg-red-500"
    if (passwordStrength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }, [passwordStrength])

  const strengthText = useMemo(() => {
    if (!password) return ""
    if (passwordStrength < 40) return "Weak"
    if (passwordStrength < 80) return "Fair"
    return "Strong"
  }, [passwordStrength, password])

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !email || !password) return
    
    if (passwordStrength < 60) {
      toast({ variant: "destructive", title: "Weak Password", description: "Please use a stronger password with a mix of characters." })
      return
    }

    setLoading(true)
    try {
      const credential = EmailAuthProvider.credential(email, password)
      
      // Upgrade anonymous account to permanent
      await linkWithCredential(user, credential)
      
      // Update the user record with the new email
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { email: email })

      toast({
        title: "Account Secured",
        description: "Your guest account is now linked to your email.",
      })
      router.push("/settings")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Binding Failed",
        description: error.message || "Could not link account. Email might already be in use.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-base font-black text-black">Bind Account</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 p-8 space-y-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-[#00A2FF]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-black">Secure Your Profile</h2>
            <p className="text-xs font-bold text-gray-400 leading-relaxed px-4">
              Add an email and password to ensure you never lose your coins, matches, and diamonds.
            </p>
          </div>
        </div>

        <form onSubmit={handleBind} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</Label>
              <Input 
                type="email" 
                placeholder="your@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="rounded-2xl h-14 border-gray-100 bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</Label>
              <Input 
                type="password" 
                placeholder="Min 8 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="rounded-2xl h-14 border-gray-100 bg-gray-50 focus:bg-white"
              />
              {password && (
                <div className="px-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Strength: {strengthText}</span>
                    {passwordStrength >= 80 ? <ShieldCheck className="w-3 h-3 text-green-500" /> : <ShieldAlert className="w-3 h-3 text-red-400" />}
                  </div>
                  <Progress value={passwordStrength} className="h-1" indicatorClassName={strengthColor} />
                  <p className="text-[8px] text-gray-400 font-medium">Mix uppercase, lowercase, numbers & symbols</p>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Bind Account"}
          </Button>
        </form>
      </main>
    </div>
  )
}
