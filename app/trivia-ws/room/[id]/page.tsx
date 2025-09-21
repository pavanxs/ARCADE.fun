'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, ArrowLeft, Users, Trophy, Crown, Play, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import useWebSocket from '@/hooks/useWebSocket'

interface TriviaQuestion {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  correctAnswer: string
  hints: string[]
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

export default function TriviaWebSocketRoom() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string
  
  const {
    isConnected,
    currentRoom,
    chatMessages,
    error,
    leaveRoom,
    toggleReady,
    startGame,
    sendGameAction,
    sendChatMessage
  } = useWebSocket()

  const [currentUser] = useState('Player123') // This would come from auth
  const [chatInput, setChatInput] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isAnswering, setIsAnswering] = useState(false)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const answerInputRef = useRef<HTMLInputElement>(null)

  // Initialize current question from game state
  useEffect(() => {
    if (currentRoom && currentRoom.gameStarted && currentRoom.gameState) {
      const questionIdx = currentRoom.gameState.currentQuestionIndex || 0
      if (questionIdx < sampleQuestions.length) {
        setCurrentQuestion(sampleQuestions[questionIdx])
        setQuestionIndex(questionIdx)
      }
      setTimeLeft(currentRoom.gameState.timeLeft || 30)
    }
  }, [currentRoom])

  // Timer effect
  useEffect(() => {
    if (!currentRoom?.gameStarted || !currentQuestion) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentRoom?.gameStarted, currentQuestion, handleTimeUp])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      const scrollContainer = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [chatMessages])

  // Redirect if not in room
  useEffect(() => {
    if (isConnected && (!currentRoom || currentRoom.id !== roomId)) {
      router.push('/trivia-ws')
    }
  }, [currentRoom, roomId, isConnected, router])

  const formatTime = (date: Date) => 
    new Date(date).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    sendChatMessage(chatInput.trim())
    setChatInput('')
  }

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answerInput.trim() || !currentQuestion || isAnswering) return

    setIsAnswering(true)
    
    sendGameAction({
      type: 'submit-answer',
      answer: answerInput.trim(),
      questionId: currentQuestion.id,
      timeElapsed: 30 - timeLeft
    })
    
    setAnswerInput('')
    
    // Reset answering state after a short delay
    setTimeout(() => setIsAnswering(false), 2000)
  }

  const handleTimeUp = useCallback(() => {
    if (currentQuestion && questionIndex < sampleQuestions.length - 1) {
      setQuestionIndex(prev => prev + 1)
      setCurrentQuestion(sampleQuestions[questionIndex + 1])
      setTimeLeft(30)
    } else {
      // Game over
      setCurrentQuestion(null)
    }
  }, [currentQuestion, questionIndex])

  const handleStartGame = () => {
    startGame()
  }

  const handleLeaveRoom = () => {
    leaveRoom()
    router.push('/trivia-ws')
  }

  const handleToggleReady = () => {
    toggleReady()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Connection Lost</h3>
            <p className="text-muted-foreground mb-4">Trying to reconnect...</p>
            <Button onClick={() => router.push('/trivia-ws')}>
              Back to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Room Not Found</h3>
            <p className="text-muted-foreground mb-4">The room you&apos;re looking for doesn&apos;t exist or has been closed.</p>
            <Button onClick={() => router.push('/trivia-ws')}>
              Back to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentPlayer = currentRoom.players.find(p => p.username === currentUser)
  const isHost = currentPlayer?.isHost || false

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        {/* Error Display */}
        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{currentRoom.name}</h1>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>🎯 {currentRoom.settings?.category || 'General'}</span>
                <Badge className={`${getDifficultyColor(currentRoom.settings?.difficulty || 'medium')} text-white text-xs`}>
                  {currentRoom.settings?.difficulty || 'medium'}
                </Badge>
                <span>👑 {currentRoom.host}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {currentRoom.gameStarted && currentQuestion && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                  {timeLeft}
                </div>
                <div className="text-xs text-muted-foreground">seconds</div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{currentRoom.players.length}/{currentRoom.maxPlayers}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            {currentRoom.gameStarted && currentQuestion ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      📝 Question {questionIndex + 1}
                      <Badge variant="outline">{currentQuestion.category}</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${timeLeft <= 10 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className="text-sm font-mono">{timeLeft}s</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg mb-4">{currentQuestion.question}</p>
                  
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
                    💡 Type &quot;hint&quot; in chat for a clue
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {currentRoom.gameStarted ? (
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
                      <div className="flex gap-2 justify-center">
                        {!isHost && (
                          <Button 
                            variant={currentPlayer?.isReady ? "default" : "outline"}
                            onClick={handleToggleReady}
                          >
                            {currentPlayer?.isReady ? 'Ready!' : 'Mark Ready'}
                          </Button>
                        )}
                        {isHost && (
                          <Button onClick={handleStartGame}>
                            <Play className="w-4 h-4 mr-2" />
                            Start Game
                          </Button>
                        )}
                      </div>
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
                            <span className="font-medium mr-2 text-primary">
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
                  Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentRoom.players
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
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
                            {index === 0 && currentRoom.gameStarted && <Trophy className="w-3 h-3 text-yellow-500" />}
                            {player.username}
                            {player.username === currentUser && <span className="text-xs text-primary">(You)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {player.score || 0} points
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
                  <span>{currentRoom.settings?.category || 'General'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Difficulty:</span>
                  <Badge className={`${getDifficultyColor(currentRoom.settings?.difficulty || 'medium')} text-white text-xs`}>
                    {currentRoom.settings?.difficulty || 'medium'}
                  </Badge>
                </div>
                {currentRoom.gameStarted && (
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

