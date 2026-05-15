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
  Users,
  Briefcase,
  UserPlus
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
import { awardCoinsAction, toggleUserRoleAction } from "@/app/actions/admin"
import { createAgencyAction, joinAgencyAction } from "@/app/actions/agency"

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
  isAgent?: boolean
  gender?: string
  agencyId?: string
  agencyStatus?: 'none' | 'pending' | 'approved' | 'rejected'
}

function ManageRolesDialog({ callerUid }: { callerUid: string }) {
  const [targetId, setTargetId] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleRoleUpdate = async (role: 'isCoinSeller' | 'isAgent', value: boolean) => {
    if (!targetId) return
    setLoading(true)
    try {
      const result = await toggleUserRoleAction(callerUid, targetId, role, value)
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
        <Button className="h-20 bg-white hover:bg-gray-50 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-purple-600 active:scale-95 transition-all col-span-2 mt-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-widest">Manage Roles</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-none p-8 max-w-[90vw] sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-2">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-2"><Users className="w-8 h-8 text-purple-600" /></div>
          <DialogTitle className="text-xl font-bold text-black">Manage User Roles</DialogTitle>
          <DialogDescription className="text-xs font-medium text-gray-400">Appoint or remove Sellers and Agents.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <Input placeholder="Numeric MatchFlow ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-semibold text-center text-lg" />
        </div>
        <DialogFooter className="flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleRoleUpdate('isCoinSeller', true)} disabled={loading} className="bg-blue-600 h-12 rounded-full text-[10px] font-bold uppercase">Make Seller</Button>
            <Button onClick={() => handleRoleUpdate('isCoinSeller', false)} disabled={loading} variant="outline" className="h-12 rounded-full text-[10px] font-bold uppercase">Revoke Seller</Button>
            <Button onClick={() => handleRoleUpdate('isAgent', true)} disabled={loading} className="bg-purple-600 h-12 rounded-full text-[10px] font-bold uppercase">Make Agent</Button>
            <Button onClick={() => handleRoleUpdate('isAgent', false)} disabled={loading} variant="outline" className="h-12 rounded-full text-[10px] font-bold uppercase">Revoke Agent</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function JoinAgencyDialog({ userUid }: { userUid: string }) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleJoin = async () => {
    if (code.length !== 5) return
    setLoading(true)
    const res = await joinAgencyAction(userUid, code)
    if (res.success) {
      toast({ title: "Success", description: "Application sent to agent!" })
      setOpen(false)
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-20 bg-pink-500 hover:bg-pink-600 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-all col-span-2 mt-4">
          <UserPlus className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Join Agency</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl p-8 max-w-[90vw]">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-xl font-bold">Enter Agency Code</DialogTitle>
          <DialogDescription className="text-xs font-medium">Ask your agent for their 5-digit code.</DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <Input maxLength={5} placeholder="e.g. 54321" value={code} onChange={(e) => setCode(e.target.value)} className="rounded-2xl h-16 text-center text-2xl font-bold tracking-[0.5em]" />
        </div>
        <Button onClick={handleJoin} disabled={loading || code.length !== 5} className="w-full h-14 bg-pink-500 rounded-full font-bold uppercase tracking-widest">
          {loading ? <Loader2 className="animate-spin" /> : "Apply Now"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function AgencyDashboardDialog({ user }: { user: UserProfile }) {
  const [agencyName, setAgencyName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleCreate = async () => {
    setLoading(true)
    const res = await createAgencyAction(user.uid, agencyName)
    if (res.success) {
      toast({ title: "Agency Created", description: `Your code is ${res.code}` })
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error })
    }
    setLoading(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-20 bg-blue-600 hover:bg-blue-700 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-all col-span-2 mt-4">
          <Briefcase className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Agency Center</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl p-8 max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Agency Management</DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          {user.agencyId ? (
            <div className="text-center space-y-4">
              <div className="bg-blue-50 p-6 rounded-3xl">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Your Agency Code</p>
                <h3 className="text-4xl font-bold text-blue-600 tracking-[0.2em]">{user.agencyId}</h3>
              </div>
              <Button asChild className="w-full h-14 bg-blue-600 rounded-full font-bold uppercase tracking-widest">
                <Link href="/agency/manage">Manage Members</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Agency Name" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="rounded-2xl h-14" />
              <Button onClick={handleCreate} disabled={loading} className="w-full h-14 bg-blue-600 rounded-full font-bold uppercase tracking-widest">
                {loading ? <Loader2 className="animate-spin" /> : "Create Agency"}
              </Button>
            </div>
          )}
        </div>
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
        toast({ title: "Coins Awarded", description: result.message })
        setTargetId(""); setAmount(""); setOpen(false)
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
        <Button className="h-20 bg-gradient-to-br from-yellow-400 to-orange-500 hover:opacity-90 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-all col-span-2 mt-4">
          <div className="flex items-center gap-2"><Trophy className="w-6 h-6" /><span className="text-sm font-bold uppercase tracking-widest">Award Coins Tool</span></div>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-none p-8 max-w-[90vw] sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-2">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-2"><Coins className="w-8 h-8 text-yellow-500" /></div>
          <DialogTitle className="text-xl font-bold text-black">Award MatchFlow Coins</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <Input placeholder="Numeric MatchFlow ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-semibold text-center text-lg" />
          <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-semibold text-center text-lg" />
        </div>
        <DialogFooter>
          <Button onClick={handleAward} disabled={loading || !targetId || !amount} className="w-full h-16 rounded-full bg-black text-white font-bold uppercase tracking-widest text-sm">
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

  useEffect(() => {
    if (!authLoading && user) {
      const checkOnboarding = async () => {
        const snap = await getDoc(doc(db, "users", user.uid))
        if (!snap.exists() || !snap.data().onboardingComplete) router.replace("/onboarding")
      }
      checkOnboarding()
    } else if (!authLoading && !user) {
      router.replace("/welcome")
    }
  }, [user, authLoading, router, db])

  const profileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef)

  const handleCopyId = () => {
    if (profile?.matchFlowId) {
      navigator.clipboard.writeText(profile.matchFlowId)
      setCopied(true); toast({ title: "Copied!" })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (authLoading || profileLoading || !user || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A2FF]" />
      </div>
    )
  }

  return (
    <div className="flex-1 pb-24 bg-[#F8F9FA] min-h-screen relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[280px] bg-[#00A2FF] z-0" />
      <div className="relative z-10">
        <header className="relative pt-12 pb-10 px-6 flex flex-col items-center text-center">
          <div className="absolute top-6 right-6">
            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-white uppercase">
                {profile.isAdmin ? "SYSTEM ADMIN" : (profile.isAgent ? "AGENCY AGENT" : (profile.isCoinSeller ? "COIN SELLER" : "VERIFIED USER"))}
              </span>
            </div>
          </div>
          <div className="relative mb-4">
            <div className="relative w-28 h-28 rounded-full shadow-2xl overflow-hidden bg-muted">
              <Image src={profile.photoURL} alt={profile.name} fill className="object-cover" priority />
            </div>
            <button className="absolute bottom-1 right-1 bg-white p-3 rounded-full shadow-xl border border-black/5" onClick={() => router.push('/edit-profile')}>
              <Pencil className="w-4 h-4 text-[#00A2FF]" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{profile.name}</h2>
            {(profile.isVerified || profile.isAdmin) && <BadgeCheck className="w-4 h-4 text-white fill-blue-500" />}
          </div>
          <div className="inline-flex items-center gap-1.5 cursor-pointer" onClick={handleCopyId}>
            <p className="text-white/70 font-semibold text-[9px] uppercase">ID: {profile.matchFlowId}</p>
            {copied ? <Check className="w-2.5 h-2.5 text-green-300" /> : <Copy className="w-2.5 h-2.5 text-white/50" />}
          </div>
        </header>

        <main className="px-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 relative z-20 -mt-6">
            <Button className="h-20 bg-white hover:bg-gray-50 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-[#00A2FF]" onClick={() => router.push("/recharge")}>
              <div className="flex items-center gap-1.5"><CircleDollarSign className="w-5 h-5" /><span className="text-sm font-bold">{profile.coins || 0}</span></div>
              <span className="text-[8px] font-bold uppercase opacity-60">Recharge Coins</span>
            </Button>
            <Button className="h-20 bg-white hover:bg-gray-50 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-black" onClick={() => router.push("/income")}>
              <div className="flex items-center gap-1.5"><Gem className="w-5 h-5 text-[#4285F4]" /><span className="text-sm font-bold">{profile.diamonds || 0}</span></div>
              <span className="text-[8px] font-bold uppercase opacity-60">Diamond Income</span>
            </Button>

            {profile.isAdmin || profile.isCoinSeller ? <AwardCoinsDialog callerUid={user.uid} /> : null}
            {profile.isAdmin && <ManageRolesDialog callerUid={user.uid} />}
            {profile.isAgent && <AgencyDashboardDialog user={profile} />}
            {profile.gender === 'female' && profile.agencyStatus !== 'approved' && !profile.isAgent && !profile.isAdmin && <JoinAgencyDialog userUid={user.uid} />}
            
            {profile.agencyStatus === 'pending' && (
              <div className="col-span-2 bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-center">
                <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Agency Application Pending</p>
              </div>
            )}
             {profile.agencyStatus === 'approved' && profile.agencyId && (
              <div className="col-span-2 bg-green-50 p-4 rounded-2xl border border-green-100 text-center flex items-center justify-center gap-2">
                <Briefcase className="w-4 h-4 text-green-600" />
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Member of Agency: {profile.agencyId}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-sm border border-black/5 overflow-hidden">
            <div className="flex flex-col">
              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="/verify-identity">
                  <div className="flex items-center gap-4"><div className="bg-green-50 p-2.5 rounded-xl"><ShieldCheck className="w-5 h-5 text-green-600" /></div><span className="font-semibold text-xs text-black">Identity Verification</span></div>
                  {(profile.isVerified || profile.isAdmin) && <span className="text-[10px] font-bold text-green-500 uppercase">Verified</span>}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>
              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="/support"><div className="flex items-center gap-4"><div className="bg-blue-50 p-2.5 rounded-xl"><Headphones className="w-5 h-5 text-blue-600" /></div><span className="font-semibold text-xs text-black">Support Center</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></Link>
              </Button>
              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="/settings"><div className="flex items-center gap-4"><div className="bg-gray-50 p-2.5 rounded-xl"><Settings className="w-5 h-5 text-gray-600" /></div><span className="font-semibold text-xs text-black">App Settings</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
