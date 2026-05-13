
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Menu, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserProfile {
  coins?: number
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <div className={cn("w-10 h-10 rounded-full bg-[#FFD600] flex items-center justify-center shadow-sm", className)}>
      <span className="text-white font-black text-xl italic drop-shadow-sm">S</span>
    </div>
  )
}

const PACKAGES = [
  { amount: 500, price: "KES 50.0" },
  { amount: 1000, price: "KES 100.0" },
  { amount: 2000, price: "KES 200.0" },
  { amount: 5000, price: "KES 500.0" },
  { amount: 10000, price: "KES 1000.0" },
  { amount: 20000, price: "KES 2000.0" },
  { amount: 50000, price: "KES 5000.0" },
  { amount: 100000, price: "KES 10000.0" },
]

export default function RechargePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const [selectedPackage, setSelectedPackage] = useState(1000)

  const userRef = useMemoFirebase(() => user?.uid ? doc(db, "users", user.uid) : null, [db, user?.uid])
  const { data: profile } = useDoc<UserProfile>(userRef)

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="px-4 h-16 flex items-center justify-between border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-base font-black text-black">Wallet</h1>
        <Button variant="ghost" size="icon" className="rounded-full border border-black/20 w-8 h-8 p-1.5">
           <Menu className="w-full h-full" />
        </Button>
      </header>

      <main className="flex-1 px-6 pt-8 pb-32">
        <div className="space-y-6">
          <div className="space-y-1">
             <h2 className="text-sm font-black text-black">My Balance</h2>
             <div className="flex items-center gap-4 py-4">
                <CoinIcon className="w-14 h-14" />
                <span className="text-5xl font-black text-black tracking-tight">{profile?.coins || 0}</span>
             </div>
          </div>

          <div className="flex items-center justify-between">
             <h3 className="text-sm font-black text-black">My Balance</h3>
             <div className="bg-black text-white px-2.5 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-transform cursor-pointer">
                <div className="w-4 h-3 bg-gradient-to-r from-black via-green-800 to-black rounded-sm overflow-hidden flex items-center justify-center">
                    <div className="w-full h-[2px] bg-red-600 rotate-45 scale-150" />
                </div>
                <span className="text-[10px] font-black uppercase">Kenya</span>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {PACKAGES.map((pkg) => (
              <div 
                key={pkg.amount}
                onClick={() => setSelectedPackage(pkg.amount)}
                className={cn(
                  "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 relative transition-all active:scale-95 cursor-pointer",
                  selectedPackage === pkg.amount 
                    ? "border-[#00AEFF] bg-white" 
                    : "border-gray-50 bg-white"
                )}
              >
                <CoinIcon className="w-8 h-8 mb-2" />
                <span className={cn("text-xs font-black", selectedPackage === pkg.amount ? "text-[#00AEFF]" : "text-black")}>
                  {pkg.amount}
                </span>
                {selectedPackage === pkg.amount && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#00AEFF] rounded-full flex items-center justify-center">
                     <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Payment Button */}
      <footer className="fixed bottom-0 inset-x-0 bg-white p-6 border-t z-50">
        <Button 
          className="w-full h-16 rounded-full bg-[#FF3B30] text-white font-black text-base shadow-xl premium-shadow active:scale-95 transition-all uppercase tracking-widest"
          onClick={() => {
            // Placeholder for payment logic
            window.open("https://wa.me/254713934404", "_blank")
          }}
        >
          Pay Now
        </Button>
      </footer>
    </div>
  )
}
