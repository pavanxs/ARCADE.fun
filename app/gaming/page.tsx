'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

// Game data interfaces
interface Player {
  id: string
  username: string
  level: number
  xp: number
  maxXp: number
  wins: number
  losses: number
  isOnline: boolean
  color: string
}

interface GameRoom {
  id: string
  name: string
  players: number
  maxPlayers: number
  gameType: string
  difficulty: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  maxProgress: number
}

// Color palette for players (same as chat)
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

export default function SocialGaming() {
  const [currentPlayer] = useState<Player>({
    id: '1',
    username: 'Player1',
    level: 15,
    xp: 750,
    maxXp: 1000,
    wins: 42,
    losses: 18,
    isOnline: true,
    color: '#2563eb'
  })

  const [gameRooms] = useState<GameRoom[]>([
    { id: '1', name: 'Crypto Warriors Arena', players: 6, maxPlayers: 8, gameType: 'Battle', difficulty: 'Hard' },
    { id: '2', name: 'DeFi Strategy Zone', players: 4, maxPlayers: 6, gameType: 'Strategy', difficulty: 'Medium' },
    { id: '3', name: 'NFT Trading Hub', players: 12, maxPlayers: 16, gameType: 'Trading', difficulty: 'Easy' },
    { id: '4', name: 'Blockchain Puzzle', players: 3, maxPlayers: 4, gameType: 'Puzzle', difficulty: 'Hard' },
  ])

  const [leaderboard] = useState<Player[]>([
    { id: '2', username: 'CryptoKing', level: 28, xp: 2800, maxXp: 3000, wins: 156, losses: 44, isOnline: true, color: getUserColor('CryptoKing') },
    { id: '3', username: 'DeFiQueen', level: 25, xp: 2100, maxXp: 2500, wins: 134, losses: 32, isOnline: true, color: getUserColor('DeFiQueen') },
    { id: '4', username: 'NFTMaster', level: 22, xp: 1800, maxXp: 2200, wins: 98, losses: 27, isOnline: false, color: getUserColor('NFTMaster') },
    { id: '5', username: 'BlockchainWiz', level: 20, xp: 1200, maxXp: 2000, wins: 87, losses: 23, isOnline: true, color: getUserColor('BlockchainWiz') },
    { id: '1', username: 'Player1', level: 15, xp: 750, maxXp: 1000, wins: 42, losses: 18, isOnline: true, color: getUserColor('Player1') },
  ])

  const [achievements] = useState<Achievement[]>([
    { id: '1', title: 'First Victory', description: 'Win your first game', icon: '🏆', unlocked: true, progress: 1, maxProgress: 1 },
    { id: '2', title: 'Winning Streak', description: 'Win 10 games in a row', icon: '🔥', unlocked: true, progress: 10, maxProgress: 10 },
    { id: '3', title: 'Social Butterfly', description: 'Play with 50 different players', icon: '🦋', unlocked: false, progress: 32, maxProgress: 50 },
    { id: '4', title: 'Level Master', description: 'Reach level 25', icon: '⭐', unlocked: false, progress: 15, maxProgress: 25 },
  ])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500'
      case 'Medium': return 'bg-yellow-500'
      case 'Hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getGameTypeIcon = (gameType: string) => {
    switch (gameType) {
      case 'Battle': return '⚔️'
      case 'Strategy': return '🧠'
      case 'Trading': return '💰'
      case 'Puzzle': return '🧩'
      default: return '🎮'
    }
  }

  return (
    <div className="min-h-screen bg-purple-100 dark:bg-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-red-600 dark:text-red-400 mb-2">
            🎮 Arbit-Oh Gaming Hub
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect, compete, and conquer in the ultimate social gaming experience
          </p>
        </div>

        {/* Player Stats Header */}
        <Card className="mb-6 bg-purple-50 dark:bg-purple-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg font-bold" style={{ backgroundColor: currentPlayer.color + '20', color: currentPlayer.color }}>
                    {currentPlayer.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{currentPlayer.username}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="default">Level {currentPlayer.level}</Badge>
                    <Badge variant={currentPlayer.isOnline ? "default" : "secondary"}>
                      {currentPlayer.isOnline ? "🟢 Online" : "⚫ Offline"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">XP Progress</div>
                <Progress value={(currentPlayer.xp / currentPlayer.maxXp) * 100} className="w-48 mb-2" />
                <div className="text-xs text-muted-foreground">{currentPlayer.xp} / {currentPlayer.maxXp} XP</div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-green-600 font-semibold">Wins: {currentPlayer.wins}</span>
                  <span className="text-red-600 font-semibold">Losses: {currentPlayer.losses}</span>
                  <span className="text-blue-600 font-semibold">W/L: {(currentPlayer.wins / (currentPlayer.wins + currentPlayer.losses)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Gaming Interface */}
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-gray-800/50">
            <TabsTrigger value="rooms">🏠 Game Rooms</TabsTrigger>
            <TabsTrigger value="leaderboard">🏆 Leaderboard</TabsTrigger>
            <TabsTrigger value="achievements">🎖️ Achievements</TabsTrigger>
            <TabsTrigger value="profile">👤 Profile</TabsTrigger>
          </TabsList>

          {/* Game Rooms Tab */}
          <TabsContent value="rooms">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameRooms.map((room) => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getGameTypeIcon(room.gameType)} {room.name}
                      </CardTitle>
                      <Badge className={`${getDifficultyColor(room.difficulty)} text-white`}>
                        {room.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Game Type:</span>
                        <span className="font-semibold">{room.gameType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Players:</span>
                        <span className="font-semibold">{room.players}/{room.maxPlayers}</span>
                      </div>
                      <Progress value={(room.players / room.maxPlayers) * 100} className="h-2" />
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={room.players >= room.maxPlayers}
                      >
                        {room.players >= room.maxPlayers ? "Room Full" : "Join Game"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                🎮 Create New Room
              </Button>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">🏆 Global Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {leaderboard.map((player, index) => (
                      <div 
                        key={player.id}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          player.id === currentPlayer.id 
                            ? 'bg-purple-50 dark:bg-purple-900/30' 
                            : 'bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        <div className="text-2xl font-bold min-w-[40px]">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && `#${index + 1}`}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarFallback style={{ backgroundColor: player.color + '20', color: player.color }}>
                            {player.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{player.username}</span>
                            {player.id === currentPlayer.id && <Badge variant="secondary">You</Badge>}
                            <Badge variant={player.isOnline ? "default" : "secondary"} className="ml-auto">
                              {player.isOnline ? "🟢" : "⚫"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Level {player.level}</span>
                            <span>{player.wins}W / {player.losses}L</span>
                            <span>WR: {((player.wins / (player.wins + player.losses)) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{player.xp.toLocaleString()} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement) => (
                <Card 
                  key={achievement.id} 
                  className={`${achievement.unlocked 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'opacity-75'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{achievement.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{achievement.description}</p>
                        {!achievement.unlocked && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                          </div>
                        )}
                        {achievement.unlocked && (
                          <Badge className="bg-yellow-600 text-white">
                            ✅ Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Player Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{currentPlayer.wins}</div>
                      <div className="text-sm text-muted-foreground">Total Wins</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{currentPlayer.losses}</div>
                      <div className="text-sm text-muted-foreground">Total Losses</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{currentPlayer.level}</div>
                      <div className="text-sm text-muted-foreground">Current Level</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{currentPlayer.xp.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total XP</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {[
                        { action: 'Won a battle', game: 'Crypto Warriors Arena', time: '2 minutes ago', type: 'win' },
                        { action: 'Joined room', game: 'DeFi Strategy Zone', time: '15 minutes ago', type: 'join' },
                        { action: 'Unlocked achievement', game: 'Winning Streak', time: '1 hour ago', type: 'achievement' },
                        { action: 'Lost a match', game: 'NFT Trading Hub', time: '2 hours ago', type: 'loss' },
                        { action: 'Leveled up to 15', game: 'System', time: '1 day ago', type: 'levelup' },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="text-lg">
                            {activity.type === 'win' && '🏆'}
                            {activity.type === 'loss' && '💔'}
                            {activity.type === 'join' && '🚪'}
                            {activity.type === 'achievement' && '🎖️'}
                            {activity.type === 'levelup' && '⬆️'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{activity.action}</div>
                            <div className="text-sm text-muted-foreground">{activity.game}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{activity.time}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
