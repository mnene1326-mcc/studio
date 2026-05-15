
"use client"

import { useEffect, useState, Suspense, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { doc, getDocs, collection, query, where, updateDoc, increment, getDoc, serverTimestamp, orderBy, limit, addDoc } from "firebase/firestore"
import { ref, onValue, push, set, serverTimestamp as rtdbTimestamp, update, increment as rtdbIncrement, limitToLast, query as rtdbQuery, off } from "firebase/database"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, useDatabase } from "@/firebase"
import { BottomNav } from "@/components/layout/BottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Send, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  ChevronDown,
  Lock,
  Trash2,
  Circle,
  BadgeCheck,
  Gift as GiftIcon,
  Coins,
  ChevronRight
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

interface Chat {
  id: string
  participants: string[]
  lastMessage?: string
  lastMessageAt?: any
  createdAt: any
  clearedAt?: Record<string, any>
  maleMessageCount?: number
}

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  gender?: string
  blocking?: string[]
  blockedBy?: string[]
  isAdmin?: boolean
  isCoinSeller?: boolean
  isVerified?: boolean
}

const GIFTS = [
  { id: '2026', name: '2026', price: 20, icon: '🎆' },
  { id: 'heart', name: 'Heart', price: 150, icon: '❤️' },
  { id: 'e-heart', name: 'Electric heart', price: 500, icon: '⚡' },
  { id: 'flower', name: 'Flower diamond', price: 25990, icon: '💎' },
  { id: 'nigeria', name: 'Nigeria', price: 300, icon: '🇳🇬' },
  { id: 'butterfly', name: 'Shiny Butterfly', price: 500, icon: '🦋' },
  { id: 'necklace', name: 'Gold Necklace', price: 1500, icon: '📿' },
  { id: 'parrot', name: 'Flying Parrot', price: 500, icon: '🦜' },
  { id: 'drum', name: 'African drum', price: 300, icon: '🪘' },
  { id: 'harley', name: 'Harley Motors', price: 3000, icon: '🏍️' },
  { id: 'dress', name: 'Dress', price: 800, icon: '👗' },
  { id: 'phone', name: 'Antique Telephone', price: 400, icon: '☎️' },
]

function ChatListItem({ chat, currentUserUid, blocking, blockedBy, onDelete }: { chat: Chat, currentUserUid: string, blocking: string[], blockedBy: string[], onDelete: (chat: Chat) => void }) {
  const router = useRouter()
  const db = useFirestore()
  const rtdb = useDatabase()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)
  const [partner, setPartner] = useState<UserProfile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const presence = useUserPresence(partner?.uid)
  
  const partnerId = chat.participants.find(id => id !== currentUserUid)

  useEffect(() => {
    if (!partnerId) return
    getDoc(doc(db, "users", partnerId)).then(snap => {
      if (snap.exists()) setPartner({ uid: snap.id, ...snap.data() } as UserProfile)
    })

    const unreadRef = ref(rtdb, `unreads/${currentUserUid}/${chat.id}`)
    const unsubscribe = onValue(unreadRef, (snapshot) => {
      setUnreadCount(snapshot.val() || 0)
    })
    return () => unsubscribe()
  }, [db, rtdb, partnerId, currentUserUid, chat.id])

  const handleTouchStart = () => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      onDelete(chat)
    }, 400)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const handleClick = () => {
    if (isLongPress.current) return
    router.push(`/chats?startWith=${partnerId}`)
  }

  if (!partner || blocking.includes(partner.uid) || blockedBy.includes(partner.uid)) return null

  const lastAt = chat.lastMessageAt?.toDate?.() || new Date(chat.lastMessageAt || Date.now())

  return (
    <div 
      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-all active:scale-[0.98] border-b border-gray-50 select-none"
      onClick={handleClick}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        <Avatar className="w-14 h-14 rounded-full border-none shadow-sm">
          <AvatarImage src={partner.photoURL} className="object-cover" />
          <AvatarFallback className="bg-[#00A2FF] text-white font-semibold text-sm">{partner.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        {presence?.state === 'online' && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-1 max-w-[70%]">
            <h4 className="font-semibold text-sm text-black truncate">{partner.name}</h4>
            {partner.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#00A2FF] fill-white shrink-0" />}
            {partner.isAdmin && <Circle className="w-2 h-2 fill-[#00A2FF] text-[#00A2FF] shrink-0" />}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">
            {format(lastAt, "HH:mm")}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className={cn("text-xs truncate flex-1 pr-2", unreadCount > 0 ? "text-black font-semibold" : "text-gray-500 font-medium")}>
            {chat.lastMessage || "Start talking..."}
          </p>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GiftDrawer({ 
  onSend, 
  userBalance, 
  open, 
  onOpenChange 
}: { 
  onSend: (gift: typeof GIFTS[0]) => void, 
  userBalance: number,
  open: boolean,
  onOpenChange: (open: boolean) => void
}) {
  const [selectedGiftId, setSelectedGiftId] = useState(GIFTS[0].id)
  const selectedGift = GIFTS.find(g => g.id === selectedGiftId)!

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none bg-[#1A1C21] text-white rounded-t-[2.5rem] sm:rounded-t-[2.5rem] max-w-md mx-auto fixed bottom-0 top-auto translate-y-0">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-6 px-2 overflow-x-auto no-scrollbar py-2 border-b border-white/5">
            {['Gift', 'Privilege'].map(tab => (
              <span key={tab} className={cn(
                "text-xs font-bold uppercase tracking-widest cursor-pointer whitespace-nowrap",
                tab === 'Gift' ? "text-white border-b-2 border-[#D4FF00] pb-1" : "text-gray-500"
              )}>
                {tab}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto no-scrollbar px-2">
            {GIFTS.map(gift => (
              <div 
                key={gift.id}
                onClick={() => setSelectedGiftId(gift.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all cursor-pointer aspect-square",
                  selectedGiftId === gift.id ? "border-[#D4FF00] bg-white/5" : "border-transparent"
                )}
              >
                <span className="text-3xl mb-1">{gift.icon}</span>
                <div className="flex items-center gap-0.5 mt-1">
                  <Coins className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                  <span className="text-[10px] font-bold">{gift.price}</span>
                </div>
                <span className="text-[8px] text-gray-500 truncate w-full text-center mt-0.5">{gift.name}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 pb-6 px-4">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <Coins className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-lg font-bold">{userBalance}</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            <Button 
              onClick={() => onSend(selectedGift)}
              className="bg-[#D4FF00] text-black font-bold h-12 px-8 rounded-full hover:bg-[#c4eb00] active:scale-95 transition-all"
            >
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const inputRef = useRef<HTMLInputElement>(null)

  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isInitializingChat, setIsInitializingChat] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null)
  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  
  const [userBalances, setUserBalances] = useState({ coins: 0, diamonds: 0 })

  const currentUserRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserRef)

  useEffect(() => {
    if (!currentUser?.uid) return
    const balanceRef = ref(rtdb, `balances/${currentUser.uid}`)
    const unsubscribe = onValue(balanceRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setUserBalances({ coins: data.coins || 0, diamonds: data.diamonds || 0 })
    })
    return () => unsubscribe()
  }, [rtdb, currentUser?.uid])

  const chatListQuery = useMemoFirebase(() => {
    if (!currentUser?.uid) return null
    return query(
      collection(db, "chats"), 
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc"),
      limit(20)
    )
  }, [db, currentUser?.uid])

  const { data: userChatsRaw, loading: listLoading } = useCollection<Chat>(chatListQuery)

  const userChats = useMemo(() => {
    if (!currentUser?.uid || !currentUserProfile) return []
    const blocking = currentUserProfile.blocking || []
    const blockedBy = currentUserProfile.blockedBy || []
    
    return [...userChatsRaw].filter(chat => {
      if (!chat.lastMessage || chat.lastMessage.trim() === "") return false
      const clearedAt = chat.clearedAt?.[currentUser.uid]
      const partnerId = chat.participants.find(p => p !== currentUser.uid)
      if (partnerId && (blocking.includes(partnerId) || blockedBy.includes(partnerId))) return false
      
      const lastAtMillis = chat.lastMessageAt?.toMillis?.() || new Date(chat.lastMessageAt).getTime()
      const clearedAtMillis = clearedAt?.toMillis?.() || new Date(clearedAt || 0).getTime()
      return lastAtMillis > clearedAtMillis
    })
  }, [userChatsRaw, currentUser?.uid, currentUserProfile])

  const currentChatData = useMemo(() => {
    return userChatsRaw.find(c => c.id === chatId)
  }, [userChatsRaw, chatId])

  const partnerRef = useMemoFirebase(() => startWithId ? doc(db, "users", startWithId) : null, [db, startWithId])
  const { data: chatPartner } = useDoc<UserProfile>(partnerRef)
  const partnerPresence = useUserPresence(chatPartner?.uid)

  const isBlocked = useMemo(() => {
    if (!chatPartner || !currentUserProfile) return false
    const blocking = currentUserProfile.blocking || []
    const blockedBy = currentUserProfile.blockedBy || []
    return blocking.includes(chatPartner.uid) || blockedBy.includes(chatPartner.uid)
  }, [chatPartner, currentUserProfile])

  useEffect(() => {
    if (chatId && currentUser?.uid) {
      const unreadRef = ref(rtdb, `unreads/${currentUser.uid}/${chatId}`)
      set(unreadRef, 0)
    }
  }, [chatId, currentUser?.uid, rtdb])

  useEffect(() => {
    if (!currentUser?.uid || !startWithId) {
      setChatId(null)
      setIsInitializingChat(false)
      return
    }
    
    let isMounted = true
    const findOrCreateChat = async () => {
      setIsInitializingChat(true)
      try {
        const chatsRef = collection(db, "chats")
        const chatsSnap = await getDocs(query(chatsRef, where("participants", "array-contains", currentUser.uid)))
        
        if (!isMounted) return

        let existingChatId = null
        chatsSnap.forEach((doc) => {
          const data = doc.data()
          if (data.participants?.includes(startWithId)) existingChatId = doc.id
        })

        if (existingChatId) {
          setChatId(existingChatId)
        } else {
          const chatData = {
            participants: [currentUser.uid, startWithId],
            createdAt: serverTimestamp(),
            lastMessage: "",
            lastMessageAt: serverTimestamp(),
            maleMessageCount: 0
          }
          const newChatDoc = await addDoc(chatsRef, chatData)
          if (isMounted) setChatId(newChatDoc.id)
        }
      } catch (err: any) {
        if (isMounted) toast({ variant: "destructive", title: "Chat Error", description: err.message })
      } finally {
        if (isMounted) setIsInitializingChat(false)
      }
    }
    findOrCreateChat()
    return () => { isMounted = false }
  }, [currentUser?.uid, startWithId, db, toast])

  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setMessagesLoading(false)
      return
    }
    
    setMessagesLoading(true)
    const messagesRef = rtdbQuery(ref(rtdb, `chat_messages/${chatId}`), limitToLast(50))
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const msgs = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        })).sort((a, b) => b.timestamp - a.timestamp)
        setMessages(msgs)
      } else {
        setMessages([])
      }
      setMessagesLoading(false)
    }, (err) => {
      console.error("RTDB Error:", err)
      setMessagesLoading(false)
    })
    
    return () => unsubscribe()
  }, [chatId, rtdb])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatId || !currentUser?.uid || !currentUserProfile || isBlocked) return
    
    const isFree = currentUserProfile.isAdmin || currentUserProfile.isCoinSeller || chatPartner?.isAdmin || chatPartner?.isCoinSeller;
    const partnerId = currentChatData?.participants.find(p => p !== currentUser.uid);

    const msgRef = push(ref(rtdb, `chat_messages/${chatId}`))
    const timestamp = Date.now()
    const msgData = { text: text.trim(), senderId: currentUser.uid, timestamp }

    try {
      await set(msgRef, msgData)

      if (partnerId) {
        update(ref(rtdb), { [`unreads/${partnerId}/${chatId}`]: rtdbIncrement(1) })
      }

      if (!isFree && currentUserProfile.gender === 'male') {
        const currentCount = currentChatData?.maleMessageCount || 0
        const nextCount = currentCount + 1

        if (nextCount >= 10) {
          if (userBalances.coins < 150) {
            toast({ variant: "destructive", title: "Insufficient Coins", description: "Batch of 10 messages costs 150 coins." })
            return
          }
          await update(ref(rtdb, `balances/${currentUser.uid}`), {
            coins: rtdbIncrement(-150),
            updatedAt: timestamp
          })
          await updateDoc(doc(db, "chats", chatId), { maleMessageCount: 0 })
        } else {
          await updateDoc(doc(db, "chats", chatId), { maleMessageCount: nextCount })
        }
      }

      if (currentUserProfile.gender === 'male' && chatPartner?.gender === 'female' && messages.length > 0) {
        const lastMsg = messages[0]
        if (lastMsg.senderId === chatPartner.uid) {
          const diffSeconds = (timestamp - lastMsg.timestamp) / 1000
          const partnerBalRef = ref(rtdb, `balances/${chatPartner.uid}`)
          if (diffSeconds < 60) {
            await update(partnerBalRef, { diamonds: rtdbIncrement(5), updatedAt: timestamp })
          } else {
            await update(partnerBalRef, { coins: rtdbIncrement(2), updatedAt: timestamp })
          }
        }
      }

      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: text.trim(),
        lastMessageAt: serverTimestamp()
      })

      setNewMessage("")
      inputRef.current?.focus()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const handleSendGift = async (gift: typeof GIFTS[0]) => {
    if (!currentUser?.uid || !currentUserProfile || !chatPartner || !chatId) return
    
    if (userBalances.coins < gift.price) {
      toast({ variant: "destructive", title: "Insufficient Coins" })
      return
    }

    const timestamp = Date.now()
    try {
      await update(ref(rtdb, `balances/${currentUser.uid}`), { 
        coins: rtdbIncrement(-gift.price),
        updatedAt: timestamp
      })

      const share = chatPartner.gender === 'female' ? 0.5 : 0.4
      const diamondReward = Math.floor(gift.price * share)
      await update(ref(rtdb, `balances/${chatPartner.uid}`), { 
        diamonds: rtdbIncrement(diamondReward),
        updatedAt: timestamp
      })

      const text = `Sent a gift: ${gift.icon} ${gift.name}`
      await push(ref(rtdb, `chat_messages/${chatId}`), {
        text,
        senderId: currentUser.uid,
        timestamp,
        isGift: true
      })
      
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      })

      setIsGiftDrawerOpen(false)
      toast({ title: "Gift Sent!" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gift Error", description: err.message })
    }
  }

  const handleSoftDelete = async () => {
    if (!chatToDelete || !currentUser?.uid) return
    try {
      await updateDoc(doc(db, "chats", chatToDelete.id), {
        [`clearedAt.${currentUser.uid}`]: serverTimestamp()
      })
      set(ref(rtdb, `unreads/${currentUser.uid}/${chatToDelete.id}`), 0)
      toast({ title: "Chat deleted" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
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
          {listLoading && userChats.length === 0 ? (
             <div className="p-4 space-y-4">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="flex gap-4 items-center">
                   <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                   </div>
                 </div>
               ))}
             </div>
          ) : userChats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-32 px-12 opacity-40">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p className="font-semibold text-xl text-black">No chats yet...</p>
            </div>
          ) : (
            <div className="bg-white">
              {userChats.map(chat => (
                <ChatListItem 
                  key={chat.id} 
                  chat={chat} 
                  currentUserUid={currentUser.uid} 
                  blocking={currentUserProfile?.blocking || []}
                  blockedBy={currentUserProfile?.blockedBy || []}
                  onDelete={setChatToDelete}
                />
              ))}
            </div>
          )}
        </main>

        <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
          <AlertDialogContent className="rounded-[2.5rem] border-none p-8 max-w-[85vw]">
            <AlertDialogHeader className="items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-[#00A2FF]" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold text-black">Delete Chat?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3 mt-6">
              <AlertDialogCancel className="flex-1 rounded-full h-14 border-2 mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSoftDelete} className="flex-1 rounded-full h-14 bg-[#00A2FF]">Delete</AlertDialogAction>
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => router.push("/chats")} className="rounded-full text-[#00A2FF] font-semibold px-2">
            <ChevronLeft className="w-6 h-6 mr-0.5" />
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-2">
          <div className="flex items-center justify-center gap-1 w-full">
            <h3 className="font-semibold text-sm tracking-tight text-black uppercase truncate max-w-[80%]">{chatPartner?.name || '...'}</h3>
            {chatPartner?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#00A2FF] fill-white shrink-0" />}
          </div>
          {partnerPresence?.state === 'online' && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Online</span>
            </div>
          )}
        </div>

        <Avatar className="w-8 h-8 rounded-full border border-gray-100">
          <AvatarImage src={chatPartner?.photoURL} />
          <AvatarFallback className="font-semibold text-[10px]">{chatPartner?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col-reverse">
        <div className="flex flex-col-reverse px-4 py-6 space-y-6 space-y-reverse">
          <div ref={messagesEndRef} />
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser.uid ? 'flex-row-reverse' : 'flex-row')}>
              {msg.senderId !== currentUser.uid && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={chatPartner?.photoURL} />
                  <AvatarFallback className="text-[8px] font-medium">{chatPartner?.name?.[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                "max-w-[75%] p-3.5 text-xs font-medium shadow-sm",
                msg.senderId === currentUser.uid 
                  ? 'bg-[#00A2FF] text-white rounded-[1.2rem] rounded-br-none' 
                  : 'bg-gray-100 text-black rounded-[1.2rem] rounded-bl-none border border-gray-100'
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          {(isInitializingChat || messagesLoading) && (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-[#00A2FF] animate-spin opacity-20" /></div>
          )}
          {isBlocked && (
            <div className="flex flex-col items-center justify-center p-8 opacity-50">
               <Lock className="w-8 h-8 text-gray-400 mb-2" />
               <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Messaging disabled</p>
            </div>
          )}
        </div>
      </main>

      {!isBlocked && (
        <footer className="shrink-0 bg-white border-t z-50 pb-safe sticky bottom-0">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsGiftDrawerOpen(true)} className="text-[#00A2FF] rounded-full w-11 h-11">
              <GiftIcon className="w-6 h-6" />
            </Button>
            <div className="flex-1 bg-gray-100 rounded-full h-11 px-5 flex items-center">
              <input 
                ref={inputRef}
                placeholder="Start chatting..." 
                className="bg-transparent border-none flex-1 outline-none text-sm font-medium placeholder:text-gray-400 text-black" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(newMessage); }}
              />
            </div>
            <Button variant="ghost" size="icon" className={cn("w-10 h-10 rounded-full", newMessage.trim() ? "text-[#00A2FF]" : "text-gray-300")} onClick={() => handleSendMessage(newMessage)}>
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </footer>
      )}

      <GiftDrawer 
        open={isGiftDrawerOpen} 
        onOpenChange={setIsGiftDrawerOpen}
        userBalance={userBalances.coins}
        onSend={handleSendGift}
      />
    </div>
  )
}

export default function ChatsPage() {
  return (
    <Suspense fallback={null}>
      <ChatsContent />
    </Suspense>
  )
}
