
"use client"

import { useMemo, useState } from "react"
import { collection, query, where, doc, getDoc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Check, X, Loader2, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { reviewRecruitmentAction } from "@/app/actions/agency"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  agencyId?: string
  agencyStatus?: string
}

export default function AgencyManagePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const { data: profile } = useDoc<UserProfile>(user?.uid ? doc(db, "users", user.uid) : null)
  
  const applicantsQuery = useMemo(() => {
    if (!profile?.agencyId) return null
    return query(
      collection(db, "users"),
      where("agencyId", "==", profile.agencyId),
      where("agencyStatus", "==", "pending")
    )
  }, [db, profile?.agencyId])

  const { data: applicants, loading } = useCollection<UserProfile>(applicantsQuery)

  const membersQuery = useMemo(() => {
    if (!profile?.agencyId) return null
    return query(
      collection(db, "users"),
      where("agencyId", "==", profile.agencyId),
      where("agencyStatus", "==", "approved")
    )
  }, [db, profile?.agencyId])

  const { data: members } = useCollection<UserProfile>(membersQuery)

  const handleReview = async (applicantUid: string, status: 'approved' | 'rejected') => {
    if (!user) return
    const res = await reviewRecruitmentAction(user.uid, applicantUid, status)
    if (res.success) {
      toast({ title: status === 'approved' ? "Approved" : "Rejected" })
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error })
    }
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-base font-black text-black">Agency Management</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 p-6 space-y-8">
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Pending Applications ({applicants.length})</h2>
          {loading ? <Loader2 className="animate-spin mx-auto text-blue-500" /> : applicants.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed text-xs font-bold text-gray-400">No pending applicants</div>
          ) : (
            applicants.map(app => (
              <div key={app.uid} className="flex items-center justify-between p-4 bg-white rounded-2xl border shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10"><AvatarImage src={app.photoURL} /><AvatarFallback><User /></AvatarFallback></Avatar>
                  <span className="font-black text-sm">{app.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" onClick={() => handleReview(app.uid, 'approved')} className="rounded-full bg-green-500 hover:bg-green-600 h-9 w-9"><Check className="w-4 h-4" /></Button>
                  <Button size="icon" onClick={() => handleReview(app.uid, 'rejected')} variant="outline" className="rounded-full border-red-200 text-red-500 hover:bg-red-50 h-9 w-9"><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Approved Members ({members.length})</h2>
          {members.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed text-xs font-bold text-gray-400">No members yet</div>
          ) : (
            members.map(member => (
              <div key={member.uid} className="flex items-center gap-3 p-4 bg-white rounded-2xl border shadow-sm">
                <Avatar className="w-10 h-10"><AvatarImage src={member.photoURL} /><AvatarFallback><User /></AvatarFallback></Avatar>
                <span className="font-black text-sm">{member.name}</span>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
