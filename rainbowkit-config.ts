import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import {
  arbitrum,
  arbitrumSepolia,
  arbitrumGoerli,
  arbitrumNova,
} from 'wagmi/chains'; 


export const config = getDefaultConfig({
  appName: 'NIGHTHOUSE',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  chains: [arbitrum, arbitrumSepolia, arbitrumGoerli, arbitrumNova],
  transports: {
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_INFURA_ARBITRUM_RPC_URL),
    [arbitrumSepolia.id]: http(`https://arbitrum-sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`),
    [arbitrumGoerli.id]: http(`https://arbitrum-goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`),
    [arbitrumNova.id]: http(`https://arbitrum-nova.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`),
  },
  ssr: true, // If your dApp uses server side rendering (SSR)
});