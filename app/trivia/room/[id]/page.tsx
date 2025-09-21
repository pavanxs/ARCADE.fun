'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, ArrowLeft, Users, Trophy, Crown, Play } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  username?: string
  message: string
  timestamp: Date
}

interface TriviaQuestion {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  correctAnswer: string
  hints: string[]
}

interface Player {
  id: string
  username: string
  score: number
  isHost: boolean
  isReady: boolean
  avatar: string
}

interface TriviaRoom {
  id: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  gameStarted: boolean
  currentQuestion?: TriviaQuestion
}

// Color palette for usernames
const USER_COLORS = [
  '#2563eb', '#16a34a', '#9333ea', '#dc2626', '#ca8a04', 
  '#db2777', '#4f46e5', '#0d9488', '#ea580c', '#0891b2'
]

const getUserColor = (username: string) => {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

const sampleQuestions: TriviaQuestion[] = [
  {
    id: '1',
    question: 'What is the largest planet in our solar system?',
    category: 'Science',
    difficulty: 'easy',
    correctAnswer: 'Jupiter',
    hints: [
      'It\'s a gas giant',
      'It has a famous red spot',
      'It\'s the 5th planet from the sun'
    ]
  },
  {
    id: '2',
    question: 'Which cryptocurrency was created by Satoshi Nakamoto?',
    category: 'Technology',
    difficulty: 'medium',
    correctAnswer: 'Bitcoin',
    hints: [
      'It was the first cryptocurrency',
      'Its symbol is BTC',
      'It was created in 2009'
    ]
  },
  {
    id: '3',
    question: 'What is the chemical symbol for gold?',
    category: 'Science',
    difficulty: 'easy',
    correctAnswer: 'Au',
    hints: [
      'It comes from the Latin word "aurum"',
      'It\'s a two-letter symbol',
      'The first letter is A'
    ]
  }
]

export default function TriviaRoom() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string
  
  // Room and game state
  const [room, setRoom] = useState<TriviaRoom>({
    id: roomId,
    name: 'Science Masters',
    host: 'Alex',
    players: [
      { id: '1', username: 'Alex', score: 0, isHost: true, isReady: true, avatar: 'A' },
      { id: '2', username: 'Sarah', score: 15, isHost: false, isReady: true, avatar: 'S' },
      { id: '3', username: 'Mike', score: 8, isHost: false, isReady: true, avatar: 'M' }
    ],
    maxPlayers: 6,
    category: 'Science',
    difficulty: 'medium',
    gameStarted: true,
    currentQuestion: sampleQuestions[0]
  })

  const [currentUser] = useState('Sarah') // This would come from auth
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      message: 'Welcome to the trivia room! The game has started. Good luck everyone!',
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [hintCount, setHintCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isAnswering, setIsAnswering] = useState(false)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const answerInputRef = useRef<HTMLInputElement>(null)

  // Timer effect
  useEffect(() => {
    if (!room.gameStarted || !room.currentQuestion) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - move to next question
          handleTimeUp()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [room.gameStarted, room.currentQuestion, questionIndex, handleTimeUp])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      const scrollContainer = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [chatMessages])

  const addChatMessage = useCallback((type: 'user' | 'ai' | 'system', message: string, username?: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      username,
      message,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, newMessage])
  }, [])

  const formatTime = (date: Date) => 
    date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const message = chatInput.trim().toLowerCase()
    
    // Check for hint requests
    if (message.includes('hint') && room.currentQuestion) {
      if (hintCount < room.currentQuestion.hints.length) {
        const hint = room.currentQuestion.hints[hintCount]
        addChatMessage('system', `💡 Hint ${hintCount + 1}: ${hint}`)
        setHintCount(prev => prev + 1)
      } else {
        addChatMessage('system', '❌ No more hints available!')
      }
    } else {
      // Regular chat message
      addChatMessage('user', chatInput, currentUser)
    }
    
    setChatInput('')
  }

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answerInput.trim() || !room.currentQuestion || isAnswering) return

    setIsAnswering(true)
    const isCorrect = answerInput.toLowerCase().trim() === room.currentQuestion.correctAnswer.toLowerCase()
    
    if (isCorrect) {
      const points = Math.max(10 - hintCount * 2, 2)
      
      // Update player score
      setRoom(prev => ({
        ...prev,
        players: prev.players.map(player => 
          player.username === currentUser 
            ? { ...player, score: player.score + points }
            : player
        )
      }))
      
      addChatMessage('system', `🎉 ${currentUser} got it right! "${answerInput}" is correct! (+${points} points)`)
      
      // Move to next question after delay
      setTimeout(() => {
        handleNextQuestion()
      }, 2000)
    } else {
      addChatMessage('system', `❌ "${answerInput}" is incorrect. Keep trying!`)
      setIsAnswering(false)
    }
    
    setAnswerInput('')
  }

  const handleNextQuestion = useCallback(() => {
    if (questionIndex < sampleQuestions.length - 1) {
      const nextIndex = questionIndex + 1
      setQuestionIndex(nextIndex)
      setRoom(prev => ({
        ...prev,
        currentQuestion: sampleQuestions[nextIndex]
      }))
      setHintCount(0)
      setTimeLeft(30)
      setIsAnswering(false)
      addChatMessage('system', `📝 Question ${nextIndex + 1} loaded!`)
    } else {
      // Game over
      setRoom(prev => ({ ...prev, gameStarted: false, currentQuestion: undefined }))
      const winner = room.players.reduce((prev, current) => 
        prev.score > current.score ? prev : current
      )
      addChatMessage('system', `🏆 Game Complete! Winner: ${winner.username} with ${winner.score} points!`)
    }
  }, [questionIndex, room.players, addChatMessage])

  const handleTimeUp = useCallback(() => {
    addChatMessage('system', `⏰ Time's up! The answer was: ${room.currentQuestion?.correctAnswer}`)
    setTimeout(() => {
      handleNextQuestion()
    }, 2000)
  }, [room.currentQuestion?.correctAnswer, handleNextQuestion, addChatMessage])

  const handleStartGame = () => {
    setRoom(prev => ({
      ...prev,
      gameStarted: true,
      currentQuestion: sampleQuestions[0]
    }))
    setQuestionIndex(0)
    setHintCount(0)
    setTimeLeft(30)
    addChatMessage('system', '🎮 Game Started! First question is loaded. Good luck!')
  }

  const handleLeaveRoom = () => {
    router.push('/trivia')
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
                <span>🎯 {room.category}</span>
                <Badge className={`${getDifficultyColor(room.difficulty)} text-white text-xs`}>
                  {room.difficulty}
                </Badge>
                <span>👑 {room.host}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {room.gameStarted && room.currentQuestion && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{timeLeft}</div>
                <div className="text-xs text-muted-foreground">seconds</div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{room.players.length}/{room.maxPlayers}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            {room.gameStarted && room.currentQuestion ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      📝 Question {questionIndex + 1}
                      <Badge variant="outline">{room.currentQuestion.category}</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${timeLeft <= 10 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className="text-sm font-mono">{timeLeft}s</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg mb-4">{room.currentQuestion.question}</p>
                  
                  <form onSubmit={handleAnswerSubmit} className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        ref={answerInputRef}
                        placeholder="Type your answer..."
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        disabled={isAnswering}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!answerInput.trim() || isAnswering}>
                        {isAnswering ? 'Checking...' : 'Submit'}
                      </Button>
                    </div>
                  </form>
                  
                  <div className="mt-4 text-sm text-muted-foreground">
                    💡 Type &quot;hint&quot; in chat for a clue ({hintCount}/{room.currentQuestion.hints.length} used)
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {room.gameStarted ? (
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

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Room Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 mb-4" ref={chatScrollRef}>
                  <div className="space-y-2 pr-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.type === 'system' ? (
                          <div className="text-blue-600 font-medium">{msg.message}</div>
                        ) : (
                          <div>
                            <span 
                              className="font-medium mr-2"
                              style={{ color: getUserColor(msg.username || '') }}
                            >
                              {msg.username}:
                            </span>
                            <span>{msg.message}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <Input
                    ref={chatInputRef}
                    placeholder="Type a message or 'hint'..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    Send
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players ({room.players.length}/{room.maxPlayers})
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
                            {player.score} points
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {player.isReady && <div className="w-2 h-2 bg-green-500 rounded-full" />}
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
                  <Trophy className="w-5 h-5" />
                  Game Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Questions:</span>
                  <span>{questionIndex + 1}/{sampleQuestions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Category:</span>
                  <span>{room.category}</span>
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
                    <span className={timeLeft <= 10 ? 'text-red-500 font-bold' : ''}>{timeLeft}s</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
