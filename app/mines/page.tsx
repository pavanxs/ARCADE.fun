'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Play, Clock, Bomb, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MinesRoom {
  id: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  isActive: boolean
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  gridSize: string
  mineCount: number
  createdAt: Date
  gameStarted: boolean
}

interface Player {
  id: string
  username: string
  score: number
  isHost: boolean
  isReady: boolean
  avatar: string
  gamesWon: number
}

const DIFFICULTY_SETTINGS = {
  easy: { gridSize: '9x9', mineCount: 10 },
  medium: { gridSize: '16x16', mineCount: 40 },
  hard: { gridSize: '16x30', mineCount: 99 },
  expert: { gridSize: '20x24', mineCount: 130 }
}

// Sample rooms for Mines
const sampleRooms: MinesRoom[] = [
  {
    id: '1',
    name: 'Beginner Minefield',
    host: 'MineSweeper',
    players: [
      { id: '1', username: 'MineSweeper', score: 0, isHost: true, isReady: true, avatar: 'M', gamesWon: 15 },
      { id: '2', username: 'BombDefuser', score: 0, isHost: false, isReady: false, avatar: 'B', gamesWon: 8 },
      { id: '3', username: 'SafeStep', score: 0, isHost: false, isReady: true, avatar: 'S', gamesWon: 3 }
    ],
    maxPlayers: 4,
    isActive: true,
    difficulty: 'easy',
    gridSize: '9x9',
    mineCount: 10,
    createdAt: new Date(Date.now() - 300000),
    gameStarted: false
  },
  {
    id: '2',
    name: 'Speed Mining',
    host: 'FastClicker',
    players: [
      { id: '4', username: 'FastClicker', score: 245, isHost: true, isReady: true, avatar: 'F', gamesWon: 12 },
      { id: '5', username: 'QuickSolve', score: 189, isHost: false, isReady: true, avatar: 'Q', gamesWon: 7 }
    ],
    maxPlayers: 6,
    isActive: true,
    difficulty: 'medium',
    gridSize: '16x16',
    mineCount: 40,
    createdAt: new Date(Date.now() - 600000),
    gameStarted: true
  },
  {
    id: '3',
    name: 'Expert Challenge',
    host: 'MinesMaster',
    players: [
      { id: '6', username: 'MinesMaster', score: 0, isHost: true, isReady: true, avatar: 'M', gamesWon: 45 },
      { id: '7', username: 'ProSweeper', score: 0, isHost: false, isReady: false, avatar: 'P', gamesWon: 32 },
      { id: '8', username: 'BombExpert', score: 0, isHost: false, isReady: true, avatar: 'B', gamesWon: 28 },
      { id: '9', username: 'MineHunter', score: 0, isHost: false, isReady: false, avatar: 'M', gamesWon: 19 }
    ],
    maxPlayers: 8,
    isActive: true,
    difficulty: 'expert',
    gridSize: '20x24',
    mineCount: 130,
    createdAt: new Date(Date.now() - 1200000),
    gameStarted: false
  }
]

export default function MinesLobby() {
  const [rooms, setRooms] = useState<MinesRoom[]>(sampleRooms)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [currentUser] = useState(`Miner${Math.floor(Math.random() * 1000)}`)
  const router = useRouter()

  // Create room form state
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDifficulty, setNewRoomDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium')
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4)

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.host.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDifficulty = filterDifficulty === 'all' || room.difficulty === filterDifficulty
    
    return matchesSearch && matchesDifficulty && room.isActive
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-orange-500'
      case 'expert': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (room: MinesRoom) => {
    if (room.gameStarted) return 'bg-blue-500'
    if (room.players.length >= room.maxPlayers) return 'bg-gray-500'
    return 'bg-green-500'
  }

  const getStatusText = (room: MinesRoom) => {
    if (room.gameStarted) return 'In Progress'
    if (room.players.length >= room.maxPlayers) return 'Full'
    return 'Waiting'
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return

    const settings = DIFFICULTY_SETTINGS[newRoomDifficulty]
    const newRoom: MinesRoom = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
      host: currentUser,
      players: [
        { 
          id: Date.now().toString(), 
          username: currentUser, 
          score: 0, 
          isHost: true, 
          isReady: true, 
          avatar: currentUser[0].toUpperCase(),
          gamesWon: 0
        }
      ],
      maxPlayers: newRoomMaxPlayers,
      isActive: true,
      difficulty: newRoomDifficulty,
      gridSize: settings.gridSize,
      mineCount: settings.mineCount,
      createdAt: new Date(),
      gameStarted: false
    }

    setRooms(prev => [newRoom, ...prev])
    setShowCreateRoom(false)
    
    // Reset form
    setNewRoomName('')
    setNewRoomDifficulty('medium')
    setNewRoomMaxPlayers(4)

    // Navigate to the room
    router.push(`/mines/room/${newRoom.id}`)
  }

  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return

    if (room.players.length >= room.maxPlayers) {
      alert('Room is full!')
      return
    }

    if (room.gameStarted) {
      alert('Game is already in progress!')
      return
    }

    // Add player to room
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          players: [
            ...r.players,
            {
              id: Date.now().toString(),
              username: currentUser,
              score: 0,
              isHost: false,
              isReady: false,
              avatar: currentUser[0].toUpperCase(),
              gamesWon: 0
            }
          ]
        }
      }
      return r
    })

    setRooms(updatedRooms)
    router.push(`/mines/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">💣 Mines Lobby</h1>
            <p className="text-muted-foreground">Navigate the minefield and compete with friends!</p>
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
                  <DialogTitle>Create Mines Room</DialogTitle>
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
                    <Label>Difficulty</Label>
                    <Select value={newRoomDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard' | 'expert') => setNewRoomDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (9x9, 10 mines)</SelectItem>
                        <SelectItem value="medium">Medium (16x16, 40 mines)</SelectItem>
                        <SelectItem value="hard">Hard (16x30, 99 mines)</SelectItem>
                        <SelectItem value="expert">Expert (20x24, 130 mines)</SelectItem>
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
                        <SelectItem value="2">2 Players</SelectItem>
                        <SelectItem value="4">4 Players</SelectItem>
                        <SelectItem value="6">6 Players</SelectItem>
                        <SelectItem value="8">8 Players</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleCreateRoom} 
                    className="w-full"
                    disabled={!newRoomName.trim()}
                  >
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
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
          
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Room Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rooms</p>
                  <p className="text-2xl font-bold">{rooms.filter(r => r.isActive).length}</p>
                </div>
                <Play className="w-8 h-8 text-green-500" />
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
                <Bomb className="w-8 h-8 text-red-500" />
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

        {/* Room List */}
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
                        <Badge className={`${getDifficultyColor(room.difficulty)} text-white`}>
                          {room.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>💣 {room.mineCount} mines</span>
                        <span>📏 {room.gridSize}</span>
                        <span>👑 {room.host}</span>
                        <span>⏰ {formatTimeAgo(room.createdAt)}</span>
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

