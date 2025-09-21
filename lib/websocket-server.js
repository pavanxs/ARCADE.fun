import { Server as SocketIOServer } from 'socket.io'

class WebSocketServer {
  constructor() {
    this.io = null
    this.rooms = new Map()
    this.playerRooms = new Map() // socketId -> roomId
  }

  initialize(httpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
    })

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      // Handle room creation
      socket.on('create-room', (data) => {
        this.handleCreateRoom(socket, data)
      })

      // Handle joining room
      socket.on('join-room', (data) => {
        this.handleJoinRoom(socket, data)
      })

      // Handle leaving room
      socket.on('leave-room', () => {
        this.handleLeaveRoom(socket)
      })

      // Handle player ready state
      socket.on('toggle-ready', () => {
        this.handleToggleReady(socket)
      })

      // Handle starting game
      socket.on('start-game', () => {
        this.handleStartGame(socket)
      })

      // Handle game actions
      socket.on('game-action', (data) => {
        this.handleGameAction(socket, data)
      })

      // Handle chat messages
      socket.on('chat-message', (data) => {
        this.handleChatMessage(socket, data)
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
        this.handleLeaveRoom(socket)
      })

      // Send current rooms list
      socket.emit('rooms-list', this.getRoomsList())
    })
  }

  handleCreateRoom(socket, data) {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const player = {
      id: `player_${socket.id}`,
      username: data.username,
      avatar: data.username[0].toUpperCase(),
      isHost: true,
      isReady: true,
      socketId: socket.id,
      score: 0
    }

    const room = {
      id: roomId,
      name: data.roomName,
      gameType: data.gameType,
      host: data.username,
      players: [player],
      maxPlayers: data.maxPlayers,
      gameStarted: false,
      gameState: this.getInitialGameState(data.gameType),
      settings: data.settings,
      createdAt: new Date()
    }

    this.rooms.set(roomId, room)
    this.playerRooms.set(socket.id, roomId)
    
    socket.join(roomId)
    socket.emit('room-created', { roomId, room })
    socket.emit('room-state', room)
    
    // Broadcast updated rooms list
    this.io?.emit('rooms-list', this.getRoomsList())
    
    console.log(`Room created: ${roomId} by ${data.username}`)
  }

  handleJoinRoom(socket, data) {
    const room = this.rooms.get(data.roomId)
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' })
      return
    }

    if (room.gameStarted) {
      socket.emit('error', { message: 'Game already started' })
      return
    }

    // Check if player already in room
    const existingPlayer = room.players.find(p => p.socketId === socket.id)
    if (existingPlayer) {
      socket.emit('room-state', room)
      return
    }

    const player = {
      id: `player_${socket.id}`,
      username: data.username,
      avatar: data.username[0].toUpperCase(),
      isHost: false,
      isReady: false,
      socketId: socket.id,
      score: 0
    }

    room.players.push(player)
    this.playerRooms.set(socket.id, data.roomId)
    
    socket.join(data.roomId)
    
    // Notify all players in room
    this.io?.to(data.roomId).emit('player-joined', { player, room })
    this.io?.to(data.roomId).emit('room-state', room)
    
    // Update rooms list
    this.io?.emit('rooms-list', this.getRoomsList())
    
    console.log(`${data.username} joined room: ${data.roomId}`)
  }

  handleLeaveRoom(socket) {
    const roomId = this.playerRooms.get(socket.id)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id)
    if (playerIndex === -1) return

    const player = room.players[playerIndex]
    room.players.splice(playerIndex, 1)
    this.playerRooms.delete(socket.id)
    
    socket.leave(roomId)

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomId)
      console.log(`Room deleted: ${roomId}`)
    } else {
      // If host left, assign new host
      if (player.isHost && room.players.length > 0) {
        room.players[0].isHost = true
        room.host = room.players[0].username
      }
      
      // Notify remaining players
      this.io?.to(roomId).emit('player-left', { player, room })
      this.io?.to(roomId).emit('room-state', room)
    }

    // Update rooms list
    this.io?.emit('rooms-list', this.getRoomsList())
    
    console.log(`${player.username} left room: ${roomId}`)
  }

  handleToggleReady(socket) {
    const roomId = this.playerRooms.get(socket.id)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    const player = room.players.find(p => p.socketId === socket.id)
    if (!player || player.isHost) return

    player.isReady = !player.isReady
    
    this.io?.to(roomId).emit('player-ready-changed', { player, room })
    this.io?.to(roomId).emit('room-state', room)
    
    console.log(`${player.username} ready state: ${player.isReady}`)
  }

  handleStartGame(socket) {
    const roomId = this.playerRooms.get(socket.id)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    const player = room.players.find(p => p.socketId === socket.id)
    if (!player || !player.isHost) {
      socket.emit('error', { message: 'Only host can start the game' })
      return
    }

    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady || p.isHost)
    if (!allReady) {
      socket.emit('error', { message: 'All players must be ready' })
      return
    }

    room.gameStarted = true
    room.gameState = this.getInitialGameState(room.gameType)
    
    this.io?.to(roomId).emit('game-started', { room })
    this.io?.to(roomId).emit('room-state', room)
    this.io?.emit('rooms-list', this.getRoomsList())
    
    console.log(`Game started in room: ${roomId}`)
  }

  handleGameAction(socket, data) {
    const roomId = this.playerRooms.get(socket.id)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room || !room.gameStarted) return

    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return

    // Process game-specific actions
    this.processGameAction(room, player, data)
    
    // Broadcast updated game state
    this.io?.to(roomId).emit('game-state-updated', { room, action: data })
    this.io?.to(roomId).emit('room-state', room)
  }

  handleChatMessage(socket, data) {
    const roomId = this.playerRooms.get(socket.id)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return

    const chatMessage = {
      id: `msg_${Date.now()}`,
      username: player.username,
      message: data.message,
      timestamp: new Date(),
      type: 'user'
    }

    this.io?.to(roomId).emit('chat-message', chatMessage)
    
    // Check for game-specific chat commands
    this.processChatCommand(room, player, data.message)
  }

  processGameAction(room, player, action) {
    switch (room.gameType) {
      case 'trivia':
        this.processTriviaAction(room, player, action)
        break
      case 'wordpuzzle':
        this.processWordPuzzleAction(room, player, action)
        break
      case 'mines':
        this.processMinesAction(room, player, action)
        break
      case 'mafia':
        this.processMafiaAction(room, player, action)
        break
      case 'guess':
        this.processGuessAction(room, player, action)
        break
      case 'spy':
        this.processSpyAction(room, player, action)
        break
    }
  }

  processTriviaAction(room, player, action) {
    if (action.type === 'submit-answer') {
      const isCorrect = action.answer.toLowerCase().trim() === room.gameState.currentQuestion?.correctAnswer.toLowerCase()
      
      if (isCorrect) {
        const points = Math.max(10 - (room.gameState.hintsUsed || 0) * 2, 2)
        player.score = (player.score || 0) + points
        
        // Move to next question
        room.gameState.currentQuestionIndex = (room.gameState.currentQuestionIndex || 0) + 1
        room.gameState.hintsUsed = 0
        
        this.io?.to(room.id).emit('answer-correct', { 
          player: player.username, 
          answer: action.answer, 
          points 
        })
      } else {
        this.io?.to(room.id).emit('answer-incorrect', { 
          player: player.username, 
          answer: action.answer 
        })
      }
    }
  }

  processWordPuzzleAction(room, player, action) {
    if (action.type === 'word-found') {
      const word = action.word.toUpperCase()
      if (room.gameState.hiddenWords.includes(word) && !room.gameState.foundWords.includes(word)) {
        room.gameState.foundWords.push(word)
        const points = word.length * 10
        player.score = (player.score || 0) + points
        
        this.io?.to(room.id).emit('word-found', { 
          player: player.username, 
          word, 
          points 
        })
      }
    }
  }

  processMinesAction(room, player, action) {
    if (action.type === 'cell-reveal' || action.type === 'cell-flag') {
      // Update game state based on mines action
      room.gameState.lastAction = {
        player: player.username,
        type: action.type,
        row: action.row,
        col: action.col,
        timestamp: new Date()
      }
    }
  }

  processMafiaAction(room, player, action) {
    if (action.type === 'vote') {
      room.gameState.votes = room.gameState.votes || {}
      room.gameState.votes[player.id] = action.target
    } else if (action.type === 'night-action') {
      room.gameState.nightActions = room.gameState.nightActions || {}
      room.gameState.nightActions[player.id] = action
    }
  }

  processGuessAction(room, player, action) {
    if (action.type === 'submit-guess') {
      const isCorrect = action.guess.toLowerCase().trim() === room.gameState.currentAnswer?.toLowerCase()
      
      if (isCorrect) {
        const points = Math.max(100 - (room.gameState.timeElapsed || 0), 10)
        player.score = (player.score || 0) + points
        
        this.io?.to(room.id).emit('guess-correct', { 
          player: player.username, 
          guess: action.guess, 
          points 
        })
      }
    }
  }

  processSpyAction(room, player, action) {
    if (action.type === 'vote-spy') {
      room.gameState.spyVotes = room.gameState.spyVotes || {}
      room.gameState.spyVotes[player.id] = action.target
    }
  }

  processChatCommand(room, player, message) {
    if (room.gameType === 'trivia' && message.toLowerCase().includes('hint')) {
      room.gameState.hintsUsed = (room.gameState.hintsUsed || 0) + 1
      const currentQuestion = room.gameState.currentQuestion
      
      if (currentQuestion && room.gameState.hintsUsed <= currentQuestion.hints.length) {
        const hint = currentQuestion.hints[room.gameState.hintsUsed - 1]
        
        this.io?.to(room.id).emit('chat-message', {
          id: `hint_${Date.now()}`,
          username: 'System',
          message: `💡 Hint ${room.gameState.hintsUsed}: ${hint}`,
          timestamp: new Date(),
          type: 'system'
        })
      }
    }
  }

  getInitialGameState(gameType) {
    switch (gameType) {
      case 'trivia':
        return {
          currentQuestionIndex: 0,
          hintsUsed: 0,
          timeLeft: 30
        }
      case 'wordpuzzle':
        return {
          foundWords: [],
          hiddenWords: ['CAT', 'DOG', 'BIRD', 'MOUSE', 'ELEPHANT'],
          timeLeft: 300
        }
      case 'mines':
        return {
          grid: [],
          gameStatus: 'playing',
          timeElapsed: 0
        }
      case 'mafia':
        return {
          phase: 'day',
          votes: {},
          nightActions: {},
          timeLeft: 300
        }
      case 'guess':
        return {
          currentRound: 1,
          currentAnswer: '',
          timeLeft: 60
        }
      case 'spy':
        return {
          phase: 'discussion',
          spyVotes: {},
          timeLeft: 480
        }
      default:
        return {}
    }
  }

  getRoomsList() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      gameType: room.gameType,
      host: room.host,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      gameStarted: room.gameStarted,
      createdAt: room.createdAt
    }))
  }

  getIO() {
    return this.io
  }
}

const websocketServer = new WebSocketServer()

module.exports = { websocketServer }
