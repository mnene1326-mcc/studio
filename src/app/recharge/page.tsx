
"use client"

import { useState, Suspense, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { doc, query, collection, where, limit } from "firebase/firestore"
import { ref, get } from "firebase/database"
import { useFirestore, useUser, useDoc, useMemoFirebase, useDatabase, useCollection } from "@/firebase"
import { Button } from "@/components/ui/button"
import { ChevronLeft, CreditCard, Loader2, History, Users, MessageSquare, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { initiatePesaPalPayment } from "@/app/actions/pesapal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface UserProfile {
  uid: string
  name: string
  email: string
  photoURL: string
  isCoinSeller?: boolean
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <div className={cn("w-10 h-10 rounded-full bg-[#FFD600] flex items-center justify-center shadow-sm", className)}>
      <span className="text-white font-bold text-xl italic drop-shadow-sm">S</span>
    </div>
  )
}

const PACKAGES = [
  { amount: 500, price: 80.0 },
  { amount: 1000, price: 120.0 },
  { amount: 2000, price: 230.0 },
  { amount: 5000, price: 550.0 },
  { amount: 10000, price: 1000.0 },
  { amount: 20000, price: 1800.0 },
]

function RechargeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const db = useFirestore()
  const rtdb = useDatabase()
  const { toast } = useToast()
  
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [currentCoins, setCurrentCoins] = useState(() => {
    if (typeof window !== 'undefined' && user?.uid) {
      const cached = localStorage.getItem(`balance_cache_${user.uid}`)
      if (cached) return JSON.parse(cached).coins || 0
    }
    return 0
  })

  const userRef = useMemoFirebase(() => user?.uid ? doc(db, "users", user.uid) : null, [db, user?.uid])
  const { data: profile } = useDoc<UserProfile>(userRef)

  // Economical Coin Seller Query
  const sellersQuery = useMemo(() => query(
    collection(db, "users"),
    where("isCoinSeller", "==", true),
    limit(10)
  ), [db])
  const { data: sellers } = useCollection<UserProfile>(sellersQuery)

  useEffect(() => {
    if (!user?.uid) return
    const fetchBalance = async () => {
      try {
        const snap = await get(ref(rtdb, `balances/${user.uid}`))
        if (snap.exists()) {
          const data = snap.val()
          const coins = data.coins || 0
          setCurrentCoins(coins)
          const cached = localStorage.getItem(`balance_cache_${user.uid}`)
          const balanceData = cached ? JSON.parse(cached) : { diamonds: 0 }
          localStorage.setItem(`balance_cache_${user.uid}`, JSON.stringify({ ...balanceData, coins }))
        }
      } catch (err) {}
    }
    fetchBalance()
  }, [user?.uid, rtdb])

  const handlePayment = async () => {
    const pkg = PACKAGES.find(p => p.amount === selectedPackage)
    if (!user || !profile || !pkg) return
    setLoading(true)
    try {
      const result = await initiatePesaPalPayment(pkg.price, {
        uid: user.uid,
        email: user.email || `user_${user.uid}@matchflow.app`,
        name: profile.name || "MatchFlow User"
      })
      if (result.success && result.redirect_url) window.location.href = result.redirect_url
      else toast({ variant: "destructive", title: "Payment Error", description: result.error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.push("/me")} className="rounded-full"><ChevronLeft className="w-6 h-6 text-black" /></Button>
        <h1 className="text-base font-semibold text-black">Wallet</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push("/recharge/history")} className="rounded-full"><History className="w-5 h-5 text-black" /></Button>
      </header>

      <main className="flex-1 px-6 pt-8 pb-32">
        <div className="space-y-8">
          <div className="space-y-1">
             <h2 className="text-sm font-semibold text-black">My Balance</h2>
             <div className="flex items-center gap-4 py-4">
                <CoinIcon className="w-14 h-14" />
                <span className="text-5xl font-bold text-black tracking-tight">
                  {currentCoins}
                </span>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {PACKAGES.map((p) => (
              <div 
                key={p.amount} 
                onClick={() => setSelectedPackage(p.amount)} 
                className={cn(
                  "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 relative transition-all active:scale-95 cursor-pointer", 
                  selectedPackage === p.amount ? "border-[#00AEFF] bg-white shadow-md" : "border-gray-50 bg-white"
                )}
              >
                <CoinIcon className="w-8 h-8 mb-2" />
                <span className={cn("text-xs font-semibold", selectedPackage === p.amount ? "text-[#00AEFF]" : "text-black")}>{p.amount}</span>
                <span className="text-[8px] font-medium text-gray-400 mt-1">KES {p.price}</span>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-16 rounded-2xl border-dashed border-2 border-blue-100 bg-blue-50/30 text-blue-600 font-bold uppercase tracking-widest text-[10px] gap-2">
                  <Users className="w-4 h-4" /> Certified Coin Sellers
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-0 max-w-sm overflow-hidden">
                <DialogHeader className="p-6 bg-blue-600 text-white">
                  <DialogTitle className="text-lg font-bold">Verified Sellers</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                  {sellers.length === 0 ? (
                    <p className="text-center py-10 text-xs font-bold text-gray-400 uppercase">No active sellers</p>
                  ) : sellers.map(seller => (
                    <div key={seller.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-white shadow-sm">
                          <AvatarImage src={seller.photoURL} />
                          <AvatarFallback>{seller.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-sm">{seller.name}</p>
                            <CheckCircle2 className="w-3 h-3 text-blue-500 fill-current" />
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Available Now</p>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        onClick={() => router.push(`/chats?startWith=${seller.uid}&msg=I want to buy coins`)}
                        className="rounded-full bg-blue-600 h-10 w-10 shadow-lg shadow-blue-100"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white p-6 border-t z-50">
        <Button disabled={loading || !selectedPackage} className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-bold" onClick={handlePayment}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5 mr-2" /> Pay KES {PACKAGES.find(p => p.amount === selectedPackage)?.price}</>}
        </Button>
      </footer>
    </div>
  )
}

export default function RechargePage() { return <Suspense fallback={null}><RechargeContent /></Suspense> }
