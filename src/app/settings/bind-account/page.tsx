
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EmailAuthProvider, linkWithCredential } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ShieldCheck, Loader2 } from "lucide-react"

export default function BindAccountPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !email || !password) return
    
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
                placeholder="Min 6 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="rounded-2xl h-14 border-gray-100 bg-gray-50 focus:bg-white"
              />
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
