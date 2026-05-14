
"use client"

import { useEffect, useState, Suspense, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, limit, updateDoc, increment, orderBy, getDoc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
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
  Send, 
  ChevronLeft, 
  ShoppingBag, 
  User as UserIcon, 
  Loader2, 
  ChevronDown,
  Lock,
  Trash2,
  Circle
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useUserPresence } from "@/hooks/use-presence"

interface Message {
  id: string
  text: string
  senderId: string
  timestamp: any
}

interface Chat {
  id: string
  participants: string[]
  lastMessage?: string
  lastMessageAt?: any
  createdAt: any
  clearedAt?: Record<string, any>
  unreadCount?: Record<string, number>
}

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  gender?: string
  coins?: number
  blocking?: string[]
  blockedBy?: string[]
}

const toMillisSafe = (ts: any): number => {
  if (!ts) return Date.now();
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds !== undefined) return ts.seconds * 1000;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') return new Date(ts).getTime();
  return 0;
};

const toDateSafe = (ts: any): Date => {
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

function ChatListItem({ chat, currentUserUid, blocking, blockedBy, onDelete }: { chat: Chat, currentUserUid: string, blocking: string[], blockedBy: string[], onDelete: (chat: Chat) => void }) {
  const router = useRouter()
  const db = useFirestore()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)
  const [partner, setPartner] = useState<UserProfile | null>(null)
  const presence = useUserPresence(partner?.uid)
  
  const partnerId = chat.participants.find(id => id !== currentUserUid)
  const unread = chat.unreadCount?.[currentUserUid] || 0

  useEffect(() => {
    if (!partnerId) return
    getDoc(doc(db, "users", partnerId)).then(snap => {
      if (snap.exists()) setPartner({ uid: snap.id, ...snap.data() } as UserProfile)
    })
  }, [db, partnerId])

  const handleTouchStart = () => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      onDelete(chat)
    }, 600)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const handleClick = () => {
    if (isLongPress.current) return
    router.push(`/chats?startWith=${partnerId}`)
  }

  if (!partner || blocking.includes(partner.uid) || blockedBy.includes(partner.uid)) return null

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
          <AvatarFallback className="bg-[#00A2FF] text-white font-black text-sm">{partner.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        {presence?.state === 'online' && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="font-black text-sm text-black truncate">{partner.name}</h4>
          <span className="text-[10px] text-gray-400 font-bold">
            {chat.lastMessageAt ? format(toDateSafe(chat.lastMessageAt), "HH:mm") : "..."}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className={cn("text-xs truncate font-bold flex-1 pr-2", unread > 0 ? "text-black font-black" : "text-gray-500")}>
            {chat.lastMessage || "Start talking..."}
          </p>
          {unread > 0 && (
            <div className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unread}
            </div>
          )}
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isInitializingChat, setIsInitializingChat] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null)
  
  const [chatListLimit, setChatListLimit] = useState(20)
  const [messagesLimit, setMessagesLimit] = useState(20)

  const currentUserRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserRef)

  const chatListQuery = useMemoFirebase(() => {
    if (!currentUser?.uid) return null
    return query(
      collection(db, "chats"), 
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc"),
      limit(chatListLimit)
    )
  }, [db, currentUser?.uid, chatListLimit])

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
      if (!clearedAt) return true
      const lastAtMillis = toMillisSafe(chat.lastMessageAt)
      const clearedAtMillis = toMillisSafe(clearedAt)
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

  // Clear unread count when opening chat
  useEffect(() => {
    if (chatId && currentUser?.uid) {
      const chatRef = doc(db, "chats", chatId);
      updateDoc(chatRef, {
        [`unreadCount.${currentUser.uid}`]: 0
      });
    }
  }, [chatId, currentUser?.uid, db]);

  useEffect(() => {
    if (!currentUser?.uid || !startWithId) {
      setChatId(null)
      return
    }
    let isMounted = true
    const findOrCreateChat = async () => {
      setIsInitializingChat(true)
      try {
        const chatsRef = collection(db, "chats")
        const chatsSnap = await getDocs(query(chatsRef, where("participants", "array-contains", currentUser.uid)))
        let existingChatId = null
        chatsSnap.forEach((doc) => {
          const data = doc.data()
          if (data.participants?.includes(startWithId)) existingChatId = doc.id
        })
        if (!isMounted) return
        if (existingChatId) {
          setChatId(existingChatId)
        } else {
          const chatData = {
            participants: [currentUser.uid, startWithId],
            createdAt: serverTimestamp(),
            lastMessage: "",
            lastMessageAt: serverTimestamp(),
            unreadCount: { [currentUser.uid]: 0, [startWithId]: 0 }
          }
          const newChatDoc = await addDoc(chatsRef, chatData)
          if (isMounted) setChatId(newChatDoc.id)
        }
      } catch (err: any) {
        if (isMounted) {
          toast({ variant: "destructive", title: "Chat Error", description: err.message || "Failed to initialize chat." })
        }
      } finally {
        if (isMounted) setIsInitializingChat(false)
      }
    }
    findOrCreateChat()
    return () => { isMounted = false }
  }, [currentUser?.uid, startWithId, db, toast])

  const messagesQuery = useMemoFirebase(() => {
    if (!chatId) return null
    return query(
      collection(db, "chats", chatId, "messages"), 
      orderBy("timestamp", "desc"),
      limit(messagesLimit)
    )
  }, [db, chatId, messagesLimit])

  const { data: messagesRaw, loading: messagesLoading } = useCollection<Message>(messagesQuery)

  const messages = useMemo(() => {
    if (!currentUser?.uid || !currentChatData) return messagesRaw
    const clearedAt = currentChatData.clearedAt?.[currentUser.uid]
    if (!clearedAt) return messagesRaw
    const clearedAtMillis = toMillisSafe(clearedAt)
    return messagesRaw.filter(m => toMillisSafe(m.timestamp) > clearedAtMillis)
  }, [messagesRaw, currentUser?.uid, currentChatData])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatId || !currentUser?.uid || !currentUserProfile || isBlocked) return
    
    if (currentUserProfile.gender === 'male') {
      const currentCoins = currentUserProfile.coins || 0
      if (currentCoins < 15) {
        toast({
          variant: "destructive",
          title: "Insufficient Coins",
          description: "Sending a message costs 15 coins. Please recharge.",
        })
        return
      }
      const userRef = doc(db, "users", currentUser.uid)
      await updateDoc(userRef, { coins: increment(-15) }).catch((err) => {
         toast({ variant: "destructive", title: "Error", description: err.message })
      })
    }

    const partnerId = currentChatData?.participants.find(p => p !== currentUser.uid);

    const msgData = { text: text.trim(), senderId: currentUser.uid, timestamp: serverTimestamp() }
    setNewMessage("")
    
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
    
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), msgData)
      const chatUpdate: any = { 
        lastMessage: text.trim(), 
        lastMessageAt: serverTimestamp()
      };
      if (partnerId) {
        chatUpdate[`unreadCount.${partnerId}`] = increment(1);
      }
      await updateDoc(doc(db, "chats", chatId), chatUpdate)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const handleSoftDelete = async () => {
    if (!chatToDelete || !currentUser?.uid) return
    try {
      const chatRef = doc(db, "chats", chatToDelete.id)
      await updateDoc(chatRef, {
        [`clearedAt.${currentUser.uid}`]: serverTimestamp(),
        [`unreadCount.${currentUser.uid}`]: 0
      })
      toast({ title: "Chat deleted", description: "The conversation has been cleared." })
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
          <h1 className="text-2xl font-logo text-[#00A2FF] tracking-tight">Chat</h1>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#00A2FF] hover:bg-blue-50" onClick={() => router.push('/recharge')}>
                <ShoppingBag className="w-6 h-6" />
             </Button>
             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#00A2FF] hover:bg-blue-50" onClick={() => router.push('/me')}>
                <UserIcon className="w-6 h-6" />
             </Button>
          </div>
        </header>

        <main className="flex-1">
          {listLoading && userChats.length === 0 ? (
             <div className="p-4 space-y-4">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="flex gap-4 items-center">
                   <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                     <div className="h-3 w-1/2 bg-muted animate-pulse rounded opacity-50" />
                   </div>
                 </div>
               ))}
             </div>
          ) : userChats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-32 px-12 space-y-4 opacity-40">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p className="font-black text-xl text-black">No chats yet...</p>
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
              
              {userChatsRaw.length >= chatListLimit && (
                <div className="p-4 flex justify-center">
                   <Button 
                    variant="ghost" 
                    className="text-[10px] font-black uppercase text-gray-400 gap-2"
                    onClick={() => setChatListLimit(prev => prev + 20)}
                   >
                     <ChevronDown className="w-4 h-4" />
                     Show older chats
                   </Button>
                </div>
              )}
            </div>
          )}
        </main>

        <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
          <AlertDialogContent className="rounded-[2.5rem] border-none p-8 max-w-[85vw]">
            <AlertDialogHeader className="items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-[#00A2FF]" />
              </div>
              <AlertDialogTitle className="text-xl font-black text-black">Delete Chat?</AlertDialogTitle>
              <AlertDialogDescription />
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3 mt-6">
              <AlertDialogCancel className="flex-1 rounded-full h-14 border-2 border-gray-100 font-black text-gray-400 uppercase tracking-widest text-[10px] mt-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSoftDelete}
                className="flex-1 rounded-full h-14 bg-[#00A2FF] hover:bg-[#0081CC] font-black text-white uppercase tracking-widest text-[10px]"
              >
                Delete
              </AlertDialogAction>
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/chats")} 
            className="rounded-full text-[#00A2FF] font-black px-2 hover:bg-blue-50"
          >
            <ChevronLeft className="w-6 h-6 mr-0.5" />
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-2">
          <h3 className="font-black text-sm tracking-tight text-center text-black uppercase truncate w-full">
            {chatPartner?.name || '...'}
          </h3>
          {partnerPresence?.state === 'online' && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Online</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 rounded-full border border-gray-100">
            <AvatarImage src={chatPartner?.photoURL} />
            <AvatarFallback className="font-black text-[10px]">{chatPartner?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col-reverse">
        <div className="flex flex-col-reverse px-4 py-6 space-y-6 space-y-reverse">
          <div ref={messagesEndRef} />
          
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser.uid ? 'flex-row-reverse' : 'flex-row')}>
              {msg.senderId !== currentUser.uid && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={chatPartner?.photoURL} />
                  <AvatarFallback className="text-[8px]">{chatPartner?.name?.[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                "max-w-[75%] p-3.5 text-xs font-bold shadow-sm",
                msg.senderId === currentUser.uid 
                  ? 'bg-[#00A2FF] text-white rounded-[1.2rem] rounded-br-none' 
                  : 'bg-gray-100 text-black rounded-[1.2rem] rounded-bl-none border border-gray-100'
              )}>
                {msg.text}
              </div>
            </div>
          ))}

          {(isInitializingChat || (messagesLoading && messages.length === 0)) && (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 text-[#00A2FF] animate-spin opacity-20" />
            </div>
          )}

          {messagesRaw.length >= messagesLimit && messagesRaw.length > 0 && (
            <div className="flex justify-center py-4">
               <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-black text-[#00A2FF] uppercase tracking-widest gap-2 hover:bg-blue-50 rounded-full h-8"
                onClick={() => setMessagesLimit(prev => prev + 20)}
               >
                 <ChevronDown className="w-3.5 h-3.5" />
                 Load previous messages
               </Button>
            </div>
          )}

          {isBlocked && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 opacity-50">
               <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-gray-400" />
               </div>
               <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Messaging disabled</p>
            </div>
          )}
        </div>
      </main>

      {!isBlocked && (
        <footer className="shrink-0 bg-white border-t z-50 pb-safe sticky bottom-0">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-11 px-5 flex items-center">
              <input 
                ref={inputRef}
                placeholder="Start chatting..." 
                className="bg-transparent border-none flex-1 outline-none text-sm font-bold placeholder:text-gray-400 text-black" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage(newMessage);
                  }
                }}
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("w-10 h-10 rounded-full transition-all", newMessage.trim() ? "text-[#00A2FF]" : "text-gray-300")}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSendMessage(newMessage);
              }}
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </footer>
      )}
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
