
"use client"

import { useEffect, useState, Suspense, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { doc, collection, addDoc } from "firebase/firestore"
import { ref, onValue, push, set, update, increment as rtdbIncrement, limitToLast, query as rtdbQuery, get, off, remove, serverTimestamp } from "firebase/database"
import { useFirestore, useUser, useDoc, useDatabase } from "@/firebase"
import { BottomNav } from "@/components/layout/BottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Send, 
  ChevronLeft, 
  ShoppingBag, 
  Gift as GiftIcon,
  Coins,
  Loader2,
  Trash2
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useUserPresence } from "@/hooks/use-presence"

interface Message {
  id: string
  text: string
  senderId: string
  timestamp: number
  isGift?: boolean
}

interface ChatSummary {
  id: string
  partnerId: string
  partnerName: string
  partnerPhoto: string
  lastMessage: string
  lastMessageAt: number
  unreadCount: number
  deletedAt?: number
}

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  gender?: string
  blocking?: string[]
  blockedBy?: string[]
  isAdmin?: boolean
  isVerified?: boolean
}

const GIFTS = [
  { id: 'heart', name: 'Heart', price: 150, icon: '❤️' },
  { id: 'butterfly', name: 'Butterfly', price: 500, icon: '🦋' },
  { id: 'flower', name: 'Diamond', price: 25000, icon: '💎' },
  { id: 'motor', name: 'Harley', price: 3000, icon: '🏍️' },
]

function ChatListItem({ summary, onClick, onDelete }: { summary: ChatSummary, onClick: () => void, onDelete: () => void }) {
  const presence = useUserPresence(summary.partnerId)
  const lastAt = new Date(summary.lastMessageAt || Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      onDelete()
    }, 800)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  return (
    <div 
      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-all active:scale-[0.98] border-b border-gray-50 select-none min-h-[80px]"
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault()
        onDelete()
      }}
    >
      <div className="relative">
        <Avatar className="w-14 h-14 rounded-full border-none shadow-sm">
          <AvatarImage src={summary.partnerPhoto} className="object-cover" />
          <AvatarFallback className="bg-[#00A2FF] text-white font-semibold text-sm">{summary.partnerName?.[0] || '?'}</AvatarFallback>
        </Avatar>
        {presence?.state === 'online' && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-1 max-w-[70%]">
            <h4 className="font-semibold text-sm text-black truncate">{summary.partnerName}</h4>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{format(lastAt, "HH:mm")}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className={cn("text-xs truncate flex-1 pr-2", summary.unreadCount > 0 ? "text-black font-semibold" : "text-gray-500 font-medium")}>
            {summary.lastMessage || "Start talking..."}
          </p>
          {summary.unreadCount > 0 && <div className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{summary.unreadCount}</div>}
        </div>
      </div>
    </div>
  )
}

function ChatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const startWithId = searchParams.get("startWith")
  const { user: currentUser } = useUser()
  const db = useFirestore()
  const rtdb = useDatabase()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const partnerPresence = useUserPresence(startWithId || undefined)
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUser?.uid ? doc(db, "users", currentUser.uid) : null)
  const { data: partnerProfile } = useDoc<UserProfile>(startWithId ? doc(db, "users", startWithId) : null)

  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isInitializingChat, setIsInitializingChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [userBalances, setUserBalances] = useState({ coins: 0, diamonds: 0 })
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>(() => {
    if (typeof window !== 'undefined' && currentUser?.uid) {
      const cached = localStorage.getItem(`chats_cache_${currentUser.uid}`)
      if (cached) return JSON.parse(cached)
    }
    return []
  })
  const [summariesLoading, setSummariesLoading] = useState(!chatSummaries.length)
  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<ChatSummary | null>(null)
  const [activeChatSummary, setActiveChatSummary] = useState<ChatSummary | null>(null)

  // Listen to RTDB Chat Summaries
  useEffect(() => {
    if (!currentUser?.uid) return
    const summariesRef = ref(rtdb, `user_chats/${currentUser.uid}`)
    const unsubscribe = onValue(summariesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ id, ...val }))
          .filter(summary => !!summary.lastMessage)
          .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
        
        setChatSummaries(list)
        localStorage.setItem(`chats_cache_${currentUser.uid}`, JSON.stringify(list))
        
        if (chatId) {
          const current = list.find(s => s.id === chatId)
          if (current) setActiveChatSummary(current)
        }
      } else {
        setChatSummaries([])
        localStorage.removeItem(`chats_cache_${currentUser.uid}`)
      }
      setSummariesLoading(false)
    })
    return () => off(summariesRef, 'value', unsubscribe)
  }, [rtdb, currentUser?.uid, chatId])

  // Mark Read when entering chat
  useEffect(() => {
    if (chatId && currentUser?.uid) {
      update(ref(rtdb, `user_chats/${currentUser.uid}/${chatId}`), { unreadCount: 0 })
    }
  }, [chatId, currentUser?.uid, rtdb])

  // Fetch balances
  useEffect(() => {
    if (!currentUser?.uid) return
    const balRef = ref(rtdb, `balances/${currentUser.uid}`)
    const unsubscribe = onValue(balRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setUserBalances({ coins: data.coins || 0, diamonds: data.diamonds || 0 })
      }
    })
    return () => off(balRef, 'value', unsubscribe)
  }, [rtdb, currentUser?.uid])

  // Listen to Messages (Limited to 20, filtered by deletedAt)
  useEffect(() => {
    if (!chatId) return
    const messagesRef = rtdbQuery(ref(rtdb, `chat_messages/${chatId}`), limitToLast(20))
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const msgs = snapshot.val() ? Object.entries(snapshot.val()).map(([id, val]: [string, any]) => ({ id, ...val })) : []
      
      // Filter by user's individual soft-delete timestamp
      const filtered = msgs
        .filter(m => !activeChatSummary?.deletedAt || m.timestamp > activeChatSummary.deletedAt)
        .sort((a, b) => b.timestamp - a.timestamp)
      
      setMessages(filtered)
    })
    return () => off(messagesRef, 'value', unsubscribe)
  }, [chatId, rtdb, activeChatSummary?.deletedAt])

  // Find or Create Chat ID
  useEffect(() => {
    if (!currentUser?.uid || !startWithId) return
    setIsInitializingChat(true)
    const findOrCreate = async () => {
      try {
        const summariesSnap = await get(ref(rtdb, `user_chats/${currentUser.uid}`))
        const summaries = summariesSnap.val() || {}
        let foundId = null
        Object.entries(summaries).forEach(([id, val]: [string, any]) => {
          if (val.partnerId === startWithId) foundId = id
        })

        if (foundId) setChatId(foundId)
        else {
          const newChatRef = await addDoc(collection(db, "chats"), {
            participants: [currentUser.uid, startWithId],
            createdAt: new Date().toISOString()
          })
          setChatId(newChatRef.id)
        }
      } finally {
        setIsInitializingChat(false)
      }
    }
    findOrCreate()
  }, [currentUser?.uid, startWithId, rtdb, db])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatId || !currentUser?.uid || !partnerProfile) return
    
    if (currentUserProfile?.gender === 'male' && !currentUserProfile?.isAdmin) {
      if (userBalances.coins < 15) {
        toast({ variant: "destructive", title: "Insufficient Coins" })
        return
      }
      await update(ref(rtdb, `balances/${currentUser.uid}`), { coins: rtdbIncrement(-15) })
      await set(push(ref(rtdb, `coin_history/${currentUser.uid}`)), {
        amount: -15,
        type: 'chat',
        description: `Chat with ${partnerProfile.name}`,
        timestamp: Date.now()
      })
    }

    const timestamp = Date.now()
    const msgData = { text: text.trim(), senderId: currentUser.uid, timestamp }
    
    await set(push(ref(rtdb, `chat_messages/${chatId}`)), msgData)

    const updates: any = {}
    updates[`user_chats/${currentUser.uid}/${chatId}`] = {
      partnerId: partnerProfile.uid,
      partnerName: partnerProfile.name,
      partnerPhoto: partnerProfile.photoURL,
      lastMessage: text.trim(),
      lastMessageAt: timestamp,
      unreadCount: 0,
      deletedAt: 0 // Reset deletedAt when a new message is sent/received
    }
    updates[`user_chats/${partnerProfile.uid}/${chatId}`] = {
      partnerId: currentUser.uid,
      partnerName: currentUserProfile?.name || "MatchFlow User",
      partnerPhoto: currentUserProfile?.photoURL || "",
      lastMessage: text.trim(),
      lastMessageAt: timestamp,
      unreadCount: rtdbIncrement(1),
      deletedAt: 0 // Ensure other person sees it if they also soft deleted
    }

    await update(ref(rtdb), updates)
    setNewMessage("")
  }

  const handleSendGift = async (gift: any) => {
    if (!currentUser?.uid || !partnerProfile || !chatId) return
    if (userBalances.coins < gift.price) { toast({ variant: "destructive", title: "Insufficient Coins" }); return }
    const timestamp = Date.now()
    try {
      await update(ref(rtdb, `balances/${currentUser.uid}`), { coins: rtdbIncrement(-gift.price) })
      const reward = Math.floor(gift.price * 0.5)
      await update(ref(rtdb, `balances/${partnerProfile.uid}`), { diamonds: rtdbIncrement(reward) })
      
      const text = `Sent a gift: ${gift.icon} ${gift.name}`
      await handleSendMessage(text)
      setIsGiftDrawerOpen(false)
    } catch (err) { toast({ variant: "destructive", title: "Gift Error" }) }
  }

  const handleDeleteChat = async () => {
    if (!currentUser?.uid || !chatToDelete) return
    try {
      // Soft Delete: Remove from user_chats and set deletedAt to current time
      // This makes the chat "blank" for this user until a new message arrives.
      const now = Date.now()
      await update(ref(rtdb, `user_chats/${currentUser.uid}/${chatToDelete.id}`), {
        lastMessage: "",
        unreadCount: 0,
        deletedAt: now
      })
      toast({ title: "Conversation removed" })
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" })
    } finally {
      setChatToDelete(null)
    }
  }

  if (!currentUser) return null

  if (!startWithId) {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-[100dvh] pb-20">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 pt-8 pb-3 flex items-center justify-between border-b">
          <h1 className="text-2xl font-bold text-[#00A2FF] tracking-tight">Chat</h1>
        </header>
        <main className="flex-1">
          {summariesLoading && !chatSummaries.length ? (
            <div className="flex items-center justify-center py-20 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : chatSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-12 text-center opacity-40">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p className="font-semibold text-black">No chats yet...</p>
            </div>
          ) : chatSummaries.map(summary => (
            <ChatListItem 
              key={summary.id} 
              summary={summary} 
              onClick={() => router.push(`/chats?startWith=${summary.partnerId}`)}
              onDelete={() => setChatToDelete(summary)}
            />
          ))}
        </main>
        
        <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
          <AlertDialogContent className="rounded-3xl max-w-[85vw]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">Delete Chat?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs font-medium">
                This will hide the conversation. It will reappear empty if you message them again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 mt-4">
              <AlertDialogCancel className="flex-1 h-12 rounded-full border-none bg-gray-100 font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteChat} className="flex-1 h-12 rounded-full bg-red-500 hover:bg-red-600 font-bold uppercase tracking-widest text-[10px]">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden relative">
      <header className="shrink-0 h-14 bg-white/80 backdrop-blur-xl px-4 flex items-center justify-between border-b shadow-sm z-50 sticky top-0">
        <Button variant="ghost" size="sm" onClick={() => router.push("/chats")} className="text-[#00A2FF]"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex flex-col items-center flex-1 mx-2">
          <h3 className="font-semibold text-sm text-black truncate max-w-[120px]">{partnerProfile?.name || '...'}</h3>
          {partnerPresence?.state === 'online' && <span className="text-[9px] font-bold text-green-500 uppercase">Online</span>}
        </div>
        <Avatar className="w-8 h-8 cursor-pointer" onClick={() => router.push(`/users/${startWithId}`)}>
          <AvatarImage src={partnerProfile?.photoURL} />
          <AvatarFallback>{partnerProfile?.name?.[0]}</AvatarFallback>
        </Avatar>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col-reverse p-4">
        <div className="flex flex-col-reverse space-y-4 space-y-reverse">
          <div ref={messagesEndRef} />
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser.uid ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn("max-w-[75%] p-3.5 text-xs font-medium rounded-[1.2rem]", msg.senderId === currentUser.uid ? 'bg-[#00A2FF] text-white rounded-br-none' : 'bg-gray-100 text-black rounded-bl-none')}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white border-t p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setIsGiftDrawerOpen(true)} className="text-[#00A2FF]"><GiftIcon className="w-6 h-6" /></Button>
        <div className="flex-1 bg-gray-100 rounded-full h-11 px-5 flex items-center">
          <input 
            placeholder="Type..." 
            className="bg-transparent flex-1 outline-none text-sm" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)} 
          />
        </div>
        <Button variant="ghost" onClick={() => handleSendMessage(newMessage)}><Send className="w-6 h-6 text-[#00A2FF]" /></Button>
      </footer>

      <Dialog open={isGiftDrawerOpen} onOpenChange={setIsGiftDrawerOpen}>
        <DialogContent className="bg-[#1A1C21] text-white rounded-t-[2.5rem] bottom-0 top-auto translate-y-0 max-w-md mx-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            {GIFTS.map(gift => (
              <div key={gift.id} onClick={() => handleSendGift(gift)} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95">
                <span className="text-3xl">{gift.icon}</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-2 h-2 text-yellow-500" />
                  <span className="text-[10px] font-bold">{gift.price}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ChatsPage() { return <Suspense fallback={null}><ChatsContent /></Suspense> }
