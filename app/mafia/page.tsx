'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Play, Clock, Eye, Search, Skull } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MafiaRoom {
  id: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  isActive: boolean
  gameMode: 'classic' | 'speed' | 'chaos'
  dayLength: number
  nightLength: number
  createdAt: Date
  gameStarted: boolean
}

interface Player {
  id: string
  username: string
  gamesPlayed: number
  winRate: number
  isHost: boolean
  isReady: boolean
  avatar: string
}

const sampleRooms: MafiaRoom[] = [
  {
    id: '1',
    name: 'Classic Mafia Night',
    host: 'Godfather',
    players: [
      { id: '1', username: 'Godfather', gamesPlayed: 45, winRate: 68, isHost: true, isReady: true, avatar: 'G' },
      { id: '2', username: 'Detective', gamesPlayed: 32, winRate: 72, isHost: false, isReady: false, avatar: 'D' },
      { id: '3', username: 'Citizen', gamesPlayed: 28, winRate: 45, isHost: false, isReady: true, avatar: 'C' },
      { id: '4', username: 'Doctor', gamesPlayed: 35, winRate: 58, isHost: false, isReady: false, avatar: 'D' }
    ],
    maxPlayers: 8,
    isActive: true,
    gameMode: 'classic',
    dayLength: 300,
    nightLength: 120,
    createdAt: new Date(Date.now() - 300000),
    gameStarted: false
  },
  {
    id: '2',
    name: 'Speed Round',
    host: 'QuickDraw',
    players: [
      { id: '5', username: 'QuickDraw', gamesPlayed: 67, winRate: 55, isHost: true, isReady: true, avatar: 'Q' },
      { id: '6', username: 'FastTalk', gamesPlayed: 43, winRate: 62, isHost: false, isReady: true, avatar: 'F' },
      { id: '7', username: 'RapidFire', gamesPlayed: 38, winRate: 48, isHost: false, isReady: true, avatar: 'R' }
    ],
    maxPlayers: 6,
    isActive: true,
    gameMode: 'speed',
    dayLength: 180,
    nightLength: 60,
    createdAt: new Date(Date.now() - 600000),
    gameStarted: true
  }
]

export default function MafiaLobby() {
  const [rooms, setRooms] = useState<MafiaRoom[]>(sampleRooms)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [currentUser] = useState(`Player${Math.floor(Math.random() * 1000)}`)
  const router = useRouter()

  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomMode, setNewRoomMode] = useState<'classic' | 'speed' | 'chaos'>('classic')
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(8)

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.host.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMode = filterMode === 'all' || room.gameMode === filterMode
    return matchesSearch && matchesMode && room.isActive
  })

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'classic': return 'bg-blue-500'
      case 'speed': return 'bg-red-500'
      case 'chaos': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (room: MafiaRoom) => {
    if (room.gameStarted) return 'bg-orange-500'
    if (room.players.length >= room.maxPlayers) return 'bg-gray-500'
    return 'bg-green-500'
  }

  const getStatusText = (room: MafiaRoom) => {
    if (room.gameStarted) return 'In Progress'
    if (room.players.length >= room.maxPlayers) return 'Full'
    return 'Waiting'
  }

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return

    const dayLength = newRoomMode === 'speed' ? 180 : newRoomMode === 'chaos' ? 120 : 300
    const nightLength = newRoomMode === 'speed' ? 60 : newRoomMode === 'chaos' ? 45 : 120

    const newRoom: MafiaRoom = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
      host: currentUser,
      players: [
        { 
          id: Date.now().toString(), 
          username: currentUser, 
          gamesPlayed: 0,
          winRate: 0,
          isHost: true, 
          isReady: true, 
          avatar: currentUser[0].toUpperCase()
        }
      ],
      maxPlayers: newRoomMaxPlayers,
      isActive: true,
      gameMode: newRoomMode,
      dayLength,
      nightLength,
      createdAt: new Date(),
      gameStarted: false
    }

    setRooms(prev => [newRoom, ...prev])
    setShowCreateRoom(false)
    setNewRoomName('')
    setNewRoomMode('classic')
    setNewRoomMaxPlayers(8)
    router.push(`/mafia/room/${newRoom.id}`)
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
              gamesPlayed: 0,
              winRate: 0,
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
    router.push(`/mafia/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">🕵️ Online Mafia Lobby</h1>
            <p className="text-muted-foreground">Deception, strategy, and social deduction await!</p>
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
                  <DialogTitle>Create Mafia Room</DialogTitle>
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
                    <Select value={newRoomMode} onValueChange={(value: 'classic' | 'speed' | 'chaos') => setNewRoomMode(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic (5min day, 2min night)</SelectItem>
                        <SelectItem value="speed">Speed (3min day, 1min night)</SelectItem>
                        <SelectItem value="chaos">Chaos (2min day, 45sec night)</SelectItem>
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
                        <SelectItem value="6">6 Players</SelectItem>
                        <SelectItem value="8">8 Players</SelectItem>
                        <SelectItem value="10">10 Players</SelectItem>
                        <SelectItem value="12">12 Players</SelectItem>
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
              <SelectItem value="speed">Speed</SelectItem>
              <SelectItem value="chaos">Chaos</SelectItem>
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
                <Skull className="w-8 h-8 text-red-500" />
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
          {filteredRooms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No rooms found</p>
                  <p className="text-sm">Try adjusting your filters or create a new room!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredRooms.map(room => (
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
                        <span>🌅 {Math.floor(room.dayLength/60)}m day</span>
                        <span>🌙 {Math.floor(room.nightLength/60)}m night</span>
                        <span>👑 {room.host}</span>
                        <span>⏰ {new Date(room.createdAt).toLocaleTimeString()}</span>
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}

