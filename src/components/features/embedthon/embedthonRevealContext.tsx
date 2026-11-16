'use client'

import type React from 'react'
import { createContext, useContext, useState } from 'react'

interface EmbedthonRevealContextValue {
  isRevealed: boolean
  setRevealed: (revealed: boolean) => void
}

const EmbedthonRevealContext = createContext<EmbedthonRevealContextValue>({
  isRevealed: false,
  setRevealed: () => {},
})

export function EmbedthonRevealProvider({ children }: { children: React.ReactNode }) {
  const [isRevealed, setRevealed] = useState(false)

  return (
    <EmbedthonRevealContext.Provider value={{ isRevealed, setRevealed }}>
      {children}
    </EmbedthonRevealContext.Provider>
  )
}

export function useEmbedthonReveal() {
  return useContext(EmbedthonRevealContext)
}
