'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useState } from 'react'
import gameABI from '@/abis/gameabi.json'

// Contract address - you'll need to deploy and update this
const GAME_CONTRACT_ADDRESS = '0xA43fB3B793177F1c2352e7CE4Fe8fd725EefFab8' as const

export interface BlockchainGame {
  id: number
  question: string
  entryFee: bigint
  prizePool: bigint
  participants: string[]
  winner: string
  isActive: boolean
  isCompleted: boolean
  entryFeeEth?: string
  prizePoolEth?: string
}

export function useGameContract() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Contract write functions
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Read functions
  const { data: gameCount, refetch: refetchGameCount } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: gameABI,
    functionName: 'gameCount',
  })

  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: gameABI,
    functionName: 'contractBalance',
  })

  const { data: owner } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: gameABI,
    functionName: 'owner',
  })

  // Create a new blockchain game
  const createGame = async (question: string, answer: string, entryFeeEth: string) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return null
    }

    try {
      setError(null)
      setIsLoading(true)

      const entryFeeWei = parseEther(entryFeeEth)

      writeContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: gameABI,
        functionName: 'createGame',
        args: [question, answer, entryFeeWei],
      })

      return hash
    } catch (err: any) {
      setError(err.message || 'Failed to create game')
      setIsLoading(false)
      return null
    }
  }

  // Join a blockchain game
  const joinGame = async (gameId: number, entryFeeWei: bigint) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return null
    }

    try {
      setError(null)
      setIsLoading(true)

      writeContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: gameABI,
        functionName: 'joinGame',
        args: [BigInt(gameId)],
        value: entryFeeWei,
      })

      return hash
    } catch (err: any) {
      setError(err.message || 'Failed to join game')
      setIsLoading(false)
      return null
    }
  }

  // Submit answer to blockchain game
  const submitAnswer = async (gameId: number, answer: string) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return null
    }

    try {
      setError(null)
      setIsLoading(true)

      writeContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: gameABI,
        functionName: 'submitAnswer',
        args: [BigInt(gameId), answer],
      })

      return hash
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer')
      setIsLoading(false)
      return null
    }
  }

  // Complete game (owner only)
  const completeGame = async (gameId: number) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return null
    }

    try {
      setError(null)
      setIsLoading(true)

      writeContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: gameABI,
        functionName: 'verifyAndCompleteGame',
        args: [BigInt(gameId)],
      })

      return hash
    } catch (err: any) {
      setError(err.message || 'Failed to complete game')
      setIsLoading(false)
      return null
    }
  }

  // Claim prize
  const claimPrize = async (gameId: number) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return null
    }

    try {
      setError(null)
      setIsLoading(true)

      writeContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: gameABI,
        functionName: 'claimPrize',
        args: [BigInt(gameId)],
      })

      return hash
    } catch (err: any) {
      setError(err.message || 'Failed to claim prize')
      setIsLoading(false)
      return null
    }
  }

  // Get game details
  const getGame = async (gameId: number): Promise<BlockchainGame | null> => {
    try {
      const result = await fetch(`/api/contract/getGame?gameId=${gameId}`)
      if (!result.ok) throw new Error('Failed to fetch game')
      return await result.json()
    } catch (err: any) {
      setError(err.message || 'Failed to get game details')
      return null
    }
  }

  // Check if player has joined
  const hasPlayerJoined = async (gameId: number, playerAddress: string): Promise<boolean> => {
    try {
      const result = await fetch(`/api/contract/hasJoined?gameId=${gameId}&player=${playerAddress}`)
      if (!result.ok) throw new Error('Failed to check join status')
      const data = await result.json()
      return data.hasJoined
    } catch (err: any) {
      setError(err.message || 'Failed to check join status')
      return false
    }
  }

  // Check if player has submitted answer
  const hasPlayerSubmitted = async (gameId: number, playerAddress: string): Promise<boolean> => {
    try {
      const result = await fetch(`/api/contract/hasSubmitted?gameId=${gameId}&player=${playerAddress}`)
      if (!result.ok) throw new Error('Failed to check submission status')
      const data = await result.json()
      return data.hasSubmitted
    } catch (err: any) {
      setError(err.message || 'Failed to check submission status')
      return false
    }
  }

  // Reset transaction state
  const resetTransaction = () => {
    setError(null)
    setIsLoading(false)
  }

  // Update loading state when transaction is confirmed
  if (isConfirmed && isLoading) {
    setIsLoading(false)
  }

  return {
    // State
    isConnected,
    address,
    isLoading: isLoading || isPending || isConfirming,
    isConfirmed,
    error,
    hash,
    gameCount: gameCount ? Number(gameCount) : 0,
    contractBalance: contractBalance ? formatEther(contractBalance) : '0',
    isOwner: address === owner,

    // Functions
    createGame,
    joinGame,
    submitAnswer,
    completeGame,
    claimPrize,
    getGame,
    hasPlayerJoined,
    hasPlayerSubmitted,
    resetTransaction,

    // Refetch functions
    refetchGameCount,
    refetchBalance,
  }
}

export default useGameContract

