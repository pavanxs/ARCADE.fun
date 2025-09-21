'use client'

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

const freeGames = [
  { src: "/game-images/Frame 5.png", alt: "Hybrid Trivia", route: "/trivia-ws" },
  { src: "/game-images/Frame 16.png", alt: "WordPuzzle", route: "/wordpuzzle" },
  { src: "/game-images/Frame 17.png", alt: "Mines", route: "/mines" },
  { src: "/game-images/Frame 18.png", alt: "Online Mafia", route: "/mafia" },
  { src: "/game-images/Frame 19.png", alt: "Guess the Thing", route: "/guess" },
  { src: "/game-images/Frame 20.png", alt: "Act Like You Belong", route: "/act-belong" },
  { src: "/game-images/Frame 22.png", alt: "Find the Spy", route: "/spy" },
];

const paidGames = [
  { src: "/game-images/Frame 23.png", alt: "Deception Protocol", route: "/deception" },
  { src: "/game-images/Frame 24.png", alt: "Trust", route: "/trust" },
  { src: "/game-images/Frame 26.png", alt: "Bluff and Bet", route: "/bluff-bet" },
  { src: "/game-images/Frame 27.png", alt: "Elite Roulette", route: "/trivia" },
  { src: "/game-images/Frame 29.png", alt: "Diamond Baccarat", route: "/trivia" },
  { src: "/game-images/Frame 30.png", alt: "Platinum Craps", route: "/trivia" },
];

export default function Home() {
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const router = useRouter();

  const GameCard = ({ game, section, index }: { game: { src: string; alt: string; route?: string }, section: string, index: number }) => {
    const cardId = `${section}-${index}`;
    
    return (
      <div
        className="group relative cursor-pointer"
        onMouseEnter={() => setHoveredIndex(cardId)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => router.push(game.route || '/trivia')}
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