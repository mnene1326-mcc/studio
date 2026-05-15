
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ref, onValue, query as rtdbQuery, limitToLast } from "firebase/database"
import { useUser, useDatabase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Coins, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  timestamp: number
}

export default function CoinHistoryPage() {
  const router = useRouter()
  const { user } = useUser()
  const rtdb = useDatabase()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    // Economical Limit: Only load the last 50 coin events
    const historyRef = rtdbQuery(ref(rtdb, `coin_history/${user.uid}`), limitToLast(50))
    
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({ 
          id, 
          ...val 
        })).sort((a, b) => b.timestamp - a.timestamp)
        setTransactions(list)
      } else { 
        setTransactions([]) 
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid, rtdb])

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b sticky top-0 bg-white z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-base font-black text-black">Wallet History</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00A2FF]" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-40 px-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Coins className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-bold text-sm uppercase tracking-widest text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-sm", 
                    tx.amount > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-black">{tx.description}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {format(tx.timestamp, "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-sm font-black tracking-tight", 
                    tx.amount > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
