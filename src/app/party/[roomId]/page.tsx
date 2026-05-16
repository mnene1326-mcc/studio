
"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  X, 
  ShoppingBag, 
  Heart, 
  Mic, 
  MicOff, 
  MessageSquare, 
  LayoutGrid, 
  Gift as GiftIcon,
  Crown,
  Gamepad2,
  Users,
  Scaling,
  Smile,
  Trophy,
  History
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ChatMessage {
  id: string
  user: string
  text: string
  isSystem?: boolean
  vip?: string
  avatar?: string
}

const DUMMY_CHATS: ChatMessage[] = [
  { id: '1', user: 'System', text: 'Welcome to Jam on the Rocks. Respect others and chat politely. Let\'s have fun together!', isSystem: true },
  { id: '2', user: 'Hi love 😍', text: '', isSystem: false },
  { id: '3', user: 'MCC 😐', text: 'Entered the room', isSystem: true, vip: 'SVIP1' },
  { 
    id: '4', 
    user: 'Adriannah 🤤', 
    text: 'hello baby...welcome to this platform reply@', 
    vip: 'VIP2',
    avatar: 'https://picsum.photos/seed/u5/100/100'
  },
  { id: '5', user: '0751325360ssup', text: 'Entered the room', isSystem: true },
]

export default function PartyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const [isMicOn, setIsMicOn] = useState(true)
  const [activeTab, setActiveTab] = useState<'All' | 'Chat'>('All')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // Seat layout (20 slots matching the 5x4 grid in the screenshot)
  const occupied = [
    { seat: 0, user: 'Rey nimo...', photo: 'https://picsum.photos/seed/u1/100/100', hot: 7, frame: 'silver' },
    { seat: 1, user: 'Breeh 💋...', photo: 'https://picsum.photos/seed/u2/100/100', hot: 0, frame: 'gold' },
    { seat: 4, user: 'anitah 💖😋', photo: 'https://picsum.photos/seed/u3/100/100', hot: 3, frame: 'silver' },
    { seat: 9, user: 'THE BOY🤤', photo: 'https://picsum.photos/seed/u4/100/100', hot: '36.0K', frame: 'gold' },
    { seat: 10, user: 'Adriannah...', photo: 'https://picsum.photos/seed/u5/100/100', hot: 463, frame: 'gold' },
    { seat: 11, user: 'Åńîķå💫', photo: 'https://picsum.photos/seed/u6/100/100', hot: 0, frame: 'silver' },
    { seat: 12, user: '💗Chica💗', photo: 'https://picsum.photos/seed/u7/100/100', hot: 0, frame: 'silver' },
    { seat: 13, user: 'Zinny💋...', photo: 'https://picsum.photos/seed/u8/100/100', hot: 0, frame: 'silver' },
    { seat: 15, user: 'Audrey🌟', photo: 'https://picsum.photos/seed/u9/100/100', hot: 0, frame: 'silver' },
    { seat: 16, user: '👑K I N G...', photo: 'https://picsum.photos/seed/u10/100/100', hot: 0, frame: 'gold' },
    { seat: 17, user: 'Aysher💋💅', photo: 'https://picsum.photos/seed/u11/100/100', hot: 0, frame: 'silver' },
    { seat: 18, user: 'MCC 😐', photo: 'https://picsum.photos/seed/u12/100/100', hot: 0, frame: 'silver' },
  ]

  return (
    <div className="fixed inset-0 bg-black flex flex-col select-none overflow-hidden font-sans text-white">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7A0D0D] via-[#3D0808] to-[#1A0505] opacity-90" />
        <Image 
          src="https://picsum.photos/seed/party-lollipops/1000/1500" 
          alt="room bg" 
          fill 
          className="object-cover opacity-30 grayscale brightness-50 mix-blend-overlay"
          priority
        />
        <div className="absolute bottom-40 left-0 right-0 h-64 flex justify-center items-end pointer-events-none opacity-40">
           <Image src="https://picsum.photos/seed/lollipops/400/400" alt="decor" width={200} height={200} className="object-contain" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-20 px-4 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/5">
          <Avatar className="w-9 h-9 border border-white/10">
            <AvatarImage src="https://picsum.photos/seed/host/100/100" />
            <AvatarFallback>H</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-white text-[11px] font-black truncate max-w-[90px] leading-tight">Jam on the Rock</h1>
            <p className="text-white/40 text-[8px] font-bold">ID:699452444</p>
          </div>
          <button className="bg-[#56E39F] rounded-full p-1.5 shadow-lg active:scale-95 transition-all ml-1">
            <Heart className="w-3.5 h-3.5 text-white fill-current" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-white/80 p-2 bg-white/5 rounded-full border border-white/5 shadow-sm active:scale-95"><ShoppingBag className="w-4.5 h-4.5" /></button>
          <button className="text-white/80 p-2 bg-white/5 rounded-full border border-white/5 shadow-sm active:scale-95"><Scaling className="w-4.5 h-4.5" /></button>
          <button onClick={() => router.back()} className="text-white/80 p-2 bg-white/5 rounded-full border border-white/5 shadow-sm active:scale-95"><X className="w-4.5 h-4.5" /></button>
        </div>
      </header>

      {/* Stats row */}
      <div className="relative z-20 px-4 flex items-center gap-3 mb-6">
        <div className="flex -space-x-1.5 items-center">
          <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
          {[1, 2, 3].map(i => (
            <Avatar key={i} className="w-5 h-5 border border-white/20">
              <AvatarImage src={`https://picsum.photos/seed/u${i}/100/100`} />
            </Avatar>
          ))}
        </div>
        <div className="bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
          <Users className="w-3 h-3 text-white/60" />
          <span className="text-white text-[10px] font-black tracking-tight">16</span>
        </div>
        <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/5 ml-auto">
          <History className="w-3 h-3 text-white/60" />
          <span className="text-white text-[10px] font-black uppercase tracking-widest">Record</span>
        </div>
      </div>

      {/* Seats Grid - 5 columns, 4 rows (20 seats) */}
      <main className="relative z-20 flex-1 px-3 overflow-y-auto no-scrollbar pb-40">
        <div className="grid grid-cols-5 gap-y-12 gap-x-1">
          {Array.from({ length: 20 }).map((_, idx) => {
            const user = occupied.find(u => u.seat === idx)
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="relative">
                  {user ? (
                    <>
                      {/* Decorative Frame Style */}
                      <div className={cn(
                        "w-14 h-14 rounded-full overflow-hidden border-2 relative z-10 p-0.5",
                        user.frame === 'gold' ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'border-blue-300'
                      )}>
                        <Image src={user.photo} alt={user.user} fill className="object-cover p-1 rounded-full" />
                      </div>
                      
                      {/* Hotness Bubble (Green) */}
                      <div className="absolute -bottom-2 inset-x-0 flex justify-center z-30">
                        <div className="bg-[#417505]/90 px-2.5 py-0.5 rounded-full border border-white/20 shadow-lg scale-90">
                          <span className="text-white text-[8px] font-black leading-none">{user.hot}</span>
                        </div>
                      </div>

                      {/* Crown/Decoration */}
                      <div className="absolute -top-5 -left-1 z-20 scale-125">
                         <Crown className={cn("w-6 h-6", user.frame === 'gold' ? 'text-amber-400 fill-amber-400' : 'text-blue-300 fill-blue-300')} />
                      </div>
                    </>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#4A3030]/60 border-2 border-white/5 flex items-center justify-center shadow-inner">
                      <Image src="https://placehold.co/100x100/4a3030/white?text=💺" alt="empty" width={20} height={20} className="opacity-20" />
                    </div>
                  )}
                </div>
                <span className="text-white text-[9px] font-bold truncate w-full text-center px-0.5 tracking-tighter opacity-80 uppercase">
                  {user ? user.user : (idx + 1)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Floating Chat Area */}
        <div className="mt-10 space-y-3 pr-10">
          <div className="flex gap-6 border-b border-white/5 mb-3 px-1">
            {['All', 'Chat'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "pb-2 text-[11px] font-black uppercase tracking-[0.2em]",
                  activeTab === tab ? "text-amber-400 border-b-2 border-amber-400" : "text-white/30"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pb-4">
            {DUMMY_CHATS.map((chat) => (
              <div key={chat.id} className="animate-in slide-in-from-left-2 duration-300">
                {chat.isSystem ? (
                  <div className={cn(
                    "flex items-center gap-2",
                    chat.vip ? "bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 w-fit" : "bg-black/10 rounded-xl px-2 py-1"
                  )}>
                    {chat.vip && (
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded italic text-[7px] font-black border border-white/20">
                        {chat.vip}
                      </span>
                    )}
                    <p className="text-[10px] text-white/70 font-medium leading-relaxed">
                      <span className="font-bold text-amber-200">{chat.user}:</span> {chat.text}
                    </p>
                  </div>
                ) : chat.avatar ? (
                  /* High-end Styled User Message Card */
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-2">
                       <Avatar className="w-8 h-8 border border-amber-400 shadow-lg"><AvatarImage src={chat.avatar} /></Avatar>
                       <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-black text-white">{chat.user} ♡☆💎</span>
                          <div className="flex gap-1 items-center">
                             <div className="bg-amber-400/20 text-amber-400 text-[6px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 uppercase border border-amber-400/30">
                                🦁 WE ROAR 🦁
                             </div>
                             <div className="bg-blue-500/30 text-blue-300 text-[6px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-blue-500/20">
                                ⭐ 29
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border-2 border-[#417505] inline-block ml-4 relative">
                       <p className="text-sm text-white font-medium">
                          <span className="text-[#417505] font-black mr-2">@MCC 😐</span>
                          {chat.text}
                       </p>
                       <div className="absolute -bottom-2 -right-4 bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded italic border border-white/20 shadow-lg">
                          VIP2
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 backdrop-blur-md rounded-2xl px-4 py-2 inline-block border border-white/5">
                    <p className="text-xs text-white font-medium">
                      <span className="text-blue-300 font-bold mr-2">{chat.user}</span>
                      {chat.text || "Entered the room"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Immersive Control Bar */}
      <footer className="relative z-30 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-3">
        <div className="flex-1 bg-black/40 backdrop-blur-3xl rounded-full h-11 flex items-center px-4 border border-white/10 group shadow-inner">
          <input 
            placeholder="t's Show You..." 
            className="bg-transparent border-none outline-none text-white text-[12px] font-medium flex-1 placeholder:text-white/40"
          />
          <Smile className="w-5 h-5 text-white/40 group-focus-within:text-white transition-colors cursor-pointer" />
        </div>

        <button className="w-11 h-11 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center text-white border border-white/5 active:scale-95 transition-all shadow-lg">
          <Gamepad2 className="w-5.5 h-5.5" />
        </button>

        <button className="w-11 h-11 bg-[#FFD600] rounded-full flex items-center justify-center text-black shadow-[0_4px_20px_rgba(255,214,0,0.3)] active:scale-95 transition-all">
          <GiftIcon className="w-5.5 h-5.5 fill-current" />
        </button>

        <button 
          onClick={() => setIsMicOn(!isMicOn)}
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 backdrop-blur-md shadow-lg",
            isMicOn ? "bg-white/10 text-white" : "bg-red-50 text-white"
          )}
        >
          {isMicOn ? <Mic className="w-5.5 h-5.5" /> : <MicOff className="w-5.5 h-5.5" />}
        </button>

        <button className="w-11 h-11 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center text-white relative border border-white/5 shadow-lg active:scale-95 transition-all">
          <MessageSquare className="w-5.5 h-5.5" />
          <div className="absolute -top-1.5 -right-1.5 bg-[#FF4B4B] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#1A0505] shadow-lg">99+</div>
        </button>

        <button className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/5 shadow-lg active:scale-95 transition-all">
          <LayoutGrid className="w-5.5 h-5.5" />
        </button>
      </footer>
    </div>
  )
}
