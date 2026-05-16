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
import { useUser } from "@/firebase"
import { getTRTCCredentials } from "@/app/actions/trtc"
import { trtcService } from "@/lib/trtc-service"
import { useToast } from "@/hooks/use-toast"

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
  const { user } = useUser()
  const { toast } = useToast()
  const [isMicOn, setIsMicOn] = useState(false)
  const [activeTab, setActiveTab] = useState<'All' | 'Chat'>('All')
  const [isConnecting, setIsConnecting] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // TRTC Integration Logic
  useEffect(() => {
    if (!user?.uid) return;

    const startVoice = async () => {
      const res = await getTRTCCredentials(user.uid);
      if (res.success && res.sdkAppId && res.userSig) {
        await trtcService.init({
          sdkAppId: res.sdkAppId,
          userId: res.userId,
          userSig: res.userSig
        });
        await trtcService.join(Number(roomId));
        setIsConnecting(false);
      } else {
        // If config is missing, we still show the UI but warn the developer
        console.warn("TRTC Config missing. Check Vercel environment variables.");
        setIsConnecting(false);
      }
    };

    startVoice();

    return () => {
      trtcService.leave();
    };
  }, [user?.uid, roomId]);

  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    trtcService.toggleMic(newState);
  };

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
            <p className="text-white/40 text-[8px] font-bold">ID:{roomId}</p>
          </div>
          <button className="bg-[#56E39F] rounded-full p-1.5 shadow-lg active:scale-95 transition-all ml-1">
            <Heart className="w-3.5 h-3.5 text-white fill-current" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isConnecting && <div className="text-[8px] font-black uppercase text-[#56E39F] animate-pulse">Connecting Voice...</div>}
          <button className="text-white/80 p-2 bg-white/5 rounded-full border border-white/5 shadow-sm active:scale-95"><ShoppingBag className="w-4.5 h-4.5" /></button>
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
      </div>

      {/* Seats Grid */}
      <main className="relative z-20 flex-1 px-3 overflow-y-auto no-scrollbar pb-40">
        <div className="grid grid-cols-5 gap-y-12 gap-x-1">
          {Array.from({ length: 20 }).map((_, idx) => {
            const userSeat = occupied.find(u => u.seat === idx)
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="relative">
                  {userSeat ? (
                    <>
                      <div className={cn(
                        "w-14 h-14 rounded-full overflow-hidden border-2 relative z-10 p-0.5",
                        userSeat.frame === 'gold' ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'border-blue-300'
                      )}>
                        <Image src={userSeat.photo} alt={userSeat.user} fill className="object-cover p-1 rounded-full" />
                      </div>
                      <div className="absolute -bottom-2 inset-x-0 flex justify-center z-30">
                        <div className="bg-[#417505]/90 px-2.5 py-0.5 rounded-full border border-white/20 shadow-lg scale-90">
                          <span className="text-white text-[8px] font-black leading-none">{userSeat.hot}</span>
                        </div>
                      </div>
                      <div className="absolute -top-5 -left-1 z-20 scale-125">
                         <Crown className={cn("w-6 h-6", userSeat.frame === 'gold' ? 'text-amber-400 fill-amber-400' : 'text-blue-300 fill-blue-300')} />
                      </div>
                    </>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#4A3030]/60 border-2 border-white/5 flex items-center justify-center shadow-inner">
                      <span className="text-white/20 font-black text-[10px]">{idx + 1}</span>
                    </div>
                  )}
                </div>
                <span className="text-white text-[9px] font-bold truncate w-full text-center px-0.5 tracking-tighter opacity-80 uppercase">
                  {userSeat ? userSeat.user : "Seat"}
                </span>
              </div>
            )
          })}
        </div>

        {/* Chat Area */}
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
                  <div className="bg-black/10 rounded-xl px-2 py-1 flex items-center gap-2">
                    <p className="text-[10px] text-white/70 font-medium leading-relaxed">
                      <span className="font-bold text-amber-200">{chat.user}:</span> {chat.text}
                    </p>
                  </div>
                ) : (
                  <div className="bg-black/30 backdrop-blur-md rounded-2xl px-4 py-2 inline-block border border-white/5">
                    <p className="text-xs text-white font-medium">
                      <span className="text-blue-300 font-bold mr-2">{chat.user}</span>
                      {chat.text}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Control Bar */}
      <footer className="relative z-30 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-3">
        <div className="flex-1 bg-black/40 backdrop-blur-3xl rounded-full h-11 flex items-center px-4 border border-white/10 group shadow-inner">
          <input 
            placeholder="Say something..." 
            className="bg-transparent border-none outline-none text-white text-[12px] font-medium flex-1 placeholder:text-white/40"
          />
          <Smile className="w-5 h-5 text-white/40" />
        </div>

        <button className="w-11 h-11 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center text-white border border-white/5 active:scale-95"><Gamepad2 className="w-5.5 h-5.5" /></button>
        <button className="w-11 h-11 bg-[#FFD600] rounded-full flex items-center justify-center text-black shadow-lg active:scale-95"><GiftIcon className="w-5.5 h-5.5 fill-current" /></button>

        <button 
          onClick={toggleMic}
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 backdrop-blur-md",
            isMicOn ? "bg-[#56E39F] text-white" : "bg-white/10 text-white/40"
          )}
        >
          {isMicOn ? <Mic className="w-5.5 h-5.5" /> : <MicOff className="w-5.5 h-5.5" />}
        </button>

        <button className="w-11 h-11 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center text-white relative border border-white/5 active:scale-95">
          <MessageSquare className="w-5.5 h-5.5" />
          <div className="absolute -top-1.5 -right-1.5 bg-[#FF4B4B] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black">99+</div>
        </button>

        <button className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/5 active:scale-95"><LayoutGrid className="w-5.5 h-5.5" /></button>
      </footer>
      
      {/* Hidden Audio Container for TRTC */}
      <div id="remote-audio-container" className="hidden" />
    </div>
  )
}
