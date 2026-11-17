import { createContext, useContext } from 'react'

export const SyncCtx = createContext({ online: true, laporan: null, antrean: 0, sedang: false, sinkronkan: async () => null })
export const useSinkron = () => useContext(SyncCtx)
