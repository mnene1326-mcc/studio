
"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, FileText, Gem, Star, RefreshCw, Coins, Banknote, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { requestWithdrawalAction } from "@/app/actions/agency"
import { cn } from "@/lib/utils"

interface UserProfile {
  uid: string
  name: string
  diamonds?: number
  coins?: number
  agencyId?: string
  agencyStatus?: string
}

export default function IncomePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'convert' | 'withdraw'>('convert')
  const [diamondsToConvert, setDiamondsToConvert] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  const userRef = useMemoFirebase(() => user?.uid ? doc(db, "users", user.uid) : null, [db, user?.uid])
  const { data: profile } = useDoc<UserProfile>(userRef)

  const diamondBalance = profile?.diamonds || 0
  
  // Rates
  const coinRate = 0.09 // 1000 = 90
  const cashRate = 0.08 // 1 = 0.08 KES
  const minCashWithdrawalKes = 1000
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
    if (!userRef) return

    setIsProcessing(true)
    try {
      await updateDoc(userRef, {
        diamonds: increment(-amount),
        coins: increment(expectedCoins),
        updatedAt: serverTimestamp()
      })
      toast({ title: "Success!", description: `Converted to ${expectedCoins} coins.` })
      setDiamondsToConvert("")
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update' }))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number(diamondsToConvert)
    if (isNaN(amount) || amount < minDiamondsForCash) {
      toast({ variant: "destructive", title: "Invalid Amount", description: `Minimum withdrawal is ${minDiamondsForCash} diamonds (Ksh 1000).` })
      return
    }
    if (!profile?.agencyId || profile.agencyStatus !== 'approved') {
      toast({ variant: "destructive", title: "Agency Required", description: "You must be an approved member of an agency to withdraw cash." })
      return
    }
    if (amount > diamondBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance" })
      return
    }

    setIsProcessing(true)
    const res = await requestWithdrawalAction(profile.uid, amount, Number(expectedKes), profile.agencyId)
    if (res.success) {
      toast({ title: "Request Sent", description: "Your agency agent will review and process your payment." })
      setDiamondsToConvert("")
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error })
    }
    setIsProcessing(false)
  }

  return (
    <div className="flex-1 bg-[#00A2FF] min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#00A2FF] via-[#00BFFF] to-[#00D4FF] z-0" />
      
      <header className="relative z-10 px-4 h-16 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white rounded-full">
          <ChevronLeft className="w-7 h-7" />
        </Button>
        <h1 className="text-lg font-bold text-white tracking-tight">My Income</h1>
        <div className="w-10" />
      </header>

      <main className="relative z-10 flex-1 flex flex-col">
        <div className="px-8 pt-10 pb-12 flex flex-col items-center text-center">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4">Total Diamonds</h2>
          <div className="flex items-center gap-4">
            <Gem className="w-10 h-10 text-white fill-blue-400/30" />
            <span className="text-6xl font-bold text-white tracking-tighter">{diamondBalance.toFixed(0)}</span>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-t-[3.5rem] shadow-2xl p-8 flex flex-col">
          <div className="flex bg-gray-100 p-1 rounded-full mb-8">
            <button 
              onClick={() => setActiveTab('convert')}
              className={cn("flex-1 py-3 rounded-full text-xs font-bold transition-all", activeTab === 'convert' ? "bg-white text-[#00A2FF] shadow-sm" : "text-gray-400")}
            >
              COINS
            </button>
            <button 
              onClick={() => setActiveTab('withdraw')}
              className={cn("flex-1 py-3 rounded-full text-xs font-bold transition-all", activeTab === 'withdraw' ? "bg-white text-green-600 shadow-sm" : "text-gray-400")}
            >
              CASH (KES)
            </button>
          </div>

          <div className="flex-1 space-y-6">
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
              <p className="text-[10px] font-semibold text-gray-400 px-1">
                {activeTab === 'convert' ? "Rate: 1000 Diamonds = 90 Coins" : "Rate: 1 Diamond = Ksh 0.08"}
              </p>
            </div>

            {Number(diamondsToConvert) > 0 && (
              <div className={cn("p-5 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2", activeTab === 'convert' ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100")}>
                <div className="flex items-center gap-3">
                  {activeTab === 'convert' ? <Coins className="w-5 h-5 text-yellow-500" /> : <Banknote className="w-5 h-5 text-green-600" />}
                  <span className="text-sm font-bold text-black">{activeTab === 'convert' ? 'Estimated Coins' : 'Estimated Payout'}</span>
                </div>
                <span className={cn("text-xl font-bold", activeTab === 'convert' ? "text-[#00A2FF]" : "text-green-600")}>
                  {activeTab === 'convert' ? `+${expectedCoins}` : `Ksh ${expectedKes}`}
                </span>
              </div>
            )}

            {activeTab === 'withdraw' && (!profile?.agencyId || profile.agencyStatus !== 'approved') && (
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-[10px] font-bold text-orange-700 leading-relaxed uppercase">
                  You must join an agency to withdraw cash. Go to your profile to join.
                </p>
              </div>
            )}

            <Button
              className={cn(
                "w-full h-16 rounded-full text-white font-bold uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all",
                activeTab === 'convert' ? "bg-[#00A2FF]" : "bg-green-600"
              )}
              onClick={activeTab === 'convert' ? handleConvert : handleWithdraw}
              disabled={isProcessing || !diamondsToConvert}
            >
              {isProcessing ? "Processing..." : activeTab === 'convert' ? "Convert to Coins" : "Withdraw to M-Pesa"}
            </Button>
          </div>

          <p className="text-[10px] font-medium text-gray-300 text-center mt-6">
            Minimum withdrawal: 12,500 Diamonds (Ksh 1,000). Payments processed weekly.
          </p>
        </div>
      </main>
    </div>
  )
}
