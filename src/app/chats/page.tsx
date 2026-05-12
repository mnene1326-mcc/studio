"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, orderBy, limit, updateDoc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { BottomNav } from "@/components/layout/BottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, ChevronLeft, ShoppingBag, User as UserIcon, ListFilter, Gamepad2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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
  unreadCount?: number
}

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  interests?: string
  lookingFor?: string
}

function ChatListItem({ chat, currentUserUid }: { chat: Chat, currentUserUid: string }) {
  const router = useRouter()
  const db = useFirestore()
  const partnerId = chat.participants.find(id => id !== currentUserUid)
  
  const partnerRef = useMemoFirebase(() => partnerId ? doc(db, "users", partnerId) : null, [db, partnerId])
  const { data: partner } = useDoc<UserProfile>(partnerRef)

  if (!partner) return null

  const randomStatus = ["🔥 0.2°C", "💧 9.57°C", "🌸 116.4°C"][Math.floor(Math.random() * 3)]

  return (
    <div 
      className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-all active:scale-[0.98]"
      onClick={() => router.push(`/chats?startWith=${partnerId}`)}
    >
      <div className="relative">
        <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
          <AvatarImage src={partner.photoURL || `https://picsum.photos/seed/${partner.uid}/200/200`} />
          <AvatarFallback className="bg-[#FF3B30] text-white font-black">{partner.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
      </div>
      
      <div className="flex-1 min-w-0 py-1">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <h4 className="font-black text-lg text-black truncate">{partner.name}</h4>
            <span className="text-[10px] text-gray-400 font-bold shrink-0">{randomStatus}</span>
          </div>
          <span className="text-[11px] text-gray-400 font-bold">
            {chat.lastMessageAt && chat.lastMessageAt.toDate ? format(chat.lastMessageAt.toDate(), "MM-dd HH:mm") : "Just now"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 truncate font-bold flex-1 pr-4">
            {chat.lastMessage || "hi love..."}
          </p>
          <div className="bg-[#FF3B30] rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
            <span className="text-[10px] text-white font-black">1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const startWithId = searchParams.get("startWith")
  
  const { user: currentUser } = useUser()
  const db = useFirestore()

  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")

  const chatListQuery = useMemoFirebase(() => {
    if (!currentUser?.uid) return null
    return query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid)
    )
  }, [db, currentUser?.uid])

  const { data: userChatsRaw, loading: listLoading } = useCollection<Chat>(chatListQuery)

  const userChats = useMemo(() => {
    return [...userChatsRaw].sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis?.() || 0
      const timeB = b.lastMessageAt?.toMillis?.() || 0
      return timeB - timeA
    })
  }, [userChatsRaw])

  const partnerRef = useMemoFirebase(() => startWithId ? doc(db, "users", startWithId) : null, [db, startWithId])
  const { data: chatPartner } = useDoc<UserProfile>(partnerRef)

  useEffect(() => {
    if (!currentUser?.uid || !startWithId) {
      setChatId(null)
      return
    }

    let isMounted = true
    const findOrCreateChat = async () => {
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
          }
          const newChatDoc = await addDoc(chatsRef, chatData)
          if (isMounted) setChatId(newChatDoc.id)
        }
      } catch (err) {
        if (!isMounted) return
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'chats', operation: 'list' }))
      }
    }
    findOrCreateChat()
    return () => { isMounted = false }
  }, [currentUser?.uid, startWithId, db])

  const messagesQuery = useMemoFirebase(() => {
    if (!chatId) return null
    return query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"), limit(50))
  }, [db, chatId])

  const { data: messages } = useCollection<Message>(messagesQuery)

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !chatId || !currentUser?.uid) return
    const msgData = { text: text.trim(), senderId: currentUser.uid, timestamp: serverTimestamp() }
    addDoc(collection(db, "chats", chatId, "messages"), msgData)
    updateDoc(doc(db, "chats", chatId), { lastMessage: text.trim(), lastMessageAt: serverTimestamp() })
    setNewMessage("")
  }

  if (!currentUser) return null

  if (!startWithId) {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-screen pb-24">
        <header className="sticky top-0 z-40 bg-[#FF3B30]/10 backdrop-blur-md px-6 pt-10 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <h1 className="text-3xl font-black text-[#FF3B30]">Chat</h1>
              <div className="absolute -bottom-1 left-0 w-8 h-1.5 bg-[#FF3B30] rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                <ShoppingBag className="w-6 h-6" />
             </Button>
             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                <UserIcon className="w-6 h-6" />
             </Button>
          </div>
        </header>

        <main className="flex-1 divide-y divide-gray-50">
          {listLoading ? (
             <div className="p-6 space-y-4">
               {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="flex gap-4 items-center">
                   <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                   <div className="flex-1 space-y-2">
                     <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
                     <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                   </div>
                 </div>
               ))}
             </div>
          ) : userChats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-24 px-10 space-y-6 opacity-40 italic">
              <MessageSquare className="w-20 h-20 text-muted-foreground" />
              <p className="font-black text-xl">No active chats...</p>
              <Button onClick={() => router.push("/home")} variant="outline" className="rounded-full border-[#FF3B30] text-[#FF3B30] font-black">Find Someone</Button>
            </div>
          ) : (
            <div className="bg-white">
              {userChats.map(chat => (
                <ChatListItem key={chat.id} chat={chat} currentUserUid={currentUser.uid} />
              ))}
            </div>
          )}
        </main>

        <div className="fixed bottom-28 right-6 z-50">
          <div className="relative group cursor-pointer active:scale-95 transition-transform">
            <div className="bg-[#FF3B30] p-4 rounded-full shadow-2xl flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-lg border-2 border-white shadow-sm">
              Game
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    )
  }

  if (!chatPartner) return <div className="p-20 text-center animate-pulse font-black text-2xl text-[#FF3B30]">Searching...</div>

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 relative overflow-hidden">
      <header className="bg-white border-b p-4 flex items-center gap-3 shadow-sm pt-10">
        <Button variant="ghost" size="icon" onClick={() => router.push("/chats")} className="rounded-full">
          <ChevronLeft className="w-7 h-7" />
        </Button>
        <Avatar className="w-12 h-12 border-2 border-[#FF3B30]">
          <AvatarImage src={chatPartner.photoURL} />
          <AvatarFallback className="font-black">{chatPartner.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-black text-lg leading-tight">{chatPartner.name}</h3>
          <p className="text-[10px] text-green-500 font-bold">● Online</p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 bg-white/50">
        <div className="space-y-4 pb-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                "max-w-[80%] p-4 rounded-[2rem] text-sm font-black shadow-sm",
                msg.senderId === currentUser.uid 
                  ? 'bg-[#FF3B30] text-white rounded-br-none' 
                  : 'bg-white text-black border border-gray-100 rounded-bl-none'
              )}>
                {msg.text}
                <div className="text-[9px] mt-1.5 opacity-60 text-right italic font-bold">
                  {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), "HH:mm") : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 bg-white border-t flex items-center gap-3">
        <Input 
          placeholder="Say something nice..." 
          className="rounded-full bg-gray-50 border-none h-12 font-black text-sm px-6" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
        />
        <Button 
          size="icon" 
          className="rounded-full w-12 h-12 bg-[#FF3B30] hover:bg-red-600 text-white shrink-0" 
          disabled={!newMessage.trim()}
          onClick={() => handleSendMessage(newMessage)}
        >
          <Send className="w-6 h-6" />
        </Button>
      </footer>
    </div>
  )
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black text-2xl text-[#FF3B30]">Loading Chats...</div>}>
      <ChatsContent />
    </Suspense>
  )
}