import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useSession, signIn } from 'next-auth/react'
import axios from 'axios'

const Chat = () => {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && session) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, session])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/chat/messages/', {
        headers: {
          Authorization: `Bearer ${(session as any).access_token}`
        }
      })
      setMessages(response.data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session) return

    setLoading(true)
    try {
      await axios.post('http://localhost:8000/api/chat/messages/', {
        content: newMessage
      }, {
        headers: {
          Authorization: `Bearer ${(session as any).access_token}`
        }
      })
      setNewMessage('')
      fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:opacity-90 transition-all z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <Card className="shadow-2xl border-primary/20">
        <CardHeader className="bg-primary text-white p-4 rounded-t-xl flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Chat with us</CardTitle>
          <button onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-96">
          {!session ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-gray-600 mb-4">Please log in to start a conversation.</p>
              <Button onClick={() => signIn()}>Log In</Button>
            </div>
          ) : (
            <>
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.map((m) => (
                  <div 
                    key={m.id} 
                    className={`flex ${m.sender_name === session.user?.username ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      m.sender_name === session.user?.username 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm">{m.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm mt-10">
                    No messages yet. Send a message to start!
                  </p>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !newMessage.trim()}
                  className="p-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Chat
