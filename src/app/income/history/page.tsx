"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ref, onValue, query as rtdbQuery, limitToLast } from "firebase/database"
import { useUser, useDatabase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Gem, ArrowUpRight, ArrowDownLeft, Loader2, Sparkles, History } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  amount: number
  type: 'gift' | 'reply' | 'conversion' | 'withdrawal'
  description: string
  timestamp: number
}

export default function DiamondHistoryPage() {
  const router = useRouter()
  const { user } = useUser()
  const rtdb = useDatabase()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    // Economical Limit: Only load the last 50 diamond events using RTDB query
    const historyQuery = rtdbQuery(ref(rtdb, `diamond_history/${user.uid}`), limitToLast(50))
    
    const unsubscribe = onValue(historyQuery, (snapshot) => {
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
        <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Diamond Statement</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#00A2FF]" />
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Accessing Ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-12 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center">
              <History className="w-10 h-10 text-blue-200" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm uppercase tracking-widest text-black">No History Yet</p>
              <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase">Your diamond activity will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Activity</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <p className="text-[9px] font-bold text-gray-400 uppercase">Live Records</p>
              </div>
            </div>
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-6 hover:bg-gray-50/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95",
                    tx.amount > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {tx.amount > 0 ? (
                      <div className="relative">
                        <ArrowUpRight className="w-6 h-6" />
                        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 animate-pulse" />
                      </div>
                    ) : (
                      <ArrowDownLeft className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-[13px] text-black tracking-tight">{tx.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                        {format(tx.timestamp, "MMM d")} • {format(tx.timestamp, "HH:mm")}
                      </span>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest",
                        tx.amount > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {tx.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-lg font-black tracking-tighter",
                      tx.amount > 0 ? "text-green-600" : "text-black"
                    )}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </span>
                    <Gem className={cn("w-3.5 h-3.5 fill-current", tx.amount > 0 ? "text-green-500" : "text-red-400")} />
                  </div>
                  <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">
                    ID: {tx.id.substring(0, 8)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="p-10 text-center bg-gray-50/50">
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.25em] leading-relaxed max-w-[200px] mx-auto">
          Diamond history is strictly limited to the last 50 transactions for performance.
        </p>
      </footer>
    </div>
  )
}
