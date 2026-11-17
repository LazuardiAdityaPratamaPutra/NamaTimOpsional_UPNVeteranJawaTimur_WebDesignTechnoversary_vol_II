import { createContext, useContext } from 'react'

export const ToastCtx = createContext({ show: () => {}, tutup: () => {} })
export const useToast = () => useContext(ToastCtx)
