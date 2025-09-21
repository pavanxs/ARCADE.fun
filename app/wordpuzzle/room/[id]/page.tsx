'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Users, Trophy, Crown, Play, Target, Zap } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface Player {
  id: string
  username: string
  score: number
  wordsFound: number
  isHost: boolean
  isReady: boolean
  avatar: string
}

interface WordPuzzleRoom {
  id: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  difficulty: 'easy' | 'medium' | 'hard'
  wordCount: number
  timeLimit: number
  gameStarted: boolean
}

// Word grid and hidden words
const SAMPLE_GRID = [
  ['C', 'A', 'T', 'S', 'M', 'O', 'U', 'S', 'E', 'R'],
  ['O', 'X', 'B', 'I', 'R', 'D', 'F', 'L', 'A', 'T'],
  ['D', 'O', 'G', 'S', 'H', 'A', 'R', 'K', 'G', 'E'],
  ['E', 'L', 'E', 'P', 'H', 'A', 'N', 'T', 'O', 'A'],
  ['R', 'A', 'B', 'B', 'I', 'T', 'W', 'O', 'L', 'F'],
  ['S', 'N', 'A', 'K', 'E', 'B', 'E', 'A', 'R', 'S'],
  ['L', 'I', 'O', 'N', 'T', 'I', 'G', 'E', 'R', 'A'],
  ['F', 'I', 'S', 'H', 'Z', 'E', 'B', 'R', 'A', 'L'],
  ['H', 'O', 'R', 'S', 'E', 'G', 'O', 'A', 'T', 'M'],
  ['P', 'I', 'G', 'C', 'O', 'W', 'D', 'U', 'C', 'K']
]

const HIDDEN_WORDS = [
  { word: 'CAT', found: false, direction: 'horizontal', start: [0, 0], end: [0, 2] },
  { word: 'DOG', found: false, direction: 'horizontal', start: [2, 0], end: [2, 2] },
  { word: 'BIRD', found: false, direction: 'horizontal', start: [1, 2], end: [1, 5] },
  { word: 'MOUSE', found: false, direction: 'horizontal', start: [0, 4], end: [0, 8] },
  { word: 'ELEPHANT', found: false, direction: 'horizontal', start: [3, 0], end: [3, 7] },
  { word: 'RABBIT', found: false, direction: 'horizontal', start: [4, 0], end: [4, 5] },
  { word: 'SNAKE', found: false, direction: 'horizontal', start: [5, 0], end: [5, 4] },
  { word: 'LION', found: false, direction: 'horizontal', start: [6, 0], end: [6, 3] },
  { word: 'TIGER', found: false, direction: 'horizontal', start: [6, 4], end: [6, 8] },
  { word: 'FISH', found: false, direction: 'horizontal', start: [7, 0], end: [7, 3] },
  { word: 'HORSE', found: false, direction: 'horizontal', start: [8, 0], end: [8, 4] },
  { word: 'COW', found: false, direction: 'horizontal', start: [9, 2], end: [9, 4] }
]

export default function WordPuzzleRoom() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string
  
  const [room, setRoom] = useState<WordPuzzleRoom>({
    id: roomId,
    name: 'Word Masters Challenge',
    host: 'WordWiz',
    players: [
      { id: '1', username: 'WordWiz', score: 0, wordsFound: 0, isHost: true, isReady: true, avatar: 'W' },
      { id: '2', username: 'PuzzleKing', score: 0, wordsFound: 0, isHost: false, isReady: true, avatar: 'P' },
      { id: '3', username: 'LetterLover', score: 0, wordsFound: 0, isHost: false, isReady: true, avatar: 'L' }
    ],
    maxPlayers: 6,
    difficulty: 'medium',
    wordCount: 12,
    timeLimit: 300,
    gameStarted: true
  })

  const [currentUser] = useState('PuzzleKing')
  const [timeLeft, setTimeLeft] = useState(300)
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [grid] = useState(SAMPLE_GRID)
  const [wordList, setWordList] = useState(HIDDEN_WORDS)

  // Timer effect
  useEffect(() => {
    if (!room.gameStarted) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up
          handleGameEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [room.gameStarted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true)
    setSelectedCells([{row, col}])
    setCurrentWord(grid[row][col])
  }

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting) return
    
    const lastCell = selectedCells[selectedCells.length - 1]
    if (!lastCell) return

    // Check if this forms a valid line (horizontal, vertical, or diagonal)
    const isValidSelection = isValidLine(selectedCells[0], {row, col})
    
    if (isValidSelection) {
      const newSelection = getLineCells(selectedCells[0], {row, col})
      setSelectedCells(newSelection)
      setCurrentWord(newSelection.map(cell => grid[cell.row][cell.col]).join(''))
    }
  }

  const handleCellMouseUp = () => {
    if (selectedCells.length > 1) {
      checkWord()
    }
    setIsSelecting(false)
    setSelectedCells([])
    setCurrentWord('')
  }

  const isValidLine = (start: {row: number, col: number}, end: {row: number, col: number}) => {
    const rowDiff = Math.abs(end.row - start.row)
    const colDiff = Math.abs(end.col - start.col)
    
    // Horizontal, vertical, or diagonal
    return rowDiff === 0 || colDiff === 0 || rowDiff === colDiff
  }

  const getLineCells = (start: {row: number, col: number}, end: {row: number, col: number}) => {
    const cells = []
    const rowStep = start.row === end.row ? 0 : (end.row > start.row ? 1 : -1)
    const colStep = start.col === end.col ? 0 : (end.col > start.col ? 1 : -1)
    
    let currentRow = start.row
    let currentCol = start.col
    
    while (true) {
      cells.push({row: currentRow, col: currentCol})
      
      if (currentRow === end.row && currentCol === end.col) break
      
      currentRow += rowStep
      currentCol += colStep
    }
    
    return cells
  }

  const checkWord = () => {
    const word = currentWord.toUpperCase()
    const reverseWord = word.split('').reverse().join('')
    
    const foundWordIndex = wordList.findIndex(w => 
      (w.word === word || w.word === reverseWord) && !w.found
    )
    
    if (foundWordIndex !== -1) {
      // Mark word as found
      const updatedWordList = [...wordList]
      updatedWordList[foundWordIndex].found = true
      setWordList(updatedWordList)
      
      setFoundWords(prev => [...prev, updatedWordList[foundWordIndex].word])
      
      // Update player score
      const points = word.length * 10
      setRoom(prev => ({
        ...prev,
        players: prev.players.map(player => 
          player.username === currentUser 
            ? { ...player, score: player.score + points, wordsFound: player.wordsFound + 1 }
            : player
        )
      }))
      
      // Check if game is complete
      if (updatedWordList.every(w => w.found)) {
        handleGameEnd()
      }
    }
  }

  const handleGameEnd = () => {
    setRoom(prev => ({ ...prev, gameStarted: false }))
  }

  const handleStartGame = () => {
    setRoom(prev => ({ ...prev, gameStarted: true }))
    setTimeLeft(room.timeLimit)
    setFoundWords([])
    setWordList(HIDDEN_WORDS.map(w => ({ ...w, found: false })))
  }

  const handleLeaveRoom = () => {
    router.push('/wordpuzzle')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const isHost = room.players.find(p => p.username === currentUser)?.isHost || false
  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col)
  }

  const isCellInFoundWord = (row: number, col: number) => {
    return wordList.some(word => {
      if (!word.found) return false
      const cells = getLineCells(
        {row: word.start[0], col: word.start[1]}, 
        {row: word.end[0], col: word.end[1]}
      )
      return cells.some(cell => cell.row === row && cell.col === col)
    })
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
                <span>🎯 {room.wordCount} words</span>
                <Badge className={`${getDifficultyColor(room.difficulty)} text-white text-xs`}>
                  {room.difficulty}
                </Badge>
                <span>👑 {room.host}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {room.gameStarted && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs text-muted-foreground">remaining</div>
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
                {/* Word Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>🔤 Word Search Grid</span>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4" />
                        <span>{foundWords.length}/{room.wordCount} found</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-10 gap-1 max-w-lg mx-auto">
                      {grid.map((row, rowIndex) => 
                        row.map((letter, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                              w-8 h-8 flex items-center justify-center text-sm font-bold border-2 cursor-pointer
                              transition-colors select-none
                              ${isCellSelected(rowIndex, colIndex) 
                                ? 'bg-blue-500 text-white border-blue-600' 
                                : isCellInFoundWord(rowIndex, colIndex)
                                ? 'bg-green-500 text-white border-green-600'
                                : 'bg-muted hover:bg-muted/80 border-border'
                              }
                            `}
                            onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                            onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                            onMouseUp={handleCellMouseUp}
                          >
                            {letter}
                          </div>
                        ))
                      )}
                    </div>
                    {currentWord && (
                      <div className="text-center mt-4">
                        <p className="text-sm text-muted-foreground">Current selection:</p>
                        <p className="text-lg font-bold">{currentWord}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Words to Find */}
                <Card>
                  <CardHeader>
                    <CardTitle>🎯 Words to Find</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {wordList.map((wordObj, index) => (
                        <div
                          key={index}
                          className={`
                            p-2 rounded text-center text-sm font-medium
                            ${wordObj.found 
                              ? 'bg-green-500 text-white line-through' 
                              : 'bg-muted text-muted-foreground'
                            }
                          `}
                        >
                          {wordObj.word}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {foundWords.length > 0 ? (
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Game Complete!</h3>
                      <p className="text-muted-foreground mb-4">Check the leaderboard to see final scores</p>
                      {isHost && (
                        <Button onClick={handleStartGame}>
                          Start New Game
                        </Button>
                      )}
                    </div>
                  ) : (
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
                  )}
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
                    .sort((a, b) => b.score - a.score)
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
                            {index === 0 && room.gameStarted && <Trophy className="w-3 h-3 text-yellow-500" />}
                            {player.username}
                            {player.username === currentUser && <span className="text-xs text-primary">(You)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {player.wordsFound} words • {player.score} pts
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">#{index + 1}</div>
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
                  <span>Words Found:</span>
                  <span>{foundWords.length}/{room.wordCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Difficulty:</span>
                  <Badge className={`${getDifficultyColor(room.difficulty)} text-white text-xs`}>
                    {room.difficulty}
                  </Badge>
                </div>
                {room.gameStarted && (
                  <div className="flex justify-between text-sm">
                    <span>Time Left:</span>
                    <span className={timeLeft <= 30 ? 'text-red-500 font-bold' : ''}>{formatTime(timeLeft)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>{Math.round((foundWords.length / room.wordCount) * 100)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Finds */}
            {foundWords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Recent Finds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {foundWords.slice(-5).reverse().map((word, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="font-medium">{word}</span>
                        <span className="text-muted-foreground">+{word.length * 10} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

