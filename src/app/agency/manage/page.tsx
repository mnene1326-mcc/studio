
"use client"

import { useMemo, useState } from "react"
import { collection, query, where, doc, getDoc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Check, X, Loader2, User, Users, Briefcase, Banknote } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { reviewRecruitmentAction, updateWithdrawalStatusAction } from "@/app/actions/agency"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  agencyId?: string
  agencyStatus?: string
  isAgent?: boolean
}

interface WithdrawalRequest {
  id: string
  uid: string
  userName: string
  diamonds: number
  amountKes: number
  status: string
  createdAt: any
}

export default function AgencyManagePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'members' | 'withdrawals' | 'recruitment'>('members')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { data: profile } = useDoc<UserProfile>(user?.uid ? doc(db, "users", user.uid) : null)
  
  // Queries
  const applicantsQuery = useMemo(() => {
    if (!profile?.agencyId) return null
    return query(collection(db, "users"), where("agencyId", "==", profile.agencyId), where("agencyStatus", "==", "pending"))
  }, [db, profile?.agencyId])

  const membersQuery = useMemo(() => {
    if (!profile?.agencyId) return null
    return query(collection(db, "users"), where("agencyId", "==", profile.agencyId), where("agencyStatus", "==", "approved"))
  }, [db, profile?.agencyId])

  const withdrawalsQuery = useMemo(() => {
    if (!profile?.agencyId) return null
    return query(collection(db, "agencies", profile.agencyId, "withdrawals"), where("status", "==", "pending"))
  }, [db, profile?.agencyId])

  const { data: applicants, loading: appLoading } = useCollection<UserProfile>(applicantsQuery)
  const { data: members, loading: memLoading } = useCollection<UserProfile>(membersQuery)
  const { data: withdrawals, loading: withLoading } = useCollection<WithdrawalRequest>(withdrawalsQuery)

  const handleReview = async (applicantUid: string, status: 'approved' | 'rejected') => {
    if (!user) return
    const res = await reviewRecruitmentAction(user.uid, applicantUid, status)
    if (res.success) toast({ title: status === 'approved' ? "Approved" : "Rejected" })
    else toast({ variant: "destructive", title: "Error", description: res.error })
  }

  const handleWithdrawalReview = async (requestId: string, status: 'paid' | 'rejected') => {
    if (!user || !profile?.agencyId) return
    setIsProcessing(true)
    const res = await updateWithdrawalStatusAction(user.uid, profile.agencyId, requestId, status)
    if (res.success) toast({ title: `Request ${status}` })
    else toast({ variant: "destructive", title: "Error", description: res.error })
    setIsProcessing(false)
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-sm font-bold text-black uppercase tracking-widest">Agency Center</h1>
        <div className="w-10" />
      </header>

      <div className="flex border-b">
        {[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'withdrawals', label: 'Payouts', icon: Banknote },
          { id: 'recruitment', label: 'Join Requests', icon: Briefcase }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-all",
              activeTab === tab.id ? "border-[#00A2FF] text-[#00A2FF]" : "border-transparent text-gray-400"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">{tab.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 p-6">
        {activeTab === 'recruitment' && (
          <div className="space-y-4">
            {applicants.length === 0 ? (
              <div className="p-12 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">No pending applications</div>
            ) : (
              applicants.map(app => (
                <div key={app.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10"><AvatarImage src={app.photoURL} /><AvatarFallback><User /></AvatarFallback></Avatar>
                    <span className="font-bold text-sm">{app.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" onClick={() => handleReview(app.uid, 'approved')} className="bg-green-500 rounded-full h-9 w-9"><Check className="w-4 h-4" /></Button>
                    <Button size="icon" onClick={() => handleReview(app.uid, 'rejected')} variant="outline" className="border-red-200 text-red-500 rounded-full h-9 w-9"><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1">Agency Owner</h2>
            <div className="flex items-center gap-3 p-4 bg-[#00A2FF]/5 border border-[#00A2FF]/10 rounded-2xl">
              <Avatar className="w-12 h-12 border-2 border-[#00A2FF]"><AvatarImage src={profile?.photoURL} /><AvatarFallback><User /></AvatarFallback></Avatar>
              <div>
                <span className="font-bold text-sm block">{profile?.name}</span>
                <span className="text-[9px] font-bold text-[#00A2FF] uppercase tracking-widest">Agent / Owner</span>
              </div>
            </div>

            <h2 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1 mt-6">Team Members ({members.length})</h2>
            {members.length === 0 ? (
              <div className="p-12 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">No members yet</div>
            ) : (
              members.map(member => (
                <div key={member.uid} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <Avatar className="w-10 h-10"><AvatarImage src={member.photoURL} /><AvatarFallback><User /></AvatarFallback></Avatar>
                  <span className="font-bold text-sm">{member.name}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            {withdrawals.length === 0 ? (
              <div className="p-12 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">No pending payouts</div>
            ) : (
              withdrawals.map(req => (
                <div key={req.id} className="p-5 bg-white border rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm">{req.userName}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Requested on {req.createdAt ? format(req.createdAt.toDate(), "MMM d, HH:mm") : "---"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">Ksh {req.amountKes}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{req.diamonds} Diamonds</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      disabled={isProcessing}
                      onClick={() => handleWithdrawalReview(req.id, 'paid')}
                      className="flex-1 bg-green-600 text-white font-bold h-12 rounded-full uppercase tracking-widest text-[10px]"
                    >
                      Mark as Paid
                    </Button>
                    <Button 
                      disabled={isProcessing}
                      onClick={() => handleWithdrawalReview(req.id, 'rejected')}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-500 font-bold h-12 rounded-full uppercase tracking-widest text-[10px]"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
