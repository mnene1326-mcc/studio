"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser, useDoc } from "@/firebase"
import { Button } from "@/components/ui/button"
import { ChevronLeft, X, Coins, Gift, Zap, Star, CheckCircle2, Trophy, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"

interface UserProfile {
  coins?: number
  checkInStreak?: number
  lastCheckInDate?: any
}

export default function TaskCenterPage() {
  const router = useRouter()
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const userRef = useMemo(() => user?.uid ? doc(db, "users", user.uid) : null, [db, user?.uid])
  const { data: profile } = useDoc<UserProfile>(userRef)

  const days = [
    { day: "1st", reward: 2 },
    { day: "2nd", reward: 2 },
    { day: "3rd", reward: 5 },
    { day: "4th", reward: 2 },
    { day: "5th", reward: 2 },
    { day: "6th", reward: 2 },
    { day: "7th", reward: 10 },
  ]

  const newcomerTasks = [
    { title: "Complete Profile", reward: "10", icon: Star, color: "text-yellow-500", done: true },
    { title: "Upload 3 Photos", reward: "20", icon: Gift, color: "text-pink-500", done: false },
    { title: "First Match Chat", reward: "5", icon: Zap, color: "text-purple-500", done: false },
  ]

  const dailyTasks = [
    { title: "Send 3 Gifts", reward: "15", icon: Flame, color: "text-orange-500", progress: "0/3" },
    { title: "Daily Login", reward: "2", icon: CheckCircle2, color: "text-green-500", progress: "1/1" },
  ]

  const hasCheckedInToday = useMemo(() => {
    if (!profile?.lastCheckInDate) return false
    const lastDate = profile.lastCheckInDate.toDate()
    const today = new Date()
    return (
      lastDate.getDate() === today.getDate() &&
      lastDate.getMonth() === today.getMonth() &&
      lastDate.getFullYear() === today.getFullYear()
    )
  }, [profile?.lastCheckInDate])

  const currentStreak = profile?.checkInStreak || 0

  const handleCheckIn = () => {
    if (!user || !userRef || hasCheckedInToday) return
    const streakIndex = currentStreak % 7
    const rewardAmount = days[streakIndex].reward
    
    updateDoc(userRef, {
      coins: increment(rewardAmount),
      lastCheckInDate: serverTimestamp(),
      checkInStreak: increment(1)
    }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update' }))
    })

    toast({ title: "Check-in Successful!", description: `You earned ${rewardAmount} coins. Keep it up!` })
  }

  return (
    <div className="flex-1 bg-[#F8F9FA] min-h-screen pb-10">
      <header className="bg-[#00A2FF] h-32 relative px-4 pt-12">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white rounded-full hover:bg-white/20">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white tracking-tight uppercase">Task Center</h1>
          <Button variant="ghost" size="icon" onClick={() => router.push('/home')} className="text-white rounded-full hover:bg-white/20">
            <X className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <main className="mt-8 px-4 space-y-6">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xs font-bold text-black uppercase tracking-widest">Daily Check-in</h2>
            </div>
            <span className="text-[10px] font-semibold text-gray-400">Total: {currentStreak} Days</span>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {days.map((d, i) => {
              const isChecked = i < (currentStreak % 7) || (currentStreak > 0 && currentStreak % 7 === 0 && i < 7)
              const isToday = hasCheckedInToday && (i === (currentStreak - 1) % 7)
              return (
                <div key={i} className={cn("aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all", (isChecked || isToday) ? "bg-green-50 border-green-200" : "bg-gray-50 border-transparent")}>
                  {(isChecked || isToday) ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : (
                    <>
                      <Coins className="w-5 h-5 text-yellow-500 mb-1" />
                      <span className="text-[10px] font-semibold text-gray-500">+{d.reward}</span>
                    </>
                  )}
                  <span className="text-[8px] font-medium text-gray-400 uppercase mt-1">{d.day}</span>
                </div>
              )
            })}
          </div>
          
          <Button 
            onClick={handleCheckIn}
            disabled={hasCheckedInToday}
            className={cn("w-full mt-6 h-14 rounded-full text-white font-bold uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all", hasCheckedInToday ? "bg-gray-300 shadow-none cursor-default" : "bg-[#00A2FF] shadow-blue-100")}
          >
            {hasCheckedInToday ? "Already Checked-in" : "Check-in Now"}
          </Button>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-1 h-4 bg-pink-500 rounded-full" />
            <h2 className="text-xs font-bold text-black uppercase tracking-widest">Newcomer tasks</h2>
          </div>
          <div className="space-y-3">
            {newcomerTasks.map((task, i) => (
              <div key={i} className="bg-white p-5 flex items-center justify-between rounded-2xl border border-black/5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl bg-gray-50", task.color)}><task.icon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-semibold text-black">{task.title}</p>
                    <p className="text-xs font-medium text-yellow-500">+{task.reward} Coins</p>
                  </div>
                </div>
                <Button variant={task.done ? "ghost" : "outline"} disabled={task.done} className={cn("rounded-full px-6 h-10 text-[10px] font-bold uppercase tracking-widest", task.done ? "text-green-500" : "border-pink-200 text-pink-500 hover:bg-pink-50")}>
                  {task.done ? "Done" : "Go"}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full" />
            <h2 className="text-xs font-bold text-black uppercase tracking-widest">Daily tasks</h2>
          </div>
          <div className="space-y-3">
            {dailyTasks.map((task, i) => (
              <div key={i} className="bg-white p-5 flex items-center justify-between rounded-2xl border border-black/5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl bg-gray-50", task.color)}><task.icon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-semibold text-black">{task.title}</p>
                    <p className="text-xs font-medium text-yellow-500">+{task.reward} Coins • {task.progress}</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-full px-6 h-10 text-[10px] font-bold uppercase tracking-widest border-blue-200 text-blue-500 hover:bg-blue-50">Go</Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
