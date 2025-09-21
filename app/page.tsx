'use client'

import Image from "next/image";
import { useState } from "react";

const freeGames = [
  { src: "/game-images/Frame 5.png", alt: "Crypto Slots" },
  { src: "/game-images/Frame 16.png", alt: "DeFi Poker" },
  { src: "/game-images/Frame 17.png", alt: "NFT Blackjack" },
  { src: "/game-images/Frame 18.png", alt: "Blockchain Roulette" },
  { src: "/game-images/Frame 19.png", alt: "Token Bingo" },
  { src: "/game-images/Frame 20.png", alt: "Crypto Dice" },
  { src: "/game-images/Frame 22.png", alt: "Web3 Lottery" },
];

const paidGames = [
  { src: "/game-images/Frame 23.png", alt: "High Stakes Poker" },
  { src: "/game-images/Frame 24.png", alt: "Premium Slots" },
  { src: "/game-images/Frame 26.png", alt: "VIP Blackjack" },
  { src: "/game-images/Frame 27.png", alt: "Elite Roulette" },
  { src: "/game-images/Frame 29.png", alt: "Diamond Baccarat" },
  { src: "/game-images/Frame 30.png", alt: "Platinum Craps" },
];

export default function Home() {
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);

  const GameCard = ({ game, section, index }: { game: { src: string; alt: string }, section: string, index: number }) => {
    const cardId = `${section}-${index}`;
    
    return (
      <div
        className="group relative cursor-pointer"
        onMouseEnter={() => setHoveredIndex(cardId)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div className="relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-primary/50">
          <Image
            src={game.src}
            alt={game.alt}
            width={300}
            height={200}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-110"
            priority={section === 'free' && index < 4}
          />
          <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            hoveredIndex === cardId ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
          }`} />
          {section === 'paid' && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-md text-xs font-bold">
              💎 PREMIUM
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Free to Play Games Section */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">🎮 Free to Play</h2>
            <div className="ml-3 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
              {freeGames.length} Games
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {freeGames.map((game, index) => (
              <GameCard key={index} game={game} section="free" index={index} />
            ))}
          </div>
        </div>

        {/* Paid Games Section */}
        <div>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">💎 Premium Games</h2>
            <div className="ml-3 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
              {paidGames.length} Games
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {paidGames.map((game, index) => (
              <GameCard key={index} game={game} section="paid" index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}