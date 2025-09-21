'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Users, Trophy, Crown, Play, Bomb, Zap } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface Player {
  id: string
  username: string
  score: number
  isHost: boolean
  isReady: boolean
  avatar: string
  gamesWon: number
  currentTime: number
  isFinished: boolean
}

interface MinesRoom {
  id: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  gridSize: string
  mineCount: number
  gameStarted: boolean
}

interface Cell {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborCount: number
}

export default function MinesRoom() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string
  
  const [room, setRoom] = useState<MinesRoom>({
    id: roomId,
    name: 'Beginner Minefield',
    host: 'MineSweeper',
    players: [
      { id: '1', username: 'MineSweeper', score: 0, isHost: true, isReady: true, avatar: 'M', gamesWon: 15, currentTime: 0, isFinished: false },
      { id: '2', username: 'BombDefuser', score: 0, isHost: false, isReady: true, avatar: 'B', gamesWon: 8, currentTime: 0, isFinished: false },
      { id: '3', username: 'SafeStep', score: 0, isHost: false, isReady: true, avatar: 'S', gamesWon: 3, currentTime: 0, isFinished: false }
    ],
    maxPlayers: 4,
    difficulty: 'easy',
    gridSize: '9x9',
    mineCount: 10,
    gameStarted: true
  })

  const [currentUser] = useState('BombDefuser')
  const [gameTime, setGameTime] = useState(0)
  const [grid, setGrid] = useState<Cell[][]>([])
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [firstClick, setFirstClick] = useState(true)
  const [flagsRemaining, setFlagsRemaining] = useState(room.mineCount)

  // Initialize grid
  useEffect(() => {
    if (room.gameStarted && grid.length === 0) {
      initializeGrid()
    }
  }, [room.gameStarted, grid.length])

  // Game timer
  useEffect(() => {
    if (!room.gameStarted || gameStatus !== 'playing') return

    const timer = setInterval(() => {
      setGameTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [room.gameStarted, gameStatus])

  const initializeGrid = useCallback(() => {
    const rows = 9 // Easy mode
    const cols = 9
    const newGrid: Cell[][] = []
    
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = []
      for (let j = 0; j < cols; j++) {
        row.push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborCount: 0
        })
      }
      newGrid.push(row)
    }
    
    // Place mines randomly
    let minesPlaced = 0
    while (minesPlaced < room.mineCount) {
      const row = Math.floor(Math.random() * rows)
      const col = Math.floor(Math.random() * cols)
      
      if (!newGrid[row][col].isMine) {
        newGrid[row][col].isMine = true
        minesPlaced++
      }
    }
    
    // Calculate neighbor counts
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newGrid[i][j].isMine) {
          let count = 0
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              const ni = i + di
              const nj = j + dj
              if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && newGrid[ni][nj].isMine) {
                count++
              }
            }
          }
          newGrid[i][j].neighborCount = count
        }
      }
    }
    
    setGrid(newGrid)
  }, [room.mineCount])

  const revealCell = (row: number, col: number) => {
    if (gameStatus !== 'playing' || grid[row][col].isRevealed || grid[row][col].isFlagged) return

    const newGrid = [...grid]
    
    if (firstClick) {
      setFirstClick(false)
    }
    
    if (newGrid[row][col].isMine) {
      // Game over
      setGameStatus('lost')
      // Reveal all mines
      for (let i = 0; i < newGrid.length; i++) {
        for (let j = 0; j < newGrid[i].length; j++) {
          if (newGrid[i][j].isMine) {
            newGrid[i][j].isRevealed = true
          }
        }
      }
    } else {
      // Reveal cell and potentially neighbors
      const toReveal = [[row, col]]
      const revealed = new Set<string>()
      
      while (toReveal.length > 0) {
        const [r, c] = toReveal.pop()!
        const key = `${r},${c}`
        
        if (revealed.has(key) || newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) continue
        
        newGrid[r][c].isRevealed = true
        revealed.add(key)
        
        // If this cell has no neighboring mines, reveal all neighbors
        if (newGrid[r][c].neighborCount === 0) {
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              const ni = r + di
              const nj = c + dj
              if (ni >= 0 && ni < newGrid.length && nj >= 0 && nj < newGrid[0].length) {
                toReveal.push([ni, nj])
              }
            }
          }
        }
      }
      
      // Check win condition
      let unrevealedSafeCells = 0
      for (let i = 0; i < newGrid.length; i++) {
        for (let j = 0; j < newGrid[i].length; j++) {
          if (!newGrid[i][j].isMine && !newGrid[i][j].isRevealed) {
            unrevealedSafeCells++
          }
        }
      }
      
      if (unrevealedSafeCells === 0) {
        setGameStatus('won')
        // Update player stats
        setRoom(prev => ({
          ...prev,
          players: prev.players.map(player => 
            player.username === currentUser 
              ? { ...player, score: player.score + (1000 - gameTime * 10), gamesWon: player.gamesWon + 1, currentTime: gameTime, isFinished: true }
              : player
          )
        }))
      }
    }
    
    setGrid(newGrid)
  }

  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (gameStatus !== 'playing' || grid[row][col].isRevealed) return

    const newGrid = [...grid]
    newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged
    setGrid(newGrid)
    
    setFlagsRemaining(prev => newGrid[row][col].isFlagged ? prev - 1 : prev + 1)
  }

  const handleStartGame = () => {
    setRoom(prev => ({ ...prev, gameStarted: true }))
    setGameTime(0)
    setGameStatus('playing')
    setFirstClick(true)
    setFlagsRemaining(room.mineCount)
    initializeGrid()
  }

  const handleLeaveRoom = () => {
    router.push('/mines')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-orange-500'
      case 'expert': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getCellDisplay = (cell: Cell) => {
    if (cell.isFlagged) return '🚩'
    if (!cell.isRevealed) return ''
    if (cell.isMine) return '💣'
    if (cell.neighborCount === 0) return ''
    return cell.neighborCount.toString()
  }

  const getCellColor = (cell: Cell) => {
    if (cell.isFlagged) return 'bg-yellow-200'
    if (!cell.isRevealed) return 'bg-muted hover:bg-muted/80'
    if (cell.isMine) return 'bg-red-500'
    if (cell.neighborCount === 0) return 'bg-gray-200'
    return 'bg-gray-100'
  }

  const getNumberColor = (count: number) => {
    const colors = ['', 'text-blue-600', 'text-green-600', 'text-red-600', 'text-purple-600', 'text-yellow-600', 'text-pink-600', 'text-gray-600', 'text-black']
    return colors[count] || 'text-black'
  }

  const isHost = room.players.find(p => p.username === currentUser)?.isHost || false
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{room.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>💣 {room.mineCount} mines</span>
                <span>📏 {room.gridSize}</span>
                <Badge className={`${getDifficultyColor(room.difficulty)} text-white text-xs`}>
                  {room.difficulty}
                </Badge>
                <span>👑 {room.host}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {room.gameStarted && (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatTime(gameTime)}</div>
                  <div className="text-xs text-muted-foreground">time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{flagsRemaining}</div>
                  <div className="text-xs text-muted-foreground">flags</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{room.players.length}/{room.maxPlayers}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Game Area */}
          <div className="xl:col-span-3 space-y-6">
            {room.gameStarted ? (
              <>
                {/* Game Status */}
                {gameStatus !== 'playing' && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className={`text-4xl mb-2 ${gameStatus === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                        {gameStatus === 'won' ? '🎉' : '💥'}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {gameStatus === 'won' ? 'Congratulations!' : 'Game Over!'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {gameStatus === 'won' 
                          ? `You completed the minefield in ${formatTime(gameTime)}!` 
                          : 'You hit a mine! Better luck next time.'
                        }
                      </p>
                      {isHost && (
                        <Button onClick={handleStartGame}>
                          Start New Game
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Mines Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>💣 Minefield</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={gameStatus === 'won' ? 'text-green-500' : gameStatus === 'lost' ? 'text-red-500' : ''}>
                          {gameStatus === 'playing' ? 'Playing' : gameStatus === 'won' ? 'Won!' : 'Lost'}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-9 gap-1 max-w-md mx-auto">
                      {grid.map((row, rowIndex) => 
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                              w-8 h-8 flex items-center justify-center text-sm font-bold border-2 cursor-pointer
                              transition-colors select-none
                              ${getCellColor(cell)}
                              ${cell.isRevealed ? 'border-gray-400' : 'border-gray-600 hover:border-gray-500'}
                              ${getNumberColor(cell.neighborCount)}
                            `}
                            onClick={() => revealCell(rowIndex, colIndex)}
                            onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                          >
                            {getCellDisplay(cell)}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      <p>Left click to reveal • Right click to flag</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bomb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Waiting to Start</h3>
                    <p className="text-muted-foreground mb-4">
                      {isHost ? 'Click start when all players are ready!' : 'Waiting for host to start the game...'}
                    </p>
                    {isHost && (
                      <Button onClick={handleStartGame}>
                        <Play className="w-4 h-4 mr-2" />
                        Start Game
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Players Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {room.players
                    .sort((a, b) => b.gamesWon - a.gamesWon)
                    .map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{player.avatar}</AvatarFallback>
                          </Avatar>
                          {player.isHost && (
                            <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-1">
                            {index === 0 && <Trophy className="w-3 h-3 text-yellow-500" />}
                            {player.username}
                            {player.username === currentUser && <span className="text-xs text-primary">(You)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {player.gamesWon} wins • {player.currentTime > 0 ? formatTime(player.currentTime) : '--'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {player.isFinished && gameStatus === 'won' && player.username === currentUser && (
                          <div className="text-xs text-green-500">✓ Finished</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Game Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Difficulty:</span>
                  <Badge className={`${getDifficultyColor(room.difficulty)} text-white text-xs`}>
                    {room.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Grid Size:</span>
                  <span>{room.gridSize}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Mines:</span>
                  <span>{room.mineCount}</span>
                </div>
                {room.gameStarted && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Flags Left:</span>
                      <span className={flagsRemaining < 0 ? 'text-red-500' : ''}>{flagsRemaining}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Time:</span>
                      <span>{formatTime(gameTime)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bomb className="w-5 h-5" />
                  How to Play
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Left click to reveal cells</p>
                <p>• Right click to place flags</p>
                <p>• Numbers show nearby mines</p>
                <p>• Avoid the mines!</p>
                <p>• Win by revealing all safe cells</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

