
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { ref, update, increment as rtdbIncrement, push, set, get } from "firebase/database"
import { useFirestore, useUser, useDoc, useDatabase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Gem, Coins, Banknote, History, Wallet, ArrowRightLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { requestWithdrawalAction } from "@/app/actions/agency"
import { cn } from "@/lib/utils"

interface UserProfile {
  uid: string
  name: string
  agencyId?: string
  agencyStatus?: string
}

export default function AgencyMemberPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const rtdb = useDatabase()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'withdraw' | 'convert'>('withdraw')
  const [diamondsToUse, setDiamondsToUse] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [balances, setBalances] = useState(() => {
    if (typeof window !== 'undefined' && user?.uid) {
      const cached = localStorage.getItem(`balance_cache_${user.uid}`)
      if (cached) return JSON.parse(cached)
    }
    return { coins: 0, diamonds: 0 }
  })
  const [balanceLoading, setBalanceLoading] = useState(true)

  const userRef = user?.uid ? doc(db, "users", user.uid) : null
  const { data: profile } = useDoc<UserProfile>(userRef)

  useEffect(() => {
    if (!user?.uid) return
    const fetchBalances = async () => {
      try {
        const snap = await get(ref(rtdb, `balances/${user.uid}`))
        if (snap.exists()) {
          const data = snap.val()
          const newBal = { coins: data.coins || 0, diamonds: data.diamonds || 0 }
          setBalances(newBal)
          localStorage.setItem(`balance_cache_${user.uid}`, JSON.stringify(newBal))
        }
      } finally {
        setBalanceLoading(false)
      }
    }
    fetchBalances()
  }, [rtdb, user?.uid])

  const diamondBalance = balances.diamonds
  
  // Rates
  const coinRate = 0.09 
  const cashRate = 0.08 
  const minDiamondsForCash = 12500
  const minDiamondsForCoins = 1000

  const expectedCoins = Math.floor(Number(diamondsToUse) * coinRate)
  const expectedKes = (Number(diamondsToUse) * cashRate).toFixed(2)

  const handleConvert = async () => {
    const amount = Number(diamondsToUse)
    if (isNaN(amount) || amount < minDiamondsForCoins) {
      toast({ variant: "destructive", title: "Invalid Amount", description: `Minimum: ${minDiamondsForCoins} diamonds.` })
      return
    }
    if (amount > diamondBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance" })
      return
    }

    setIsProcessing(true)
    try {
      const timestamp = Date.now()
      const balRef = ref(rtdb, `balances/${user?.uid}`)
      
      await update(balRef, {
        diamonds: rtdbIncrement(-amount),
        coins: rtdbIncrement(expectedCoins),
        updatedAt: timestamp
      })

      const newBal = {
        coins: balances.coins + expectedCoins,
        diamonds: balances.diamonds - amount
      }
      setBalances(newBal)
      if (user?.uid) localStorage.setItem(`balance_cache_${user.uid}`, JSON.stringify(newBal))

      await set(push(ref(rtdb, `diamond_history/${user?.uid}`)), {
        amount: -amount,
        type: 'conversion',
        description: `Converted to ${expectedCoins} coins`,
        timestamp
      })

      toast({ title: "Success!", description: "Coins added to balance." })
      setDiamondsToUse("")
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Operation failed." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number(diamondsToUse)
    if (isNaN(amount) || amount < minDiamondsForCash) {
      toast({ variant: "destructive", title: "Invalid Amount", description: `Min withdrawal: ${minDiamondsForCash} diamonds.` })
      return
    }
    if (!profile?.agencyId || profile.agencyStatus !== 'approved') {
      toast({ variant: "destructive", title: "Agency Required" })
      return
    }
    if (amount > diamondBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance" })
      return
    }

    setIsProcessing(true)
    const res = await requestWithdrawalAction(profile.uid, amount, Number(expectedKes), profile.agencyId)
    if (res.success) {
      const timestamp = Date.now()
      await set(push(ref(rtdb, `diamond_history/${user?.uid}`)), {
        amount: -amount,
        type: 'withdrawal',
        description: `Withdrawal request for Ksh ${expectedKes}`,
        timestamp
      })

      const newBal = { ...balances, diamonds: balances.diamonds - amount }
      setBalances(newBal)
      if (user?.uid) localStorage.setItem(`balance_cache_${user.uid}`, JSON.stringify(newBal))

      toast({ title: "Request Sent", description: "Your agent will review your payment." })
      setDiamondsToUse("")
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error })
    }
    setIsProcessing(false)
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-sm font-bold text-black uppercase tracking-widest">Agency Wallet</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push("/income/history")} className="rounded-full">
          <History className="w-5 h-5 text-black" />
        </Button>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div className="bg-gradient-to-br from-purple-600 to-purple-400 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Available Diamonds</p>
            <div className="flex items-center gap-3 mb-6">
              <Gem className="w-8 h-8 fill-purple-200" />
              <h2 className="text-4xl font-bold tracking-tight">
                {balanceLoading && balances.diamonds === 0 ? "..." : diamondBalance.toFixed(0)}
              </h2>
            </div>
            <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Agency ID</p>
                <p className="text-xs font-bold">{profile?.agencyId || "---"}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Status</p>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-100">Approved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-full">
            <button 
              onClick={() => setActiveTab('withdraw')}
              className={cn("flex-1 py-3 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest", activeTab === 'withdraw' ? "bg-white text-green-600 shadow-sm" : "text-gray-400")}
            >
              Convert to Cash
            </button>
            <button 
              onClick={() => setActiveTab('convert')}
              className={cn("flex-1 py-3 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest", activeTab === 'convert' ? "bg-white text-purple-600 shadow-sm" : "text-gray-400")}
            >
              Convert to Coins
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Amount of Diamonds</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={activeTab === 'withdraw' ? `Min ${minDiamondsForCash}` : `Min ${minDiamondsForCoins}`}
                  value={diamondsToUse}
                  onChange={(e) => setDiamondsToUse(e.target.value)}
                  className="rounded-2xl h-16 pl-12 border-gray-100 bg-gray-50 text-lg font-bold"
                />
                <Gem className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", activeTab === 'withdraw' ? "text-green-500" : "text-purple-400")} />
              </div>
            </div>

            {Number(diamondsToUse) > 0 && (
              <div className={cn("p-5 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2", activeTab === 'withdraw' ? "bg-green-50 border-green-100" : "bg-purple-50 border-purple-100")}>
                <div className="flex items-center gap-3">
                  {activeTab === 'withdraw' ? <Banknote className="w-5 h-5 text-green-600" /> : <Coins className="w-5 h-5 text-yellow-500" />}
                  <span className="text-[10px] font-bold text-black uppercase tracking-widest">{activeTab === 'withdraw' ? 'Estimated Payout' : 'Estimated Coins'}</span>
                </div>
                <span className={cn("text-xl font-bold", activeTab === 'withdraw' ? "text-green-600" : "text-purple-600")}>
                  {activeTab === 'withdraw' ? `Ksh ${expectedKes}` : `+${expectedCoins}`}
                </span>
              </div>
            )}

            <Button
              className={cn(
                "w-full h-16 rounded-full text-white font-bold uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all",
                activeTab === 'withdraw' ? "bg-green-600" : "bg-purple-600"
              )}
              onClick={activeTab === 'withdraw' ? handleWithdraw : handleConvert}
              disabled={isProcessing || !diamondsToUse}
            >
              {isProcessing ? "Processing..." : (
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  {activeTab === 'withdraw' ? "Request Cash Payout" : "Convert to Coins"}
                </div>
              )}
            </Button>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center bg-gray-50/50">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] leading-relaxed">
          {activeTab === 'withdraw' 
            ? "Cash Payout: 1 Diamond = Ksh 0.08. Minimum 12,500 diamonds (Ksh 1,000). Paid via M-Pesa by your agent."
            : "Coin Conversion: 1,000 Diamonds = 90 Coins. Coins are added instantly to your balance."}
        </p>
      </footer>
    </div>
  )
}
