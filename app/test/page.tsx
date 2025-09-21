'use client'

import { useState } from 'react'
import { 
  type BaseError,
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const CONTRACT_ADDRESS = '0xA43fB3B793177F1c2352e7CE4Fe8fd725EefFab8'

const ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'num',
        type: 'uint256'
      }
    ],
    name: 'store',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'retrieve',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export default function TestPage() {
  const [storeValue, setStoreValue] = useState('')
  const { address, isConnected } = useAccount()
  
  // Read contract state
  const { data: retrievedValue, refetch: refetchValue, isLoading: isRetrieving } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'retrieve',
  })

  // Write to contract
  const { writeContract, data: hash, isPending: isStoring, error: writeError } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const handleStore = () => {
    if (!storeValue || !isConnected) return
    
    const numValue = parseInt(storeValue)
    if (isNaN(numValue) || numValue < 0) return
    
    console.log('Calling writeContract with:', {
      address: CONTRACT_ADDRESS,
      functionName: 'store',
      args: [BigInt(numValue)]
    })
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'store',
      args: [BigInt(numValue)],
    })
  }

  const handleRetrieve = () => {
    refetchValue()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Contract Test Interface</h1>
          <p className="text-muted-foreground mt-2">
            Test store/retrieve functions with wagmi
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Contract: {CONTRACT_ADDRESS}
          </p>
        </div>

        {!isConnected && (
          <Alert>
            <AlertDescription>
              Please connect your wallet to interact with the contract.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Store Function */}
          <Card>
            <CardHeader>
              <CardTitle>Store Value</CardTitle>
              <CardDescription>
                Write a number to the contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-input">Number to store</Label>
                <Input
                  id="store-input"
                  type="number"
                  placeholder="Enter a number"
                  value={storeValue}
                  onChange={(e) => setStoreValue(e.target.value)}
                  disabled={!isConnected}
                />
              </div>
              
              <Button
                onClick={handleStore}
                disabled={!isConnected || !storeValue || isStoring || isConfirming}
                className="w-full"
              >
                {isStoring ? 'Storing...' : isConfirming ? 'Confirming...' : 'Store'}
              </Button>

              {writeError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Error: {(writeError as BaseError).shortMessage || writeError.message}
                  </AlertDescription>
                </Alert>
              )}

              {hash && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Transaction Hash:</p>
                  <p className="font-mono text-xs break-all">{hash}</p>
                </div>
              )}

              {isConfirmed && (
                <Alert>
                  <AlertDescription>
                    ✅ Transaction confirmed! Value stored successfully.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Retrieve Function */}
          <Card>
            <CardHeader>
              <CardTitle>Retrieve Value</CardTitle>
              <CardDescription>
                Read the stored number from contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current stored value</Label>
                <div className="p-3 bg-muted rounded-md">
                  {isRetrieving ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <span className="font-mono text-lg">
                      {retrievedValue?.toString() || '0'}
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={handleRetrieve}
                disabled={isRetrieving}
                variant="outline"
                className="w-full"
              >
                {isRetrieving ? 'Retrieving...' : 'Refresh Value'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Wallet Connected:</span>
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              {address && (
                <div className="flex justify-between">
                  <span>Address:</span>
                  <span className="font-mono text-xs">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}