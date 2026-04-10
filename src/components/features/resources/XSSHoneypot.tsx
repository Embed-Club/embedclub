import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Info } from 'lucide-react'

interface XSSHoneypotProps {
  isDetected: boolean
}

const MESSAGES = [
  "Bhai, Kya Kar Raha Hai Tu?",
  "Bilkul Ricks Nahi Lene Ka!",
  "Choti Bachi Ho Kya?",
  "Nice Try, Par System Pagal Nahi Hai.",
  "Abhi Hum Zinda Hai!",
  "Control Uday Control...",
  "Abhe Chutiye",
  "Tere toothpaste mein namak hai?",
  "Bolo zubaan kesari"
]

export function XSSHoneypot({ isDetected }: XSSHoneypotProps) {
  const [msgIndex, setMsgIndex] = React.useState(0)

  React.useEffect(() => {
    if (isDetected) {
      setMsgIndex(Math.floor(Math.random() * MESSAGES.length))
    }
  }, [isDetected])

  return (
    <AnimatePresence>
      {isDetected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center py-32 text-center gap-6"
        >
          <Info className="w-12 h-12 text-zinc-500" />
          <h2 className="text-4xl md:text-6xl font-bold text-zinc-300 tracking-tighter uppercase">
            {MESSAGES[msgIndex]}
          </h2>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

