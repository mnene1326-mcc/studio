
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { ref, update, increment as rtdbIncrement, push, set, get } from "firebase/database"
import { useFirestore, useUser, useDoc, useDatabase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Gem, Coins, Banknote, AlertCircle, History, Wallet } from "lucide-react"
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
  
  const [activeTab, setActiveTab] = useState<'convert' | 'withdraw'>('convert')
  const [diamondsToConvert, setDiamondsToConvert] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [balances, setBalances] = useState({ coins: 0, diamonds: 0 })
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
          setBalances({ coins: data.coins || 0, diamonds: data.diamonds || 0 })
        }
      } finally {
        setBalanceLoading(false)
      }
    }
    fetchBalances()
  }, [rtdb, user?.uid])

  const diamondBalance = balances.diamonds
  
  const coinRate = 0.09 
  const cashRate = 0.08 
  const minDiamondsForCash = 12500

  const expectedCoins = Math.floor(Number(diamondsToConvert) * coinRate)
  const expectedKes = (Number(diamondsToConvert) * cashRate).toFixed(2)

  const handleConvert = async () => {
    const amount = Number(diamondsToConvert)
    if (isNaN(amount) || amount < 1000) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Minimum conversion is 1000 diamonds." })
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

      setBalances(prev => ({
        ...prev,
        diamonds: prev.diamonds - amount,
        coins: prev.coins + expectedCoins
      }))

      const historyRef = push(ref(rtdb, `diamond_history/${user?.uid}`))
      await set(historyRef, {
        amount: -amount,
        type: 'conversion',
        description: `Converted to ${expectedCoins} coins`,
        timestamp
      })

      toast({ title: "Success!", description: `Converted to ${expectedCoins} coins.` })
      setDiamondsToConvert("")
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Conversion failed." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number(diamondsToConvert)
    if (isNaN(amount) || amount < minDiamondsForCash) {
      toast({ variant: "destructive", title: "Invalid Amount", description: `Min withdrawal: ${minDiamondsForCash} diamonds.` })
      return
    }
    if (!profile?.agencyId || profile.agencyStatus !== 'approved') {
      toast({ variant: "destructive", title: "Agency Required", description: "You must be an approved member of an agency." })
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
      const historyRef = push(ref(rtdb, `diamond_history/${user?.uid}`))
      await set(historyRef, {
        amount: -amount,
        type: 'withdrawal',
        description: `Withdrawal request for Ksh ${expectedKes}`,
        timestamp
      })

      setBalances(prev => ({
        ...prev,
        diamonds: prev.diamonds - amount
      }))

      toast({ title: "Request Sent", description: "Your agency agent will review your payment." })
      setDiamondsToConvert("")
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
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Available Balance</p>
            <div className="flex items-center gap-3 mb-6">
              <Gem className="w-8 h-8 fill-blue-200" />
              <h2 className="text-4xl font-bold tracking-tight">
                {balanceLoading ? "..." : diamondBalance.toFixed(0)}
              </h2>
            </div>
            <div className="h-px bg-white/20 mb-6" />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Agency ID</p>
                <p className="text-sm font-bold">{profile?.agencyId || "---"}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Status</p>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-100">Approved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-full">
            <button 
              onClick={() => setActiveTab('convert')}
              className={cn("flex-1 py-3 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest", activeTab === 'convert' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}
            >
              To Coins
            </button>
            <button 
              onClick={() => setActiveTab('withdraw')}
              className={cn("flex-1 py-3 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest", activeTab === 'withdraw' ? "bg-white text-green-600 shadow-sm" : "text-gray-400")}
            >
              To Cash
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Diamond Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={activeTab === 'convert' ? "Min 1000" : "Min 12500"}
                  value={diamondsToConvert}
                  onChange={(e) => setDiamondsToConvert(e.target.value)}
                  className="rounded-2xl h-16 pl-12 border-gray-100 bg-gray-50 text-lg font-bold"
                />
                <Gem className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", activeTab === 'convert' ? "text-blue-400" : "text-green-500")} />
              </div>
            </div>

            {Number(diamondsToConvert) > 0 && (
              <div className={cn("p-5 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2", activeTab === 'convert' ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100")}>
                <div className="flex items-center gap-3">
                  {activeTab === 'convert' ? <Coins className="w-5 h-5 text-yellow-500" /> : <Banknote className="w-5 h-5 text-green-600" />}
                  <span className="text-[10px] font-bold text-black uppercase tracking-widest">{activeTab === 'convert' ? 'Estimated Coins' : 'Estimated Payout'}</span>
                </div>
                <span className={cn("text-xl font-bold", activeTab === 'convert' ? "text-blue-600" : "text-green-600")}>
                  {activeTab === 'convert' ? `+${expectedCoins}` : `Ksh ${expectedKes}`}
                </span>
              </div>
            )}

            <Button
              className={cn(
                "w-full h-16 rounded-full text-white font-bold uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all",
                activeTab === 'convert' ? "bg-blue-600" : "bg-green-600"
              )}
              onClick={activeTab === 'convert' ? handleConvert : handleWithdraw}
              disabled={isProcessing || !diamondsToConvert}
            >
              {isProcessing ? "Processing..." : activeTab === 'convert' ? "Convert Now" : "Request Payout"}
            </Button>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-[10px] text-gray-400 font-medium leading-relaxed">
        {activeTab === 'convert' 
          ? "Conversion Rate: 1000 Diamonds = 90 Coins. Coins are added instantly to your balance."
          : "Withdrawal Rate: 1 Diamond = Ksh 0.08. Payouts are reviewed and paid via M-Pesa by your agency agent."}
      </footer>
    </div>
  )
}
