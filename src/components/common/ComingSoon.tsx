'use client'

import { motion } from 'motion/react'
import React from 'react'
import DecryptedText from './DecryptedText'

interface ComingSoonProps {
  title: string
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[60vh] space-y-8 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
         <span className="text-[20vw] font-black select-none tracking-tighter">
           {title.split('').filter(c => c !== '' && c !== '').join('')}
         </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="z-10 text-center space-y-4"
      >
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          <DecryptedText
            text={title}
            animateOn="view"
            revealDirection="center"
            speed={80}
            className="inline-block"
          />
        </h2>
        
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3, duration: 0.8 }}
           className="flex justify-center py-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 relative"
          >
            <img 
              src="/embedClubLogo-Dark.svg" 
              alt="Spinning Logo" 
              className="w-full h-full object-contain hidden dark:block"
            />
             <img 
              src="/embedClubLogo-Light.svg" 
              alt="Spinning Logo" 
              className="w-full h-full object-contain dark:hidden"
            />
          </motion.div>
        </motion.div>

      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 flex flex-col items-center space-y-2 opacity-50"
      >
        <div className="text-[10px] tracking-[0.3em] font-bold uppercase">System Status: Awaiting Implementation</div>
        <div className="flex gap-1">
          {[1,2,3].map((i) => (
            <motion.div 
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ delay: i * 0.2, duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-foreground rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
