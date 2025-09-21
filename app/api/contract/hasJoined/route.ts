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
  const player = searchParams.get('player')

  if (!gameId || !player) {
    return NextResponse.json({ error: 'Game ID and player address are required' }, { status: 400 })
  }

  try {
    const hasJoined = await publicClient.readContract({
      address: GAME_CONTRACT_ADDRESS,
      abi: gameABI,
      functionName: 'hasPlayerJoined',
      args: [BigInt(gameId), player as `0x${string}`],
    })

    return NextResponse.json({ hasJoined })
  } catch (error: unknown) {
    console.error('Error checking join status:', error)
    return NextResponse.json({ error: 'Failed to check join status' }, { status: 500 })
  }
}

