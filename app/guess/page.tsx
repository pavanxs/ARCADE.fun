'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Play, Clock, HelpCircle, Search, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface GuessRoom {
  id: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  isActive: boolean
  category: string
  rounds: number
  timePerRound: number
  createdAt: Date
  gameStarted: boolean
}

interface Player {
  id: string
  username: string
  correctGuesses: number
  totalScore: number
  isHost: boolean
  isReady: boolean
  avatar: string
}

const CATEGORIES = ['Movies', 'Animals', 'Food', 'Countries', 'Objects', 'Famous People', 'Mixed']

const sampleRooms: GuessRoom[] = [
  {
    id: '1',
    name: 'Movie Guessing Game',
    host: 'FilmBuff',
    players: [
      { id: '1', username: 'FilmBuff', correctGuesses: 12, totalScore: 240, isHost: true, isReady: true, avatar: 'F' },
      { id: '2', username: 'MovieMaster', correctGuesses: 8, totalScore: 180, isHost: false, isReady: false, avatar: 'M' },
      { id: '3', username: 'CinemaFan', correctGuesses: 6, totalScore: 150, isHost: false, isReady: true, avatar: 'C' }
    ],
    maxPlayers: 6,
    isActive: true,
    category: 'Movies',
    rounds: 10,
    timePerRound: 60,
    createdAt: new Date(Date.now() - 300000),
    gameStarted: false
  },
  {
    id: '2',
    name: 'Quick Animal Quiz',
    host: 'ZooKeeper',
    players: [
      { id: '4', username: 'ZooKeeper', correctGuesses: 15, totalScore: 320, isHost: true, isReady: true, avatar: 'Z' },
      { id: '5', username: 'AnimalLover', correctGuesses: 11, totalScore: 275, isHost: false, isReady: true, avatar: 'A' }
    ],
    maxPlayers: 4,
    isActive: true,
    category: 'Animals',
    rounds: 8,
    timePerRound: 45,
    createdAt: new Date(Date.now() - 600000),
    gameStarted: true
  }
]

export default function GuessLobby() {
  const [rooms, setRooms] = useState<GuessRoom[]>(sampleRooms)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [currentUser] = useState(`Guesser${Math.floor(Math.random() * 1000)}`)
  const router = useRouter()

  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomCategory, setNewRoomCategory] = useState('Mixed')
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(6)
  const [newRoomRounds, setNewRoomRounds] = useState(10)
  const [newRoomTimePerRound, setNewRoomTimePerRound] = useState(60)

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.host.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || room.category === filterCategory
    return matchesSearch && matchesCategory && room.isActive
  })

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Movies': 'bg-purple-500',
      'Animals': 'bg-green-500',
      'Food': 'bg-orange-500',
      'Countries': 'bg-blue-500',
      'Objects': 'bg-gray-500',
      'Famous People': 'bg-pink-500',
      'Mixed': 'bg-indigo-500'
    }
    return colors[category] || 'bg-gray-500'
  }

  const getStatusColor = (room: GuessRoom) => {
    if (room.gameStarted) return 'bg-blue-500'
    if (room.players.length >= room.maxPlayers) return 'bg-gray-500'
    return 'bg-green-500'
  }

  const getStatusText = (room: GuessRoom) => {
    if (room.gameStarted) return 'In Progress'
    if (room.players.length >= room.maxPlayers) return 'Full'
    return 'Waiting'
  }

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return

    const newRoom: GuessRoom = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
      host: currentUser,
      players: [
        { 
          id: Date.now().toString(), 
          username: currentUser, 
          correctGuesses: 0,
          totalScore: 0,
          isHost: true, 
          isReady: true, 
          avatar: currentUser[0].toUpperCase()
        }
      ],
      maxPlayers: newRoomMaxPlayers,
      isActive: true,
      category: newRoomCategory,
      rounds: newRoomRounds,
      timePerRound: newRoomTimePerRound,
      createdAt: new Date(),
      gameStarted: false
    }

    setRooms(prev => [newRoom, ...prev])
    setShowCreateRoom(false)
    setNewRoomName('')
    setNewRoomCategory('Mixed')
    setNewRoomMaxPlayers(6)
    setNewRoomRounds(10)
    setNewRoomTimePerRound(60)
    router.push(`/guess/room/${newRoom.id}`)
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
              correctGuesses: 0,
              totalScore: 0,
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
    router.push(`/guess/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">🤔 Guess the Thing Lobby</h1>
            <p className="text-muted-foreground">Test your knowledge and guessing skills!</p>
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
                  <DialogTitle>Create Guess Room</DialogTitle>
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
                    <Label>Category</Label>
                    <Select value={newRoomCategory} onValueChange={setNewRoomCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Players</Label>
                      <Select value={newRoomMaxPlayers.toString()} onValueChange={(value) => setNewRoomMaxPlayers(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 Players</SelectItem>
                          <SelectItem value="6">6 Players</SelectItem>
                          <SelectItem value="8">8 Players</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Rounds</Label>
                      <Select value={newRoomRounds.toString()} onValueChange={(value) => setNewRoomRounds(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Rounds</SelectItem>
                          <SelectItem value="10">10 Rounds</SelectItem>
                          <SelectItem value="15">15 Rounds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Time per Round</Label>
                    <Select value={newRoomTimePerRound.toString()} onValueChange={(value) => setNewRoomTimePerRound(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="45">45 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="90">90 seconds</SelectItem>
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
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
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
                <HelpCircle className="w-8 h-8 text-green-500" />
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
                <Lightbulb className="w-8 h-8 text-yellow-500" />
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
                      <Badge className={`${getCategoryColor(room.category)} text-white`}>
                        {room.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>🎯 {room.rounds} rounds</span>
                      <span>⏱️ {room.timePerRound}s per round</span>
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

