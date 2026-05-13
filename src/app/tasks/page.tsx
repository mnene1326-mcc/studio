
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, X, Coins, Gift, Zap, Star, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TaskCenterPage() {
  const router = useRouter()
  const [checkedDays, setCheckedDays] = useState([true, true, false, false, false, false, false])

  const days = [
    { day: "1st", reward: "2" },
    { day: "2nd", reward: "2" },
    { day: "3rd", reward: "5" },
    { day: "4th", reward: "2" },
    { day: "5th", reward: "2" },
    { day: "6th", reward: "2" },
    { day: "7th", reward: "10" },
  ]

  const newcomerTasks = [
    { title: "Complete Profile", reward: "10", icon: Star, color: "text-yellow-500", done: true },
    { title: "Upload 3 Photos", reward: "20", icon: Gift, color: "text-pink-500", done: false },
    { title: "First Match Chat", reward: "5", icon: Zap, color: "text-purple-500", done: false },
  ]

  return (
    <div className="flex-1 bg-[#F8F9FA] min-h-screen pb-10">
      {/* Straight Header - Architectural Look */}
      <header className="bg-[#FF3B30] h-48 relative px-4 pt-12">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white rounded-full hover:bg-white/20">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Task Center</h1>
          <Button variant="ghost" size="icon" onClick={() => router.push('/home')} className="text-white rounded-full hover:bg-white/20">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Coin Balance Card Overlay */}
        <div className="absolute -bottom-6 left-4 right-4 bg-white shadow-xl p-5 flex items-center justify-between rounded-2xl border border-black/5">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-xl">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">My Balance</p>
              <p className="text-2xl font-black text-black leading-none">450</p>
            </div>
          </div>
          <Button className="rounded-full bg-yellow-400 hover:bg-yellow-500 text-white font-black text-xs uppercase tracking-widest px-6">
            Withdraw
          </Button>
        </div>
      </header>

      <main className="mt-12 px-4 space-y-6">
        {/* Daily Check-in */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-black uppercase tracking-widest">Daily Check-in</h2>
            <span className="text-[10px] font-black text-gray-400">Total: 7 Days</span>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {days.map((d, i) => (
              <div 
                key={i} 
                className={cn(
                  "aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all",
                  checkedDays[i] 
                    ? "bg-green-50 border-green-200" 
                    : "bg-gray-50 border-transparent"
                )}
              >
                {checkedDays[i] ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-yellow-500 mb-1" />
                    <span className="text-[10px] font-black text-gray-500">+{d.reward}</span>
                  </>
                )}
                <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">{d.day}</span>
              </div>
            ))}
          </div>
          <Button className="w-full mt-6 h-12 rounded-full bg-[#FF3B30] text-white font-black uppercase tracking-widest text-xs">
            Check-in Now
          </Button>
        </section>

        {/* Newcomer Tasks */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-1 h-4 bg-pink-500 rounded-full" />
            <h2 className="text-xs font-black text-black uppercase tracking-widest">Newcomer tasks</h2>
          </div>
          <div className="space-y-2">
            {newcomerTasks.map((task, i) => (
              <div key={i} className="bg-white p-4 flex items-center justify-between rounded-2xl border border-black/5">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl bg-gray-50", task.color)}>
                    <task.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black">{task.title}</p>
                    <p className="text-[10px] font-bold text-yellow-500">+{task.reward} Coins</p>
                  </div>
                </div>
                <Button 
                  variant={task.done ? "ghost" : "outline"} 
                  disabled={task.done}
                  className={cn(
                    "rounded-full px-5 h-8 text-[10px] font-black uppercase tracking-widest",
                    task.done ? "text-green-500" : "border-pink-200 text-pink-500 hover:bg-pink-50"
                  )}
                >
                  {task.done ? "Done" : "Go"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
