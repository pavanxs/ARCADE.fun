import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Image 
              src="/game-images/logo/arcade_transparent_removed.png" 
              alt="Arbit-Oh Logo" 
              width={160} 
              height={160}
              className="object-contain"
            />
          </div>
          <div className="flex items-center ml-auto">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
