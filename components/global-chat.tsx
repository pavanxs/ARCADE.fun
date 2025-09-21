'use client'

import { useEffect, useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAccount } from 'wagmi'

interface Message {
  id: string
  content: string
  sender: string
  timestamp: Date
  roomId: string
}

// Color palette for usernames (hex colors)
const USER_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#dc2626', // red-600
  '#ca8a04', // yellow-600
  '#db2777', // pink-600
  '#4f46e5', // indigo-600
  '#0d9488', // teal-600
  '#ea580c', // orange-600
  '#0891b2'  // cyan-600
]

// Function to get consistent color for a username
const getUserColor = (username: string) => {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % USER_COLORS.length
  return USER_COLORS[colorIndex]
}

export default function GlobalChat() {
  const { address, isConnected: walletConnected } = useAccount()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMuted, setIsMuted] = useState(false)

  const GLOBAL_ROOM_ID = 'global-chat'

  // Helper function to normalize usernames for comparison
  const normalizeUsername = (username: string) => {
    return username.toLowerCase().trim()
  }

  useEffect(() => {
    // Only use wallet address as username, don't allow guest users
    if (address) {
      console.log('Setting username to wallet address:', address)
      setUsername(address)
    } else {
      setUsername('')
    }
  }, [address])

  useEffect(() => {
    if (!username || !address) return

    // Initialize WebSocket connection
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8080/ws?room=${GLOBAL_ROOM_ID}&username=${address}`)

      ws.onopen = () => {
        console.log('Connected to global chat with address:', address)
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'message') {
            // Add all messages including own messages from server
            const message: Message = {
              id: data.id,
              content: data.content,
              sender: data.sender,
              timestamp: new Date(data.timestamp),
              roomId: data.roomId
            }
            setMessages(prev => [...prev, message])
          } else if (data.type === 'userCount') {
            setUserCount(data.count)
          } else if (data.type === 'history') {
            // Load ALL messages from history including own messages
            console.log('Loading history for address:', address)
            setMessages(data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })))
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      ws.onclose = () => {
        console.log('Disconnected from global chat')
        setIsConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current = ws
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [address, username])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current && !isMuted) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isMuted])

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || !isConnected || !address) return

    const message = {
      type: 'message',
      content: newMessage.trim(),
      sender: address, // Use wallet address directly
      roomId: GLOBAL_ROOM_ID,
      timestamp: new Date().toISOString()
    }

    // Send message to server (don't add immediately - let server handle it)
    wsRef.current.send(JSON.stringify(message))
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getUserInitials = (username: string) => {
    if (username.startsWith('0x')) {
      return username.slice(2, 4).toUpperCase()
    }
    return username.slice(0, 2).toUpperCase()
  }

  const getDisplayName = (username: string) => {
    if (username.startsWith('0x')) {
      return `${username.slice(0, 6)}...${username.slice(-4)}`
    }
    return username
  }

  const getRandomBadge = () => {
    const badges = ['VIP', 'PRO', 'NEW', 'HOT']
    const colors = ['yellow', 'purple', 'green', 'red']
    const randomBadge = badges[Math.floor(Math.random() * badges.length)]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    return { badge: randomBadge, color: randomColor }
  }

  return (
    <div className="w-80 bg-card/50 backdrop-blur-sm border-l border-border/50 flex flex-col shadow-2xl h-full shrink-0">
      {/* Chat Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-card-foreground text-lg">💬 Global Chat</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Badge variant="secondary">
                {userCount} users online
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === address ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender !== address && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {getUserInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.sender === address
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium"
                      style={{ color: message.sender === address ? 'inherit' : getUserColor(message.sender) }}
                    >
                      {message.sender === address ? 'You' : getDisplayName(message.sender)}
                    </span>
                    <span className="text-xs opacity-50">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.sender === address && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {getUserInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Chat Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2 w-full">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={!address ? "Connect wallet to chat..." : "Type your message..."}
            disabled={!isConnected || !address}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected || !address}
          >
            Send
          </Button>
        </div>
        {!isConnected && (
          <p className="text-sm text-muted-foreground mt-2 w-full">
            Connecting to chat server...
          </p>
        )}
        {!address && (
          <p className="text-sm text-muted-foreground mt-2 w-full">
            Connect your wallet to join the chat
          </p>
        )}
      </div>
    </div>
  )
}
