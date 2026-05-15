
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ref, get } from "firebase/database"
import { useUser, useDatabase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Gem, History, Info } from "lucide-react"

/**
 * @fileOverview Read-only Diamond Income viewer.
 * Conversion and Withdrawal have been moved to the Agency Member Center.
 */
export default function IncomePage() {
  const router = useRouter()
  const { user } = useUser()
  const rtdb = useDatabase()
  
  const [balances, setBalances] = useState({ coins: 0, diamonds: 0 })
  const [balanceLoading, setBalanceLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    const fetchBalances = async () => {
      try {
        const snap = await get(ref(rtdb, `balances/${user.uid}`))
        if (snap.exists()) {
          const data = snap.val()
          setBalances({ coins: data.coins || 0, diamonds: data.diamonds || 0 })
        }
      } finally {
        setBalanceLoading(false)
      }
    }
    fetchBalances()
  }, [rtdb, user?.uid])

  const diamondBalance = balances.diamonds

  return (
    <div className="flex-1 bg-[#00A2FF] min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#00A2FF] via-[#00BFFF] to-[#00D4FF] z-0" />
      
      <header className="relative z-10 px-4 h-16 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white rounded-full">
          <ChevronLeft className="w-7 h-7" />
        </Button>
        <h1 className="text-lg font-bold text-white tracking-tight">My Earnings</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push("/income/history")} className="text-white rounded-full">
          <History className="w-6 h-6" />
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col">
        <div className="px-8 pt-10 pb-12 flex flex-col items-center text-center">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4">Total Diamonds</h2>
          <div className="flex items-center gap-4">
            <Gem className="w-10 h-10 text-white fill-blue-400/30" />
            <span className="text-6xl font-bold text-white tracking-tighter">
              {balanceLoading ? "..." : diamondBalance.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-t-[3.5rem] shadow-2xl p-8 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Info className="w-8 h-8 text-[#00A2FF]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-black">Financial Center</h3>
              <p className="text-sm text-gray-500 px-6 leading-relaxed">
                To convert your Diamonds to Coins or withdraw cash, please visit the <span className="font-bold text-[#00A2FF]">Agency Center</span> on your profile.
              </p>
            </div>
            <Button 
              onClick={() => router.push("/me")}
              className="w-full h-14 rounded-full bg-gray-100 text-gray-600 font-bold uppercase tracking-widest text-xs"
            >
              Go to Profile
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
