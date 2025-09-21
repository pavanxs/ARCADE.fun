'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Play, Search, Wallet, Coins, AlertCircle, Trophy, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatEther } from 'viem'
import useGameContract from '@/hooks/useGameContract'
import useWebSocket from '@/hooks/useWebSocket'

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


export default function BlockchainTriviaLobby() {
  const {
    isConnected,
    address,
    isLoading: contractLoading,
    error: contractError,
    gameCount,
    contractBalance,
    isOwner,
    createGame,
    getGame,
    refetchGameCount
  } = useGameContract()

  const {
    isConnected: wsConnected,
    rooms,
    currentRoom,
    error: wsError,
    createRoom,
    joinRoom
  } = useWebSocket()

  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showCreateBlockchainGame, setShowCreateBlockchainGame] = useState(false)
  const [currentUser] = useState(`Player${Math.floor(Math.random() * 1000)}`)
  const [blockchainGames, setBlockchainGames] = useState<unknown[]>([])
  const router = useRouter()

  // Create room form state
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomCategory, setNewRoomCategory] = useState('')
  const [newRoomDifficulty, setNewRoomDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4)

  // Create blockchain game form state
  const [newGameQuestion, setNewGameQuestion] = useState('')
  const [newGameAnswer, setNewGameAnswer] = useState('')
  const [newGameEntryFee, setNewGameEntryFee] = useState('0.001')

  // Filter rooms for trivia game type
  const triviaRooms = rooms.filter(room => room.gameType === 'trivia')
  
  const filteredRooms = triviaRooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.host.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Load blockchain games
  useEffect(() => {
    const loadBlockchainGames = async () => {
      if (!gameCount || gameCount === 0) return

      const games = []
      for (let i = 1; i <= gameCount; i++) {
        try {
          const game = await getGame(i)
          if (game) {
            games.push({
              ...game,
              entryFeeEth: formatEther(BigInt(game.entryFee)),
              prizePoolEth: formatEther(BigInt(game.prizePool))
            })
          }
        } catch (error) {
          console.error(`Error loading game ${i}:`, error)
        }
      }
      setBlockchainGames(games)
    }

    loadBlockchainGames()
  }, [gameCount, getGame])

  // Redirect to room if currently in one
  useEffect(() => {
    if (currentRoom && currentRoom.gameType === 'trivia') {
      router.push(`/trivia-blockchain/room/${currentRoom.id}`)
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

  const handleCreateRoom = () => {
    if (!newRoomName.trim() || !newRoomCategory) return

    const settings = {
      category: newRoomCategory,
      difficulty: newRoomDifficulty,
      questionCount: 10,
      timePerQuestion: 30
    }

    createRoom({
      roomName: newRoomName.trim(),
      gameType: 'trivia',
      username: currentUser,
      maxPlayers: newRoomMaxPlayers,
      settings
    })

    setShowCreateRoom(false)
    
    // Reset form
    setNewRoomName('')
    setNewRoomCategory('')
    setNewRoomDifficulty('easy')
    setNewRoomMaxPlayers(4)
  }

  const handleCreateBlockchainGame = async () => {
    if (!newGameQuestion.trim() || !newGameAnswer.trim() || !newGameEntryFee) return

    try {
      const hash = await createGame(newGameQuestion.trim(), newGameAnswer.trim(), newGameEntryFee)
      if (hash) {
        setShowCreateBlockchainGame(false)
        // Reset form
        setNewGameQuestion('')
        setNewGameAnswer('')
        setNewGameEntryFee('0.001')
        
        // Refetch game count after transaction
        setTimeout(() => {
          refetchGameCount()
        }, 5000)
      }
    } catch (error) {
      console.error('Error creating blockchain game:', error)
    }
  }

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId, currentUser)
  }

  const handleJoinBlockchainGame = (gameId: number) => {
    router.push(`/trivia-blockchain/game/${gameId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Connection Status & Error */}
        <div className="mb-4">
          {(contractError || wsError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{contractError || wsError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">🧠 Blockchain Trivia Lobby</h1>
            <p className="text-muted-foreground">Play trivia with real prizes on the blockchain!</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <ConnectButton />
            
            {isConnected && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="w-4 h-4" />
                <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Stats */}
        {isConnected && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Games</p>
                    <p className="text-2xl font-bold">{gameCount}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Balance</p>
                    <p className="text-2xl font-bold">{parseFloat(contractBalance).toFixed(4)} ETH</p>
                  </div>
                  <Coins className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">WebSocket Rooms</p>
                    <p className="text-2xl font-bold">{triviaRooms.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Role</p>
                    <p className="text-sm font-bold">{isOwner ? 'Owner' : 'Player'}</p>
                  </div>
                  <Star className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!wsConnected}>
                <Plus className="w-4 h-4 mr-2" />
                Create WebSocket Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create WebSocket Trivia Room</DialogTitle>
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
                  disabled={!newRoomName.trim() || !newRoomCategory || !wsConnected}
                >
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {isOwner && (
            <Dialog open={showCreateBlockchainGame} onOpenChange={setShowCreateBlockchainGame}>
              <DialogTrigger asChild>
                <Button disabled={!isConnected || contractLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Blockchain Game
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Blockchain Trivia Game</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="game-question">Question</Label>
                    <Input
                      id="game-question"
                      placeholder="Enter trivia question"
                      value={newGameQuestion}
                      onChange={(e) => setNewGameQuestion(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="game-answer">Answer</Label>
                    <Input
                      id="game-answer"
                      placeholder="Enter correct answer"
                      value={newGameAnswer}
                      onChange={(e) => setNewGameAnswer(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="entry-fee">Entry Fee (ETH)</Label>
                    <Input
                      id="entry-fee"
                      type="number"
                      step="0.001"
                      placeholder="0.001"
                      value={newGameEntryFee}
                      onChange={(e) => setNewGameEntryFee(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCreateBlockchainGame} 
                    className="w-full"
                    disabled={!newGameQuestion.trim() || !newGameAnswer.trim() || !newGameEntryFee || contractLoading}
                  >
                    {contractLoading ? 'Creating...' : 'Create Blockchain Game'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Blockchain Games */}
        {isConnected && blockchainGames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🔗 Blockchain Trivia Games</h2>
            <div className="space-y-4">
              {blockchainGames.map(game => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">Game #{game.id}</h3>
                          <Badge className={game.isActive ? 'bg-green-500' : game.isCompleted ? 'bg-blue-500' : 'bg-gray-500'}>
                            {game.isActive ? 'Active' : game.isCompleted ? 'Completed' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="bg-yellow-100">
                            <Coins className="w-3 h-3 mr-1" />
                            {game.entryFeeEth} ETH
                          </Badge>
                        </div>
                        
                        <p className="text-lg mb-2">{game.question}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span>👥 {game.participants.length} players</span>
                          <span>💰 Prize: {game.prizePoolEth} ETH</span>
                          {game.winner !== '0x0000000000000000000000000000000000000000' && (
                            <span>🏆 Winner: {game.winner.slice(0, 6)}...{game.winner.slice(-4)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {game.isActive && !game.isCompleted ? (
                          <Button onClick={() => handleJoinBlockchainGame(game.id)}>
                            <Wallet className="w-4 h-4 mr-2" />
                            Join Game ({game.entryFeeEth} ETH)
                          </Button>
                        ) : game.isCompleted ? (
                          <Button variant="secondary" disabled>
                            Game Completed
                          </Button>
                        ) : (
                          <Button variant="secondary" disabled>
                            Game Inactive
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* WebSocket Rooms */}
        {wsConnected && (
          <div>
            <h2 className="text-2xl font-bold mb-4">⚡ WebSocket Trivia Rooms</h2>
            <div className="space-y-4">
              {filteredRooms.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No WebSocket rooms found</p>
                      <p className="text-sm">Create a new room to get started!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredRooms.map(room => (
                  <Card key={room.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{room.name}</h3>
                            <Badge className={`${getStatusColor(room.gameStarted, room.playerCount, room.maxPlayers)} text-white`}>
                              {getStatusText(room.gameStarted, room.playerCount, room.maxPlayers)}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-100">
                              WebSocket
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span>👑 {room.host}</span>
                            <span>⏰ {formatTimeAgo(room.createdAt)}</span>
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
                              disabled={!wsConnected}
                            >
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
        )}
      </div>
    </div>
  )
}

