
"use client"

import { useMemo, useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { useFirestore, useUser, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  ChevronRight, 
  Copy, 
  Check, 
  BadgeCheck, 
  Headphones, 
  Pencil,
  CircleDollarSign,
  ShieldCheck,
  Gem,
  Loader2,
  Trophy,
  Coins,
  Users
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { awardCoinsAction, toggleCoinSellerAction } from "@/app/actions/admin"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  matchFlowId?: string
  coins?: number
  diamonds?: number
  isVerified?: boolean
  onboardingComplete?: boolean
  isAdmin?: boolean
  isCoinSeller?: boolean
}

function ManageRolesDialog({ callerUid }: { callerUid: string }) {
  const [targetId, setTargetId] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleRoleUpdate = async (setAsSeller: boolean) => {
    if (!targetId) return
    setLoading(true)
    try {
      const result = await toggleCoinSellerAction(callerUid, targetId, setAsSeller)
      if (result.success) {
        toast({ title: "Role Updated", description: result.message })
        setOpen(false)
        setTargetId("")
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error })
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="h-20 bg-white hover:bg-gray-50 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-purple-600 active:scale-95 transition-all col-span-2 mt-4"
        >
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="text-sm font-black uppercase tracking-widest">Manage Roles</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-none p-8 max-w-[90vw] sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-2">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-2">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <DialogTitle className="text-xl font-black text-black">Manage User Roles</DialogTitle>
          <DialogDescription className="text-xs font-bold text-gray-400">
            Admins can appoint or remove Coin Sellers using their numeric MatchFlow ID.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Numeric MatchFlow ID</Label>
            <Input 
              placeholder="e.g. 7349281" 
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-black text-center text-lg"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-3">
          <Button 
            onClick={() => handleRoleUpdate(true)}
            disabled={loading || !targetId}
            className="w-full h-14 rounded-full bg-purple-600 text-white font-black uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Make Coin Seller"}
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleRoleUpdate(false)}
            disabled={loading || !targetId}
            className="w-full h-14 rounded-full border-purple-200 text-purple-600 font-black uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove Seller Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AwardCoinsDialog({ callerUid }: { callerUid: string }) {
  const [targetId, setTargetId] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleAward = async () => {
    if (!targetId || !amount || isNaN(Number(amount))) return
    
    setLoading(true)
    try {
      const result = await awardCoinsAction(callerUid, targetId, Number(amount))
      if (result.success) {
        toast({
          title: "Coins Awarded",
          description: result.message
        })
        setTargetId("")
        setAmount("")
        setOpen(false)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="h-20 bg-gradient-to-br from-yellow-400 to-orange-500 hover:opacity-90 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-all col-span-2 mt-4"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <span className="text-sm font-black uppercase tracking-widest">Award Coins Tool</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-none p-8 max-w-[90vw] sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-2">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-2">
            <Coins className="w-8 h-8 text-yellow-500" />
          </div>
          <DialogTitle className="text-xl font-black text-black">Award MatchFlow Coins</DialogTitle>
          <DialogDescription className="text-xs font-bold text-gray-400">
            Enter the user's numeric ID and the amount of coins to add to their balance instantly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Numeric MatchFlow ID</Label>
            <Input 
              placeholder="e.g. 7349281" 
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-black text-center text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Amount to Award</Label>
            <Input 
              type="number" 
              placeholder="e.g. 500" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-black text-center text-lg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleAward}
            disabled={loading || !targetId || !amount}
            className="w-full h-16 rounded-full bg-black text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Award"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  // Strict Redirect & Onboarding Check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/welcome")
      } else {
        const checkOnboarding = async () => {
          const userRef = doc(db, "users", user.uid)
          const snap = await getDoc(userRef)
          if (!snap.exists() || !snap.data().onboardingComplete) {
            router.replace("/onboarding")
          }
        }
        checkOnboarding()
      }
    }
  }, [user, authLoading, router, db])

  const profileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef)

  const handleCopyId = () => {
    if (profile?.matchFlowId) {
      navigator.clipboard.writeText(profile.matchFlowId)
      setCopied(true)
      toast({ title: "Copied!", description: "ID copied to clipboard." })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (authLoading || profileLoading || !user || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A2FF]" />
        <p className="text-[10px] font-black uppercase text-gray-400 mt-4 tracking-widest">Loading Profile...</p>
      </div>
    )
  }

  const canAwardCoins = profile.isAdmin || profile.isCoinSeller
  const canManageRoles = profile.isAdmin

  return (
    <div className="flex-1 pb-24 bg-[#F8F9FA] min-h-screen relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[280px] bg-[#00A2FF] z-0" />

      <div className="relative z-10">
        <header className="relative pt-12 pb-10 px-6 flex flex-col items-center text-center">
          <div className="absolute top-6 right-6">
            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer">
              <span className="text-[9px] font-black text-white">
                {profile.isAdmin ? "SYSTEM ADMIN" : (profile.isCoinSeller ? "COIN SELLER" : "VERIFIED USER")}
              </span>
            </div>
          </div>

          <div className="relative mb-4">
            <div className="relative w-28 h-28 rounded-full shadow-2xl overflow-hidden bg-muted border-none">
              <Image src={profile.photoURL || `https://picsum.photos/seed/${user.uid}/400/400`} alt={profile.name} fill className="object-cover" priority />
            </div>
            <button 
              className="absolute bottom-1 right-1 bg-white p-3 rounded-full shadow-xl active:scale-90 transition-transform border border-black/5"
              onClick={() => router.push('/edit-profile')}
            >
              <Pencil className="w-4 h-4 text-[#00A2FF]" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2 className="text-xl font-black text-white tracking-tight">{profile.name}</h2>
            {(profile.isVerified || profile.isAdmin) && <BadgeCheck className="w-4 h-4 text-white fill-blue-500" />}
          </div>

          <div className="inline-flex items-center gap-1.5 cursor-pointer active:opacity-60 transition-all" onClick={handleCopyId}>
            <p className="text-white/70 font-bold text-[9px] tracking-tight uppercase">ID: {profile.matchFlowId || "---"}</p>
            {copied ? <Check className="w-2.5 h-2.5 text-green-300" /> : <Copy className="w-2.5 h-2.5 text-white/50" />}
          </div>
        </header>

        <main className="px-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 relative z-20 -mt-6">
            <Button 
              className="h-20 bg-white hover:bg-gray-50 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-[#00A2FF] active:scale-95 transition-all"
              onClick={() => router.push("/recharge")}
            >
              <div className="flex items-center gap-1.5">
                <CircleDollarSign className="w-5 h-5" />
                <span className="text-sm font-black">{profile.coins || 0}</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Recharge Coins</span>
            </Button>
            
            <Button 
              className="h-20 bg-white hover:bg-gray-50 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-black active:scale-95 transition-all"
              onClick={() => router.push("/income")}
            >
              <div className="flex items-center gap-1.5">
                <Gem className="w-5 h-5 text-[#4285F4]" />
                <span className="text-sm font-black">{profile.diamonds || 0}</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Diamond Income</span>
            </Button>

            {canAwardCoins && <AwardCoinsDialog callerUid={user.uid} />}
            {canManageRoles && <ManageRolesDialog callerUid={user.uid} />}
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-sm border border-black/5 overflow-hidden">
            <div className="flex flex-col">
              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="/verify-identity">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-50 p-2.5 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-black text-xs text-black">Identity Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(profile.isVerified || profile.isAdmin) && <span className="text-[10px] font-black text-green-500 uppercase">Verified</span>}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              </Button>

              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="/support">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                      <Headphones className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-black text-xs text-black">Customer Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>

              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="/settings">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <Settings className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="font-black text-xs text-black">App Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
