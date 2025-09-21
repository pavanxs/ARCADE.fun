'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export interface Player {
  id: string
  username: string
  avatar: string
  isHost: boolean
  isReady: boolean
  socketId: string
  score?: number
  [key: string]: any
}

export interface Room {
  id: string
  name: string
  gameType: string
  host: string
  players: Player[]
  maxPlayers: number
  gameStarted: boolean
  gameState: any
  settings: any
  createdAt: Date
}

export interface RoomListItem {
  id: string
  name: string
  gameType: string
  host: string
  playerCount: number
  maxPlayers: number
  gameStarted: boolean
  createdAt: Date
}

export interface ChatMessage {
  id: string
  username: string
  message: string
  timestamp: Date
  type: 'user' | 'system'
}

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  rooms: RoomListItem[]
  currentRoom: Room | null
  chatMessages: ChatMessage[]
  error: string | null
  createRoom: (data: {
    roomName: string
    gameType: string
    username: string
    maxPlayers: number
    settings: any
  }) => void
  joinRoom: (roomId: string, username: string) => void
  leaveRoom: () => void
  toggleReady: () => void
  startGame: () => void
  sendGameAction: (action: any) => void
  sendChatMessage: (message: string) => void
}

export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
    socketRef.current = newSocket
    setSocket(newSocket)

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
      setError(null)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err)
      setError('Failed to connect to server')
      setIsConnected(false)
    })

    // Room events
    newSocket.on('rooms-list', (roomsList: RoomListItem[]) => {
      setRooms(roomsList)
    })

    newSocket.on('room-created', (data: { roomId: string; room: Room }) => {
      setCurrentRoom(data.room)
      setChatMessages([{
        id: `welcome_${Date.now()}`,
        username: 'System',
        message: `Welcome to ${data.room.name}! You are the host.`,
        timestamp: new Date(),
        type: 'system'
      }])
    })

    newSocket.on('room-state', (room: Room) => {
      setCurrentRoom(room)
    })

    newSocket.on('player-joined', (data: { player: Player; room: Room }) => {
      setCurrentRoom(data.room)
      setChatMessages(prev => [...prev, {
        id: `join_${Date.now()}`,
        username: 'System',
        message: `${data.player.username} joined the room`,
        timestamp: new Date(),
        type: 'system'
      }])
    })

    newSocket.on('player-left', (data: { player: Player; room: Room }) => {
      setCurrentRoom(data.room)
      setChatMessages(prev => [...prev, {
        id: `leave_${Date.now()}`,
        username: 'System',
        message: `${data.player.username} left the room`,
        timestamp: new Date(),
        type: 'system'
      }])
    })

    newSocket.on('player-ready-changed', (data: { player: Player; room: Room }) => {
      setCurrentRoom(data.room)
      setChatMessages(prev => [...prev, {
        id: `ready_${Date.now()}`,
        username: 'System',
        message: `${data.player.username} is ${data.player.isReady ? 'ready' : 'not ready'}`,
        timestamp: new Date(),
        type: 'system'
      }])
    })

    // Game events
    newSocket.on('game-started', (data: { room: Room }) => {
      setCurrentRoom(data.room)
      setChatMessages(prev => [...prev, {
        id: `start_${Date.now()}`,
        username: 'System',
        message: 'Game started! Good luck everyone!',
        timestamp: new Date(),
        type: 'system'
      }])
    })

    newSocket.on('game-state-updated', (data: { room: Room; action: any }) => {
      setCurrentRoom(data.room)
    })

    // Game-specific events
    newSocket.on('answer-correct', (data: { player: string; answer: string; points: number }) => {
      setChatMessages(prev => [...prev, {
        id: `correct_${Date.now()}`,
        username: 'System',
        message: `🎉 ${data.player} got it right! "${data.answer}" is correct! (+${data.points} points)`,
        timestamp: new Date(),
        type: 'system'
      }])
    })

    newSocket.on('answer-incorrect', (data: { player: string; answer: string }) => {
      setChatMessages(prev => [...prev, {
        id: `incorrect_${Date.now()}`,
        username: 'System',
        message: `❌ "${data.answer}" is incorrect. Keep trying!`,
        timestamp: new Date(),
        type: 'system'
      }])
    })

    newSocket.on('word-found', (data: { player: string; word: string; points: number }) => {
      setChatMessages(prev => [...prev, {
        id: `word_${Date.now()}`,
        username: 'System',
        message: `🎯 ${data.player} found "${data.word}"! (+${data.points} points)`,
        timestamp: new Date(),
        type: 'system'
      }])
    })

    newSocket.on('guess-correct', (data: { player: string; guess: string; points: number }) => {
      setChatMessages(prev => [...prev, {
        id: `guess_${Date.now()}`,
        username: 'System',
        message: `🎉 ${data.player} guessed correctly: "${data.guess}"! (+${data.points} points)`,
        timestamp: new Date(),
        type: 'system'
      }])
    })

    // Chat events
    newSocket.on('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message])
    })

    // Error events
    newSocket.on('error', (data: { message: string }) => {
      setError(data.message)
      setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
    })

    // Cleanup on unmount
    return () => {
      newSocket.close()
    }
  }, [])

  const createRoom = (data: {
    roomName: string
    gameType: string
    username: string
    maxPlayers: number
    settings: any
  }) => {
    if (socket && isConnected) {
      socket.emit('create-room', data)
    }
  }

  const joinRoom = (roomId: string, username: string) => {
    if (socket && isConnected) {
      socket.emit('join-room', { roomId, username })
    }
  }

  const leaveRoom = () => {
    if (socket && isConnected) {
      socket.emit('leave-room')
      setCurrentRoom(null)
      setChatMessages([])
    }
  }

  const toggleReady = () => {
    if (socket && isConnected) {
      socket.emit('toggle-ready')
    }
  }

  const startGame = () => {
    if (socket && isConnected) {
      socket.emit('start-game')
    }
  }

  const sendGameAction = (action: any) => {
    if (socket && isConnected) {
      socket.emit('game-action', action)
    }
  }

  const sendChatMessage = (message: string) => {
    if (socket && isConnected) {
      socket.emit('chat-message', { message })
    }
  }

  return {
    socket,
    isConnected,
    rooms,
    currentRoom,
    chatMessages,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    sendGameAction,
    sendChatMessage
  }
}

export default useWebSocket

