'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, Lightbulb } from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  username?: string
  message: string
  timestamp: Date
}

// Color palette for usernames (hex colors)
const USER_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#dc2626', // red-600
  '#ca8a04', // yellow-600
  '#db2777', // pink-600
  '#4f46e5', // indigo-600
  '#0d9488', // teal-600
  '#ea580c', // orange-600
  '#0891b2'  // cyan-600
]

// Function to get consistent color for a username
const getUserColor = (username: string) => {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % USER_COLORS.length
  return USER_COLORS[colorIndex]
}

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
  }
]

export default function TriviaPage() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      message: 'Welcome to Trivia Chat! Ask for hints if you need help. Good luck!',
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion>(sampleQuestions[0])
  const [score, setScore] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [hintCount, setHintCount] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [username] = useState(`Player${Math.floor(Math.random() * 1000)}`)
  
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const answerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatScrollRef.current) {
      const scrollContainer = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [chatMessages])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const addChatMessage = (type: 'user' | 'ai' | 'system', message: string, username?: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      username,
      message,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, newMessage])
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    // Add user message
    addChatMessage('user', chatInput, username)
    
    // Check if user is asking for hint
    const isHintRequest = chatInput.toLowerCase().includes('hint') || 
                         chatInput.toLowerCase().includes('help') ||
                         chatInput.toLowerCase().includes('clue')
    
    if (isHintRequest && hintCount < currentQuestion.hints.length) {
      setTimeout(() => {
        addChatMessage('ai', `💡 Hint ${hintCount + 1}: ${currentQuestion.hints[hintCount]}`, 'AI Assistant')
        setHintCount(prev => prev + 1)
      }, 1000)
    } else if (isHintRequest) {
      setTimeout(() => {
        addChatMessage('ai', '🤔 Sorry, no more hints available for this question!', 'AI Assistant')
      }, 1000)
    } else {
      // AI responds to general chat
      setTimeout(() => {
        const responses = [
          'Interesting question! Keep thinking about the trivia.',
          'Good luck with the current question!',
          'Feel free to ask for a hint if you need help!',
          'You\'re doing great! Keep it up!',
          'Remember, you can always ask for hints!'
        ]
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        addChatMessage('ai', randomResponse, 'AI Assistant')
      }, 1000)
    }
    
    setChatInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const syntheticEvent = {
        preventDefault: () => {},
        currentTarget: e.currentTarget
      } as React.FormEvent<HTMLFormElement>
      handleChatSubmit(syntheticEvent)
    }
  }

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answerInput.trim()) return

    const isCorrect = answerInput.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase()
    
    if (isCorrect) {
      const points = Math.max(10 - hintCount * 2, 2) // Less points if more hints used
      setScore(prev => prev + points)
      addChatMessage('system', `🎉 Correct! "${answerInput}" is right! (+${points} points)`)
      
      // Move to next question
      setTimeout(() => {
        if (questionIndex < sampleQuestions.length - 1) {
          setQuestionIndex(prev => prev + 1)
          setCurrentQuestion(sampleQuestions[questionIndex + 1])
          setHintCount(0)
          addChatMessage('system', 'Next question loaded! Good luck!')
        } else {
          addChatMessage('system', `🏆 Game Complete! Final Score: ${score + points} points!`)
        }
      }, 2000)
    } else {
      addChatMessage('system', `❌ "${answerInput}" is incorrect. Try again!`)
    }
    
    setAnswerInput('')
  }

  const startGame = () => {
    setGameStarted(true)
    addChatMessage('system', '🎮 Game Started! Answer the question or ask for hints in chat.')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">🧠 Trivia Chat</h1>
          <p className="text-muted-foreground">Play trivia with AI hints in group chat</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Section - 2/3 of the page */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Trivia Group Chat
                  <Badge variant="secondary">
                    AI Hints Available
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{username}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 h-full" ref={chatScrollRef}>
                  <div className="p-4 space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          msg.username === username ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.username !== username && msg.username && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {msg.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {msg.type === 'system' && (
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            msg.username === username
                              ? 'bg-primary text-primary-foreground'
                              : msg.type === 'system'
                              ? 'bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100'
                              : msg.type === 'ai'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-xs font-medium"
                              style={{ 
                                color: msg.username === username 
                                  ? 'inherit' 
                                  : msg.type === 'system' || msg.type === 'ai'
                                  ? 'inherit'
                                  : getUserColor(msg.username || '') 
                              }}
                            >
                              {msg.username === username 
                                ? 'You' 
                                : msg.type === 'system' 
                                ? '🎮 Game' 
                                : msg.type === 'ai'
                                ? '🤖 AI Assistant'
                                : msg.username}
                            </span>
                            <span className="text-xs opacity-50">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        {msg.username === username && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-4 border-t">
                <div className="flex gap-2 w-full">
                  <Input
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message or ask for hints..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim()}
                  >
                    Send
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Game UI Section - 1/3 of the page */}
          <div className="lg:col-span-1">
            <div className="space-y-4 h-full flex flex-col">
              {/* Score and Game Info */}
              <div className="space-y-2">
                <div className="flex flex-col gap-2">
                  <Badge variant="secondary" className="text-center py-2">
                    Score: {score}
                  </Badge>
                  <Badge variant="outline" className="text-center">
                    Question {questionIndex + 1} of {sampleQuestions.length}
                  </Badge>
                </div>
                {!gameStarted && (
                  <Button onClick={startGame} className="w-full bg-green-600 hover:bg-green-700">
                    Start Game
                  </Button>
                )}
              </div>

              {/* Question Card */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">Current Question</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty}
                      </Badge>
                      <Badge variant="outline">{currentQuestion.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                  
                  {hintCount > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                        💡 Hints ({hintCount}/{currentQuestion.hints.length}):
                      </h3>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        {currentQuestion.hints.slice(0, hintCount).map((hint, index) => (
                          <li key={index}>• {hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Answer Input */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <form onSubmit={handleAnswerSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Your Answer:
                      </label>
                      <Input
                        ref={answerInputRef}
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        placeholder="Type your answer..."
                        disabled={!gameStarted}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">
                        💡 Ask for hints in chat!
                      </p>
                      <Button 
                        type="submit" 
                        disabled={!gameStarted || !answerInput.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Submit Answer
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
