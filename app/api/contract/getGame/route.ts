import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { arbitrum } from 'viem/chains'
import gameABI from '@/abis/gameabi.json'

const GAME_CONTRACT_ADDRESS = '0xA43fB3B793177F1c2352e7CE4Fe8fd725EefFab8' as const

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http()
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gameId = searchParams.get('gameId')

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID is required' }, { status: 400 })
  }

  try {
    const result = await publicClient.readContract({
      address: GAME_CONTRACT_ADDRESS,
      abi: gameABI,
      functionName: 'getGame',
      args: [BigInt(gameId)],
    }) as [string, bigint, bigint, string[], string, boolean, boolean]

    const [question, entryFee, prizePool, participants, winner, isActive, isCompleted] = result

    return NextResponse.json({
      id: parseInt(gameId),
      question,
      entryFee: entryFee.toString(),
      prizePool: prizePool.toString(),
      participants,
      winner,
      isActive,
      isCompleted
    })
  } catch (error: unknown) {
    console.error('Error fetching game:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}

