import { createContext, useContext } from 'react'

export const AuthCtx = createContext({ sesi: null, admin: false, masuk: async () => ({ ok: false }), keluar: () => {}, sambut: null, tutupSambut: () => {} })
export const useAuth = () => useContext(AuthCtx)
