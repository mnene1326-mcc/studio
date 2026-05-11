"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, orderBy, limit, updateDoc } from "firebase/firestore"
import { useAuth, useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { BottomNav } from "@/components/layout/BottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, ChevronLeft, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

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

  return (
    <div 
      className="flex items-center gap-4 p-4 hover:bg-white/50 cursor-pointer transition-colors border-b last:border-0"
      onClick={() => router.push(`/chats?startWith=${partnerId}`)}
    >
      <Avatar className="w-12 h-12">
        <AvatarImage src={partner.photoURL} />
        <AvatarFallback>{partner.name?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className="font-headline text-primary truncate">{partner.name}</h4>
          {chat.lastMessageAt && chat.lastMessageAt.toDate && (
            <span className="text-[10px] text-muted-foreground">
              {format(chat.lastMessageAt.toDate(), "MMM d")}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate font-body">
          {chat.lastMessage || "Start a conversation..."}
        </p>
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

  // List View Query - Simplified to avoid composite index requirements for now
  const chatListQuery = useMemoFirebase(() => {
    if (!currentUser?.uid) return null
    return query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid)
    )
  }, [db, currentUser?.uid])

  const { data: userChatsRaw, loading: listLoading } = useCollection<Chat>(chatListQuery)

  // Sort chats locally since we removed orderBy to rule out permission issues
  const userChats = useMemo(() => {
    return [...userChatsRaw].sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis?.() || 0
      const timeB = b.lastMessageAt?.toMillis?.() || 0
      return timeB - timeA
    })
  }, [userChatsRaw])

  // Active Chat Partner details
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
        const chatsQ = query(
          chatsRef,
          where("participants", "array-contains", currentUser.uid)
        )
        const chatsSnap = await getDocs(chatsQ)
        let existingChatId = null
        
        chatsSnap.forEach((doc) => {
          const data = doc.data()
          if (data.participants && data.participants.includes(startWithId)) {
            existingChatId = doc.id
          }
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
      } catch (err: any) {
        if (!isMounted) return
        const permissionError = new FirestorePermissionError({
          path: 'chats',
          operation: 'list',
        } satisfies SecurityRuleContext)
        errorEmitter.emit('permission-error', permissionError)
      }
    }
    
    findOrCreateChat()
    return () => { isMounted = false }
  }, [currentUser?.uid, startWithId, db])

  const messagesQuery = useMemoFirebase(() => {
    if (!chatId) return null
    return query(
      collection(db, "chats", chatId, "messages"), 
      orderBy("timestamp", "asc"), 
      limit(50)
    )
  }, [db, chatId])

  const { data: messages } = useCollection<Message>(messagesQuery)

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !chatId || !currentUser?.uid) return
    const msgData = {
      text: text.trim(),
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    }
    
    const messagesRef = collection(db, "chats", chatId, "messages")
    addDoc(messagesRef, msgData)
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: messagesRef.path,
          operation: 'create',
          requestResourceData: msgData,
        } satisfies SecurityRuleContext)
        errorEmitter.emit('permission-error', permissionError)
      })

    const chatRef = doc(db, "chats", chatId)
    const updateData = {
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp()
    }
    updateDoc(chatRef, updateData)
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: chatRef.path,
          operation: 'update',
          requestResourceData: updateData,
        } satisfies SecurityRuleContext)
        errorEmitter.emit('permission-error', permissionError)
      })
    
    setNewMessage("")
  }

  if (!currentUser) return null

  // LIST VIEW
  if (!startWithId) {
    return (
      <div className="flex-1 flex flex-col bg-background min-h-screen pb-20">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-headline text-primary">Messages</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="w-5 h-5" />
          </Button>
        </header>

        <main className="flex-1">
          {listLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : userChats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-10 space-y-4 opacity-50">
              <MessageSquare className="w-16 h-16 text-muted-foreground" />
              <p className="font-body text-sm">You don't have any conversations yet. Discover matches to start chatting!</p>
              <Button onClick={() => router.push("/home")} variant="outline" className="rounded-full">Find Matches</Button>
            </div>
          ) : (
            <div className="bg-white/30 backdrop-blur-sm">
              {userChats.map(chat => (
                <ChatListItem key={chat.id} chat={chat} currentUserUid={currentUser.uid} />
              ))}
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    )
  }

  // CONVERSATION VIEW
  if (!chatPartner) return <div className="p-10 text-center animate-pulse font-headline text-primary">Loading conversation...</div>

  return (
    <div className="flex-1 flex flex-col h-screen bg-background relative overflow-hidden">
      <header className="bg-white border-b p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/chats")} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={chatPartner.photoURL} />
          <AvatarFallback>{chatPartner.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-headline text-primary leading-tight">{chatPartner.name}</h3>
          <p className="text-[10px] text-muted-foreground">Active now</p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm font-body shadow-sm ${
                  msg.senderId === currentUser.uid 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white text-foreground rounded-bl-none'
                }`}
              >
                {msg.text}
                <div className="text-[8px] mt-1 opacity-70 text-right">
                  {msg.timestamp && msg.timestamp.toDate ? format(msg.timestamp.toDate(), "HH:mm") : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 bg-white border-t flex items-center gap-2">
        <Input 
          placeholder="Type a message..." 
          className="rounded-full border-muted-foreground/20 font-body" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
        />
        <Button 
          size="icon" 
          className="rounded-full shrink-0" 
          disabled={!newMessage.trim()}
          onClick={() => handleSendMessage(newMessage)}
        >
          <Send className="w-5 h-5" />
        </Button>
      </footer>
    </div>
  )
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-headline text-primary">Loading chats...</div>}>
      <ChatsContent />
    </Suspense>
  )
}
