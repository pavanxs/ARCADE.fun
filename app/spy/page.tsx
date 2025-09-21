'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Play, Clock, Eye, Search, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SpyRoom {
  id: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  isActive: boolean
  gameMode: 'classic' | 'blitz' | 'hardcore'
  spyCount: number
  timeLimit: number
  createdAt: Date
  gameStarted: boolean
}

interface Player {
  id: string
  username: string
  gamesWon: number
  spyWins: number
  civilianWins: number
  isHost: boolean
  isReady: boolean
  avatar: string
}

const sampleRooms: SpyRoom[] = [
  {
    id: '1',
    name: 'Secret Agent Training',
    host: 'SpyMaster',
    players: [
      { id: '1', username: 'SpyMaster', gamesWon: 25, spyWins: 12, civilianWins: 13, isHost: true, isReady: true, avatar: 'S' },
      { id: '2', username: 'Agent007', gamesWon: 18, spyWins: 8, civilianWins: 10, isHost: false, isReady: false, avatar: 'A' },
      { id: '3', username: 'Detective', gamesWon: 22, spyWins: 9, civilianWins: 13, isHost: false, isReady: true, avatar: 'D' },
      { id: '4', username: 'Infiltrator', gamesWon: 16, spyWins: 11, civilianWins: 5, isHost: false, isReady: false, avatar: 'I' }
    ],
    maxPlayers: 8,
    isActive: true,
    gameMode: 'classic',
    spyCount: 2,
    timeLimit: 480,
    createdAt: new Date(Date.now() - 300000),
    gameStarted: false
  },
  {
    id: '2',
    name: 'Quick Spy Hunt',
    host: 'FastSpy',
    players: [
      { id: '5', username: 'FastSpy', gamesWon: 12, spyWins: 7, civilianWins: 5, isHost: true, isReady: true, avatar: 'F' },
      { id: '6', username: 'QuickEye', gamesWon: 9, spyWins: 3, civilianWins: 6, isHost: false, isReady: true, avatar: 'Q' },
      { id: '7', username: 'SharpMind', gamesWon: 14, spyWins: 6, civilianWins: 8, isHost: false, isReady: true, avatar: 'S' }
    ],
    maxPlayers: 6,
    isActive: true,
    gameMode: 'blitz',
    spyCount: 1,
    timeLimit: 240,
    createdAt: new Date(Date.now() - 600000),
    gameStarted: true
  }
]

export default function SpyLobby() {
  const [rooms, setRooms] = useState<SpyRoom[]>(sampleRooms)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [currentUser] = useState(`Agent${Math.floor(Math.random() * 1000)}`)
  const router = useRouter()

  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomMode, setNewRoomMode] = useState<'classic' | 'blitz' | 'hardcore'>('classic')
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(6)

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.host.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMode = filterMode === 'all' || room.gameMode === filterMode
    return matchesSearch && matchesMode && room.isActive
  })

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'classic': return 'bg-blue-500'
      case 'blitz': return 'bg-red-500'
      case 'hardcore': return 'bg-black'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (room: SpyRoom) => {
    if (room.gameStarted) return 'bg-orange-500'
    if (room.players.length >= room.maxPlayers) return 'bg-gray-500'
    return 'bg-green-500'
  }

  const getStatusText = (room: SpyRoom) => {
    if (room.gameStarted) return 'In Progress'
    if (room.players.length >= room.maxPlayers) return 'Full'
    return 'Waiting'
  }

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return

    const spyCount = newRoomMaxPlayers <= 4 ? 1 : newRoomMaxPlayers <= 6 ? 2 : 3
    const timeLimit = newRoomMode === 'blitz' ? 240 : newRoomMode === 'hardcore' ? 360 : 480

    const newRoom: SpyRoom = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
      host: currentUser,
      players: [
        { 
          id: Date.now().toString(), 
          username: currentUser, 
          gamesWon: 0,
          spyWins: 0,
          civilianWins: 0,
          isHost: true, 
          isReady: true, 
          avatar: currentUser[0].toUpperCase()
        }
      ],
      maxPlayers: newRoomMaxPlayers,
      isActive: true,
      gameMode: newRoomMode,
      spyCount,
      timeLimit,
      createdAt: new Date(),
      gameStarted: false
    }

    setRooms(prev => [newRoom, ...prev])
    setShowCreateRoom(false)
    setNewRoomName('')
    setNewRoomMode('classic')
    setNewRoomMaxPlayers(6)
    router.push(`/spy/room/${newRoom.id}`)
  }

  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (!room || room.players.length >= room.maxPlayers || room.gameStarted) {
      alert(room?.gameStarted ? 'Game is already in progress!' : 'Room is full!')
      return
    }

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          players: [
            ...r.players,
            {
              id: Date.now().toString(),
              username: currentUser,
              gamesWon: 0,
              spyWins: 0,
              civilianWins: 0,
              isHost: false,
              isReady: false,
              avatar: currentUser[0].toUpperCase()
            }
          ]
        }
      }
      return r
    })

    setRooms(updatedRooms)
    router.push(`/spy/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">🕵️ Find the Spy Lobby</h1>
            <p className="text-muted-foreground">Blend in, investigate, and discover the infiltrators!</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{currentUser}</span>
            </div>
            
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Spy Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="Enter room name"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Game Mode</Label>
                    <Select value={newRoomMode} onValueChange={(value: 'classic' | 'blitz' | 'hardcore') => setNewRoomMode(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic (8min rounds)</SelectItem>
                        <SelectItem value="blitz">Blitz (4min rounds)</SelectItem>
                        <SelectItem value="hardcore">Hardcore (6min, no hints)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Max Players</Label>
                    <Select value={newRoomMaxPlayers.toString()} onValueChange={(value) => setNewRoomMaxPlayers(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 Players (1 spy)</SelectItem>
                        <SelectItem value="6">6 Players (2 spies)</SelectItem>
                        <SelectItem value="8">8 Players (3 spies)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={handleCreateRoom} className="w-full" disabled={!newRoomName.trim()}>
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filterMode} onValueChange={setFilterMode}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="blitz">Blitz</SelectItem>
              <SelectItem value="hardcore">Hardcore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rooms</p>
                  <p className="text-2xl font-bold">{rooms.filter(r => r.isActive).length}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{rooms.reduce((acc, room) => acc + room.players.length, 0)}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Games Playing</p>
                  <p className="text-2xl font-bold">{rooms.filter(r => r.gameStarted).length}</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Waiting Rooms</p>
                  <p className="text-2xl font-bold">{rooms.filter(r => !r.gameStarted && r.isActive).length}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {filteredRooms.map(room => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{room.name}</h3>
                      <Badge className={`${getStatusColor(room)} text-white`}>
                        {getStatusText(room)}
                      </Badge>
                      <Badge className={`${getModeColor(room.gameMode)} text-white`}>
                        {room.gameMode}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>🕵️ {room.spyCount} spies</span>
                      <span>⏱️ {Math.floor(room.timeLimit/60)}min rounds</span>
                      <span>👑 {room.host}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{room.players.length}/{room.maxPlayers} players</span>
                      <div className="flex -space-x-2 ml-2">
                        {room.players.slice(0, 4).map(player => (
                          <Avatar key={player.id} className="w-6 h-6 border-2 border-background">
                            <AvatarFallback className="text-xs">{player.avatar}</AvatarFallback>
                          </Avatar>
                        ))}
                        {room.players.length > 4 && (
                          <div className="w-6 h-6 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                            <span className="text-xs">+{room.players.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {room.gameStarted ? (
                      <Button variant="secondary" disabled>
                        <Play className="w-4 h-4 mr-2" />
                        In Progress
                      </Button>
                    ) : room.players.length >= room.maxPlayers ? (
                      <Button variant="secondary" disabled>
                        Room Full
                      </Button>
                    ) : (
                      <Button onClick={() => handleJoinRoom(room.id)}>
                        <Users className="w-4 h-4 mr-2" />
                        Join Room
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

