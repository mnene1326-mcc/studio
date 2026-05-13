"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { ChevronLeft, FileText, Gem, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserProfile {
  diamonds?: number
}

/**
 * Income Screen.
 * Features a vibrant blue gradient header, diamond balance display,
 * and an architectural white container.
 */
export default function IncomePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()

  const userRef = useMemoFirebase(() => user?.uid ? doc(db, "users", user.uid) : null, [db, user?.uid])
  const { data: profile } = useDoc<UserProfile>(userRef)

  const diamondBalance = profile?.diamonds?.toFixed(1) || "0.0"

  return (
    <div className="flex-1 bg-[#00A2FF] min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Gradient & Pattern Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00A2FF] via-[#00BFFF] to-[#00D4FF] z-0" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
      
      <header className="relative z-10 px-4 h-16 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-white hover:bg-white/10 rounded-full"
        >
          <ChevronLeft className="w-7 h-7" />
        </Button>
        <h1 className="text-xl font-black text-white tracking-tight">Income</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/10 rounded-full"
        >
          <FileText className="w-6 h-6" />
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col">
        <div className="px-8 pt-10 pb-12 flex flex-col items-center text-center">
          <h2 className="text-2xl font-black text-white mb-6">Balance</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Gem className="w-12 h-12 text-white fill-blue-400/30 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-6 h-6 bg-white/20 blur-sm rounded-full" />
              </div>
            </div>
            <span className="text-6xl font-black text-white tracking-tighter">
              {diamondBalance}
            </span>
          </div>
        </div>

        {/* Architectural White Container */}
        <div className="flex-1 bg-white rounded-t-[3.5rem] shadow-2xl relative">
          <div className="p-10">
            {/* Content area for history or details would go here */}
          </div>

          {/* Floating Reward/Star Badge */}
          <div className="absolute bottom-10 right-8 flex flex-col items-center">
             <div className="relative group active:scale-90 transition-transform cursor-pointer">
                <div className="w-16 h-16 bg-gradient-to-tr from-[#7E57C2] to-[#B39DDB] rounded-full p-1 shadow-lg flex items-center justify-center">
                   <div className="w-full h-full bg-[#9575CD] rounded-full flex items-center justify-center border-2 border-white/20">
                      <div className="w-10 h-10 bg-[#FFB74D] rounded-full flex items-center justify-center shadow-inner">
                         <Star className="w-6 h-6 text-white fill-current" />
                      </div>
                   </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#9575CD] px-3 py-0.5 rounded-full border border-white/30 shadow-md">
                   <span className="text-[10px] font-black text-white">385</span>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
