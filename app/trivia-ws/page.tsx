'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Play, Search, Wifi, WifiOff, AlertCircle, Wallet, Coins, Trophy, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Switch } from '@/components/ui/switch'
import useWebSocket from '@/hooks/useWebSocket'
import useGameContract from '@/hooks/useGameContract'

const ROOM_CATEGORIES = [
  'General Knowledge',
  'Science',
  'Technology',
  'History',
  'Sports',
  'Entertainment',
  'Geography',
  'Literature'
]

export default function TriviaWebSocketLobby() {
  const {
    isConnected: wsConnected,
    rooms,
    currentRoom,
    error: wsError,
    createRoom,
    joinRoom
  } = useWebSocket()

  const {
    isConnected: walletConnected,
    gameCount,
    contractBalance,
    isOwner,
    createGame,
    error: contractError
  } = useGameContract()

  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [currentUser] = useState(`Player${Math.floor(Math.random() * 1000)}`)
  const router = useRouter()

  // Create room form state
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomCategory, setNewRoomCategory] = useState('')
  const [newRoomDifficulty, setNewRoomDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4)
  const [isBlockchainRoom, setIsBlockchainRoom] = useState(false)
  const [entryFee, setEntryFee] = useState('0.001')
  const [gameQuestion, setGameQuestion] = useState('')
  const [gameAnswer, setGameAnswer] = useState('')

  // Filter rooms for trivia game type
  const triviaRooms = rooms.filter(room => room.gameType === 'trivia')
  
  const filteredRooms = triviaRooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.host.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Redirect to room if currently in one
  useEffect(() => {
    if (currentRoom && currentRoom.gameType === 'trivia') {
      router.push(`/trivia-ws/room/${currentRoom.id}`)
    }
  }, [currentRoom, router])


  const getStatusColor = (gameStarted: boolean, playerCount: number, maxPlayers: number) => {
    if (gameStarted) return 'bg-blue-500'
    if (playerCount >= maxPlayers) return 'bg-gray-500'
    return 'bg-green-500'
  }

  const getStatusText = (gameStarted: boolean, playerCount: number, maxPlayers: number) => {
    if (gameStarted) return 'In Progress'
    if (playerCount >= maxPlayers) return 'Full'
    return 'Waiting'
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !newRoomCategory) return

    if (isBlockchainRoom) {
      // Create blockchain game first
      if (!gameQuestion.trim() || !gameAnswer.trim() || !walletConnected) return
      
      try {
        const hash = await createGame(gameQuestion.trim(), gameAnswer.trim(), entryFee)
        if (!hash) return
        
        // Create WebSocket room with blockchain game reference
        const settings = {
          category: newRoomCategory,
          difficulty: newRoomDifficulty,
          questionCount: 1, // Single question for blockchain game
          timePerQuestion: 0, // No time limit for blockchain
          isBlockchainGame: true,
          blockchainGameId: gameCount + 1, // Next game ID
          entryFee,
          question: gameQuestion.trim()
        }

        createRoom({
          roomName: newRoomName.trim(),
          gameType: 'trivia',
          username: currentUser,
          maxPlayers: newRoomMaxPlayers,
          settings
        })
      } catch (error) {
        console.error('Error creating blockchain game:', error)
        return
      }
    } else {
      // Regular WebSocket room
      const settings = {
        category: newRoomCategory,
        difficulty: newRoomDifficulty,
        questionCount: 10,
        timePerQuestion: 30,
        isBlockchainGame: false
      }

      createRoom({
        roomName: newRoomName.trim(),
        gameType: 'trivia',
        username: currentUser,
        maxPlayers: newRoomMaxPlayers,
        settings
      })
    }

    setShowCreateRoom(false)
    
    // Reset form
    setNewRoomName('')
    setNewRoomCategory('')
    setNewRoomDifficulty('easy')
    setNewRoomMaxPlayers(4)
    setIsBlockchainRoom(false)
    setEntryFee('0.001')
    setGameQuestion('')
    setGameAnswer('')
  }

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId, currentUser)
  }

  if (!wsConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Connecting to Server...</h3>
            <p className="text-muted-foreground">Please wait while we establish connection.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Connection Status & Error */}
        <div className="mb-4">
          {(wsError || contractError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{wsError || contractError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {wsConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">WebSocket connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">WebSocket disconnected</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {walletConnected ? (
                <>
                  <Wallet className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600">Wallet connected</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Wallet not connected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">🧠 Hybrid Trivia Lobby</h1>
            <p className="text-muted-foreground">Play WebSocket trivia or blockchain games with real ETH prizes!</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <ConnectButton />
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{currentUser}</span>
            </div>
            
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" disabled={!wsConnected}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Trivia Room</DialogTitle>
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
                  
                  {/* Blockchain Game Toggle */}
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Switch 
                      id="blockchain-mode" 
                      checked={isBlockchainRoom}
                      onCheckedChange={setIsBlockchainRoom}
                      disabled={!walletConnected || !isOwner}
                    />
                    <div className="flex-1">
                      <Label htmlFor="blockchain-mode" className="text-sm font-medium">
                        Blockchain Game Mode
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {!walletConnected ? 'Connect wallet to enable' : 
                         !isOwner ? 'Only contract owner can create blockchain games' :
                         'Create a game with real ETH prizes'}
                      </p>
                    </div>
                    <Coins className="w-4 h-4 text-yellow-500" />
                  </div>
                  
                  {/* Blockchain Game Fields */}
                  {isBlockchainRoom && (
                    <>
                      <div>
                        <Label htmlFor="game-question">Trivia Question</Label>
                        <Input
                          id="game-question"
                          placeholder="Enter your trivia question"
                          value={gameQuestion}
                          onChange={(e) => setGameQuestion(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="game-answer">Correct Answer</Label>
                        <Input
                          id="game-answer"
                          placeholder="Enter the correct answer"
                          value={gameAnswer}
                          onChange={(e) => setGameAnswer(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="entry-fee">Entry Fee (ETH)</Label>
                        <Input
                          id="entry-fee"
                          type="number"
                          step="0.001"
                          placeholder="0.001"
                          value={entryFee}
                          onChange={(e) => setEntryFee(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label>Category</Label>
                    <Select value={newRoomCategory} onValueChange={setNewRoomCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Difficulty</Label>
                      <Select value={newRoomDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewRoomDifficulty(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
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
                  </div>
                  
                  <Button 
                    onClick={handleCreateRoom} 
                    className="w-full"
                    disabled={
                      !newRoomName.trim() || 
                      !newRoomCategory || 
                      !wsConnected ||
                      (isBlockchainRoom && (!gameQuestion.trim() || !gameAnswer.trim() || !walletConnected))
                    }
                  >
                    {isBlockchainRoom ? 'Create Blockchain Game Room' : 'Create WebSocket Room'}
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
        </div>

        {/* Room Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">WebSocket Rooms</p>
                  <p className="text-2xl font-bold">{triviaRooms.length}</p>
                </div>
                <Wifi className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{triviaRooms.reduce((acc, room) => acc + room.playerCount, 0)}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blockchain Games</p>
                  <p className="text-2xl font-bold">{walletConnected ? gameCount : '-'}</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Balance</p>
                  <p className="text-lg font-bold">{walletConnected ? `${parseFloat(contractBalance).toFixed(3)} ETH` : '-'}</p>
                </div>
                <Trophy className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Role</p>
                  <p className="text-sm font-bold">{walletConnected ? (isOwner ? 'Owner' : 'Player') : 'Guest'}</p>
                </div>
                <Star className="w-8 h-8 text-orange-500" />
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
                        <Badge className={`${getStatusColor(room.gameStarted, room.playerCount, room.maxPlayers)} text-white`}>
                          {getStatusText(room.gameStarted, room.playerCount, room.maxPlayers)}
                        </Badge>
                        {room.settings?.isBlockchainGame ? (
                          <Badge className="bg-yellow-500 text-white">
                            <Coins className="w-3 h-3 mr-1" />
                            Blockchain ({room.settings.entryFee} ETH)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100">
                            <Wifi className="w-3 h-3 mr-1" />
                            WebSocket
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>👑 {room.host}</span>
                        <span>⏰ {formatTimeAgo(room.createdAt)}</span>
                        {room.settings?.isBlockchainGame && (
                          <span>💰 Prize Pool: {room.settings.entryFee} ETH × {room.playerCount}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{room.playerCount}/{room.maxPlayers} players</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {room.gameStarted ? (
                        <Button variant="secondary" disabled>
                          <Play className="w-4 h-4 mr-2" />
                          In Progress
                        </Button>
                      ) : room.playerCount >= room.maxPlayers ? (
                        <Button variant="secondary" disabled>
                          Room Full
                        </Button>
                      ) : (
                          <Button 
                            onClick={() => handleJoinRoom(room.id)}
                            disabled={!wsConnected || (room.settings?.isBlockchainGame && !walletConnected)}
                          >
                            {room.settings?.isBlockchainGame ? (
                              <>
                                <Coins className="w-4 h-4 mr-2" />
                                Join ({room.settings.entryFee} ETH)
                              </>
                            ) : (
                              <>
                                <Users className="w-4 h-4 mr-2" />
                                Join Room
                              </>
                            )}
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
