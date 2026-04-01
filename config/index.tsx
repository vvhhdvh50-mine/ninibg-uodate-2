/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStorage, cookieStorage } from '@wagmi/core'
import type { Storage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bscTestnet, sepolia, polygonMumbai, AppKitNetwork, bsc, mainnet, polygon } from '@reown/appkit/networks'
import { isTestnet } from '@/constents'

// Get projectId from https://dashboard.reown.com
export const projectId = "d36262108f1be470f76cfedd2c92653c"

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const testNetwrks = [
  { ...bscTestnet, logo: 'https://res.cloudinary.com/dimofdvnt/image/upload/v1769481362/bnb_fkwllt.png' },
  { ...sepolia, logo: 'https://res.cloudinary.com/dimofdvnt/image/upload/v1769481362/eth_qg8tmm.png' },
  { ...polygonMumbai, logo: 'https://res.cloudinary.com/dimofdvnt/image/upload/v1773134176/Polygon_bgkmeo.png' }
] as unknown as [AppKitNetwork, ...AppKitNetwork[]]

const mainNetwrks = [
  { ...bsc, logo: 'https://res.cloudinary.com/dimofdvnt/image/upload/v1769481362/bnb_fkwllt.png' },
  { ...mainnet, logo: 'https://res.cloudinary.com/dimofdvnt/image/upload/v1769481362/eth_qg8tmm.png' },
  { ...polygon, logo: 'https://res.cloudinary.com/dimofdvnt/image/upload/v1773134176/Polygon_bgkmeo.png' }
] as unknown as [AppKitNetwork, ...AppKitNetwork[]]

export const networks = isTestnet ? testNetwrks : mainNetwrks

// Prefer localStorage on the client for WalletConnect deep links; fall back to cookies during SSR
const storage: Storage = (typeof window !== 'undefined'
  ? createStorage({ storage: window.localStorage })
  : createStorage({ storage: cookieStorage })) as any

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage,
  ssr: true,
  projectId,
  networks
})


export const config = wagmiAdapter.wagmiConfig