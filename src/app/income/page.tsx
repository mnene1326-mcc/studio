"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, FileText, Gem, Star, RefreshCw, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

interface UserProfile {
  diamonds?: number
  coins?: number
}

export default function IncomePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [diamondsToConvert, setDiamondsToConvert] = useState<string>("")
  const [isConverting, setIsConverting] = useState(false)

  const userRef = useMemoFirebase(() => user?.uid ? doc(db, "users", user.uid) : null, [db, user?.uid])
  const { data: profile } = useDoc<UserProfile>(userRef)

  const diamondBalance = profile?.diamonds || 0
  
  // Rate: 1000 diamonds = 90 coins
  const conversionRate = 0.09
  const expectedCoins = Math.floor(Number(diamondsToConvert) * conversionRate)

  const handleConvert = async () => {
    const amount = Number(diamondsToConvert)
    if (isNaN(amount) || amount < 1000) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Minimum conversion is 1000 diamonds.",
      })
      return
    }

    if (amount > diamondBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You don't have enough diamonds to convert this amount.",
      })
      return
    }

    if (!userRef) return

    setIsConverting(true)
    try {
      await updateDoc(userRef, {
        diamonds: increment(-amount),
        coins: increment(expectedCoins),
        updatedAt: serverTimestamp()
      })
      
      toast({
        title: "Success!",
        description: `Successfully converted ${amount} diamonds to ${expectedCoins} coins.`,
      })
      setDiamondsToConvert("")
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update'
      }))
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="flex-1 bg-[#00A2FF] min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#00A2FF] via-[#00BFFF] to-[#00D4FF] z-0" />
      
      <header className="relative z-10 px-4 h-16 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-white hover:bg-white/10 rounded-full"
        >
          <ChevronLeft className="w-7 h-7" />
        </Button>
        <h1 className="text-xl font-bold text-white tracking-tight">Income</h1>
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
          <h2 className="text-2xl font-bold text-white mb-6">Balance</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Gem className="w-12 h-12 text-white fill-blue-400/30 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
            <span className="text-6xl font-bold text-white tracking-tighter">
              {diamondBalance.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-t-[3.5rem] shadow-2xl p-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-[#00A2FF]" />
              <h3 className="text-xs font-bold text-black uppercase tracking-widest">Convert to Coins</h3>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Min 1000 diamonds"
                  value={diamondsToConvert}
                  onChange={(e) => setDiamondsToConvert(e.target.value)}
                  className="rounded-2xl h-16 pl-12 border-gray-100 bg-gray-50 focus:bg-white transition-colors text-lg font-bold"
                />
                <Gem className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              </div>
              <p className="text-[10px] font-semibold text-gray-400 px-1">
                Rate: 1000 Diamonds = 90 Coins
              </p>
            </div>

            {expectedCoins > 0 && (
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-bold text-black">Estimated Return</span>
                </div>
                <span className="text-xl font-bold text-[#00A2FF]">+{expectedCoins}</span>
              </div>
            )}

            <Button
              className="w-full h-16 rounded-full bg-[#00A2FF] hover:bg-[#0081CC] text-white font-bold uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50"
              onClick={handleConvert}
              disabled={isConverting || !diamondsToConvert || Number(diamondsToConvert) < 1000}
            >
              {isConverting ? "Processing..." : "Convert Diamonds"}
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 text-gray-400">
              <Star className="w-5 h-5 fill-current opacity-20" />
              <p className="text-[10px] font-semibold leading-relaxed">
                Diamonds are earned through interactions and gifts. You can convert them to coins to send more messages or buy premium virtual items.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
