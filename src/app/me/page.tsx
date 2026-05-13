
"use client"

import { useMemo, useEffect, useState } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  ChevronRight, 
  Copy, 
  Check, 
  BadgeCheck, 
  Headphones, 
  Pencil,
  CircleDollarSign,
  Wallet,
  ShieldCheck
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  name: string
  email: string
  photoURL: string
  matchFlowId?: string
}

export default function MePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  const profileRef = useMemo(() => {
    return user ? doc(db, "users", user.uid) : null
  }, [db, user])

  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef)

  const handleCopyId = () => {
    if (profile?.matchFlowId) {
      navigator.clipboard.writeText(profile.matchFlowId)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "ID copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (authLoading || profileLoading) return null
  if (!user || !profile) return null

  return (
    <div className="flex-1 pb-20 bg-[#F8F9FA] min-h-screen relative overflow-x-hidden">
      {/* Premium Red Header Background */}
      <div className="absolute top-0 left-0 w-full h-[220px] bg-[#FF3B30]" />

      <div className="relative z-10">
        <header className="relative pt-10 pb-6 px-6 flex flex-col items-center text-center">
          {/* Top Right Visitor Count Badge */}
          <div className="absolute top-4 right-6">
            <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer">
              <span className="text-[9px] font-black text-white">12.5k Visitors</span>
            </div>
          </div>

          <div className="relative mb-3">
            <div className="relative w-24 h-24 rounded-full shadow-2xl overflow-hidden bg-muted border-none">
              <Image 
                src={profile.photoURL || `https://picsum.photos/seed/${user.uid}/300/300`} 
                alt={profile.name} 
                fill 
                className="object-cover" 
                data-ai-hint="person profile"
              />
            </div>
            <button className="absolute bottom-0 right-0 bg-white p-2.5 rounded-full shadow-lg active:scale-90 transition-transform border border-black/5">
              <Pencil className="w-3.5 h-3.5 text-[#FF3B30]" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h2 className="text-lg font-black text-white tracking-tight">{profile.name}</h2>
            <BadgeCheck className="w-3.5 h-3.5 text-white" />
          </div>

          <div 
            className="inline-flex items-center gap-1.5 cursor-pointer active:opacity-60 transition-all"
            onClick={handleCopyId}
          >
            <p className="text-white/70 font-bold text-[9px] tracking-tight">ID:{profile.matchFlowId || "---"}</p>
            {copied ? (
              <Check className="w-2.5 h-2.5 text-green-300" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-white/50" />
            )}
          </div>
        </header>

        <main className="px-6 space-y-6">
          {/* Action cards layered over the red background */}
          <div className="grid grid-cols-2 gap-4 relative z-20">
            <Button 
              className="h-16 bg-white hover:bg-gray-50 border-none rounded-2xl shadow-xl flex flex-col items-center justify-center gap-0.5 text-[#FF3B30] active:scale-95 transition-all"
            >
              <CircleDollarSign className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Recharge</span>
            </Button>
            
            <Button 
              className="h-16 bg-white hover:bg-gray-50 border-none rounded-2xl shadow-xl flex flex-col items-center justify-center gap-0.5 text-black active:scale-95 transition-all"
            >
              <Wallet className="w-4 h-4 text-[#4285F4]" />
              <span className="text-[9px] font-black uppercase tracking-widest">Income</span>
            </Button>
          </div>

          <div className="bg-white rounded-[2rem] p-1.5 shadow-sm border border-black/5 overflow-hidden">
            <div className="flex flex-col">
              <Button variant="ghost" className="h-14 justify-between rounded-[1.5rem] px-4" asChild>
                <Link href="#">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-black text-xs text-black">Verify Now</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>

              <Button variant="ghost" className="h-14 justify-between rounded-[1.5rem] px-4" asChild>
                <Link href="#">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-xl">
                      <Headphones className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-black text-xs text-black">Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>

              <Button variant="ghost" className="h-14 justify-between rounded-[1.5rem] px-4" asChild>
                <Link href="/settings">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <Settings className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="font-black text-xs text-black">Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
