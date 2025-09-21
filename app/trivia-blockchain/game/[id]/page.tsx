'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Users, Trophy, Crown, Wallet, Coins, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatEther } from 'viem'
import useGameContract, { BlockchainGame } from '@/hooks/useGameContract'

export default function BlockchainTriviaGame() {
  const router = useRouter()
  const params = useParams()
  const gameId = parseInt(params.id as string)
  
  const {
    isConnected,
    address,
    isLoading,
    error,
    isOwner,
    joinGame,
    submitAnswer,
    completeGame,
    claimPrize,
    getGame,
    hasPlayerJoined,
    hasPlayerSubmitted,
    resetTransaction,
    isConfirmed
  } = useGameContract()

  const [game, setGame] = useState<BlockchainGame | null>(null)
  const [answerInput, setAnswerInput] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gameStatus, setGameStatus] = useState<'loading' | 'active' | 'completed' | 'error'>('loading')

  // Load game data
  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId || isNaN(gameId)) {
        setGameStatus('error')
        return
      }

      try {
        const gameData = await getGame(gameId)
        if (!gameData) {
          setGameStatus('error')
          return
        }

        setGame({
          ...gameData,
          entryFeeEth: formatEther(BigInt(gameData.entryFee)),
          prizePoolEth: formatEther(BigInt(gameData.prizePool))
        })

        if (gameData.isCompleted) {
          setGameStatus('completed')
        } else if (gameData.isActive) {
          setGameStatus('active')
        } else {
          setGameStatus('error')
        }

        // Check player status
        if (isConnected && address) {
          const joined = await hasPlayerJoined(gameId, address)
          const submitted = await hasPlayerSubmitted(gameId, address)
          setHasJoined(joined)
          setHasSubmitted(submitted)
        }
      } catch (error) {
        console.error('Error loading game:', error)
        setGameStatus('error')
      }
    }

    loadGameData()
  }, [gameId, getGame, hasPlayerJoined, hasPlayerSubmitted, isConnected, address])

  // Refresh data when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }, [isConfirmed])

  const handleJoinGame = async () => {
    if (!game || !isConnected) return

    try {
      resetTransaction()
      await joinGame(gameId, BigInt(game.entryFee))
    } catch (error) {
      console.error('Error joining game:', error)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim() || !isConnected || isSubmitting) return

    try {
      setIsSubmitting(true)
      resetTransaction()
      await submitAnswer(gameId, answerInput.trim())
      setAnswerInput('')
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteGame = async () => {
    if (!isConnected || !isOwner) return

    try {
      resetTransaction()
      await completeGame(gameId)
    } catch (error) {
      console.error('Error completing game:', error)
    }
  }

  const handleClaimPrize = async () => {
    if (!isConnected || !game) return

    try {
      resetTransaction()
      await claimPrize(gameId)
    } catch (error) {
      console.error('Error claiming prize:', error)
    }
  }

  const handleLeaveGame = () => {
    router.push('/trivia-blockchain')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Wallet Required</h3>
            <p className="text-muted-foreground mb-4">Please connect your wallet to play blockchain trivia games.</p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Loading Game...</h3>
            <p className="text-muted-foreground">Please wait while we load the blockchain game data.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameStatus === 'error' || !game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold mb-2">Game Not Found</h3>
            <p className="text-muted-foreground mb-4">The blockchain game you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
            <Button onClick={handleLeaveGame}>
              Back to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isWinner = game.winner === address
  const canClaimPrize = gameStatus === 'completed' && isWinner && game.prizePool > 0

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

        {/* Success Message */}
        {isConfirmed && (
          <div className="mb-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Transaction confirmed! The page will refresh shortly.</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLeaveGame}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">Blockchain Trivia Game #{gameId}</h1>
                <Badge className={gameStatus === 'completed' ? 'bg-blue-500' : 'bg-green-500'}>
                  {gameStatus === 'completed' ? 'Completed' : 'Active'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="w-4 h-4" />
                <span>Entry: {game.entryFeeEth} ETH</span>
                <span>•</span>
                <span>Prize: {game.prizePoolEth} ETH</span>
                <span>•</span>
                <span>{game.participants.length} players</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Question Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📝 Trivia Question</span>
                  <div className="flex items-center gap-2">
                    {hasJoined && (
                      <Badge variant="outline" className="bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Joined
                      </Badge>
                    )}
                    {hasSubmitted && (
                      <Badge variant="outline" className="bg-blue-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Submitted
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-6">{game.question}</p>
                
                {!hasJoined ? (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Pay the entry fee to join this game and submit your answer.
                    </p>
                    <Button 
                      onClick={handleJoinGame}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Join Game ({game.entryFeeEth} ETH)
                        </>
                      )}
                    </Button>
                  </div>
                ) : !hasSubmitted && gameStatus === 'active' ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your answer..."
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        disabled={isSubmitting || isLoading}
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSubmitAnswer()
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSubmitAnswer}
                        disabled={!answerInput.trim() || isSubmitting || isLoading}
                      >
                        {isSubmitting || isLoading ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Answer'
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      💡 Your answer will be stored securely on the blockchain as a hash.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    {hasSubmitted && gameStatus === 'active' && (
                      <div>
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold mb-2">Answer Submitted!</h3>
                        <p className="text-muted-foreground">
                          Your answer has been recorded on the blockchain. Wait for the game owner to complete the game.
                        </p>
                      </div>
                    )}
                    
                    {gameStatus === 'completed' && (
                      <div>
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                        <h3 className="text-lg font-semibold mb-2">Game Completed!</h3>
                        {game.winner === '0x0000000000000000000000000000000000000000' ? (
                          <p className="text-muted-foreground">No one got the correct answer. All entry fees have been refunded.</p>
                        ) : isWinner ? (
                          <div>
                            <p className="text-green-600 font-semibold mb-2">🎉 Congratulations! You won!</p>
                            {canClaimPrize && (
                              <Button onClick={handleClaimPrize} disabled={isLoading} size="lg">
                                {isLoading ? (
                                  <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                    Claiming...
                                  </>
                                ) : (
                                  <>
                                    <Trophy className="w-4 h-4 mr-2" />
                                    Claim Prize ({game.prizePoolEth} ETH)
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Winner: {game.winner.slice(0, 6)}...{game.winner.slice(-4)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Controls */}
            {isOwner && gameStatus === 'active' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Owner Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      As the game owner, you can complete the game to determine the winner and distribute prizes.
                    </p>
                    <Button 
                      onClick={handleCompleteGame}
                      disabled={isLoading}
                      variant="secondary"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Game
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                  <span>Game ID:</span>
                  <span>#{gameId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Entry Fee:</span>
                  <span>{game.entryFeeEth} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Prize Pool:</span>
                  <span className="font-bold text-green-600">{game.prizePoolEth} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Players:</span>
                  <span>{game.participants.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge className={gameStatus === 'completed' ? 'bg-blue-500' : 'bg-green-500'}>
                    {gameStatus === 'completed' ? 'Completed' : 'Active'}
                  </Badge>
                </div>
                {game.winner !== '0x0000000000000000000000000000000000000000' && (
                  <div className="flex justify-between text-sm">
                    <span>Winner:</span>
                    <span className="font-mono text-xs">
                      {game.winner.slice(0, 6)}...{game.winner.slice(-4)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Players List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants ({game.participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {game.participants.map((participant) => (
                    <div key={participant} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {participant.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-mono text-sm">
                            {participant.slice(0, 6)}...{participant.slice(-4)}
                            {participant === address && <span className="text-xs text-primary ml-1">(You)</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {participant === game.winner && gameStatus === 'completed' && (
                          <Trophy className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Pay entry fee to join the game</p>
                <p>• Submit your answer (stored as hash)</p>
                <p>• Owner completes game to determine winner</p>
                <p>• Winner gets the entire prize pool</p>
                <p>• All transactions are on-chain</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

