'use client'

import { buildHex } from '@/lib/microbit/hexBuilder'
import {
  type ConnectionStatus,
  type ConnectionStatusChange,
  DeviceError,
  type ProgressStage,
} from '@microbit/microbit-connection'
import { type MicrobitUSBConnection, createUSBConnection } from '@microbit/microbit-connection/usb'
import { useCallback, useEffect, useRef, useState } from 'react'

export type FlashState =
  | { phase: 'idle' }
  | { phase: 'building' }
  | { phase: 'flashing'; stage: ProgressStage; progress: number }
  | { phase: 'done' }
  | { phase: 'error'; message: string }

export interface SerialLine {
  id: number
  text: string
}

const MAX_SERIAL_LINES = 500

/**
 * One micro:bit over WebUSB: pair, flash a script, read what it prints.
 *
 * Wraps the micro:bit Foundation's connection library so the editor only
 * deals in React state. Serial output starts flowing on its own once the
 * library sees a `serialdata` listener, so the console works without a
 * separate "open serial" step.
 */
export function useMicrobitUsb() {
  const connectionRef = useRef<MicrobitUSBConnection | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('NoAuthorizedDevice')
  const [boardVersion, setBoardVersion] = useState<'V1' | 'V2' | null>(null)
  const [flash, setFlash] = useState<FlashState>({ phase: 'idle' })
  const [serial, setSerial] = useState<SerialLine[]>([])
  const serialIdRef = useRef(0)
  const partialLineRef = useRef('')

  useEffect(() => {
    if (!('usb' in navigator)) {
      setSupported(false)
      return
    }
    setSupported(true)

    const connection = createUSBConnection()
    connectionRef.current = connection

    const onStatus = ({ status }: ConnectionStatusChange) => {
      setStatus(status)
      if (status === 'Connected') {
        setBoardVersion(connection.getBoardVersion())
      } else if (status === 'Disconnected' || status === 'NoAuthorizedDevice') {
        setBoardVersion(null)
      }
    }

    // The board sends whatever it has, not whole lines - keep the tail until
    // a newline closes it so the console never shows a word split in two.
    const onSerial = ({ data }: { data: string }) => {
      const text = partialLineRef.current + data
      const lines = text.split(/\r?\n/)
      partialLineRef.current = lines.pop() ?? ''
      if (lines.length === 0) return
      setSerial((prev) => {
        const next = [...prev, ...lines.map((line) => ({ id: serialIdRef.current++, text: line }))]
        return next.length > MAX_SERIAL_LINES ? next.slice(-MAX_SERIAL_LINES) : next
      })
    }

    const onReset = () => {
      partialLineRef.current = ''
    }

    connection.addEventListener('status', onStatus)
    connection.addEventListener('serialdata', onSerial)
    connection.addEventListener('serialreset', onReset)
    connection.initialize().catch(() => {
      // Nothing to do: without an already-authorised device this resolves
      // with NoAuthorizedDevice, and a real failure surfaces on connect().
    })

    return () => {
      connection.removeEventListener('status', onStatus)
      connection.removeEventListener('serialdata', onSerial)
      connection.removeEventListener('serialreset', onReset)
      connection.dispose()
      connectionRef.current = null
    }
  }, [])

  const connect = useCallback(async () => {
    const connection = connectionRef.current
    if (!connection) return
    setFlash({ phase: 'idle' })
    try {
      await connection.connect()
    } catch (error) {
      setFlash({ phase: 'error', message: describeError(error) })
    }
  }, [])

  const disconnect = useCallback(async () => {
    await connectionRef.current?.disconnect()
  }, [])

  const flashScript = useCallback(async (script: string) => {
    const connection = connectionRef.current
    if (!connection) return

    setFlash({ phase: 'building' })
    try {
      const hex = await buildHex(script)

      if (connection.status !== 'Connected') {
        await connection.connect()
      }

      setSerial([])
      partialLineRef.current = ''

      await connection.flash(async (version) => hex.forBoard(version), {
        partial: true,
        progress: (stage, progress) => {
          setFlash({ phase: 'flashing', stage, progress: progress ?? 0 })
        },
      })
      setFlash({ phase: 'done' })
    } catch (error) {
      setFlash({ phase: 'error', message: describeError(error) })
    }
  }, [])

  const clearSerial = useCallback(() => setSerial([]), [])

  return {
    supported,
    status,
    boardVersion,
    flash,
    serial,
    connect,
    disconnect,
    flashScript,
    clearSerial,
  }
}

/** Plain-English version of the library's error codes. */
function describeError(error: unknown): string {
  if (error instanceof DeviceError) {
    switch (error.code) {
      case 'no-device-selected':
        return 'No micro:bit was chosen. Plug one in and pick it from the list.'
      case 'firmware-update-required':
        return 'This micro:bit needs a firmware update before it can be flashed from the browser. Download the hex instead, or update the firmware.'
      case 'device-in-use':
        return 'Another tab or program is using the micro:bit. Close it and try again.'
      case 'device-disconnected':
        return 'The micro:bit was unplugged.'
      case 'timeout':
        return 'The micro:bit stopped responding. Unplug it, plug it back in and try again.'
      case 'connection-error':
        return 'The connection to the micro:bit failed. Unplug it, plug it back in and try again.'
      case 'unsupported':
        return 'This browser cannot flash over USB. Use Chrome or Edge, or download the hex.'
      case 'aborted':
        return 'Flashing was cancelled.'
      default:
        return error.message || `Flashing failed (${error.code}).`
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong while flashing.'
}
