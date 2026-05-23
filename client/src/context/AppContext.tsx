import type { AxiosInstance } from "axios"
import axios from "axios"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type User = {
    id: string,
    name: string,
    email: string,
    plan: string,
    analysisCount?: number
}

interface AppContextType {
    user: User | null
    token: string | null
    api: AxiosInstance
    loading: boolean
    login: (email: string, password: string) => Promise<{ success: boolean, message?: string }>
    register: (name: string, email: string, password: string) => Promise<{ success: boolean, message?: string }>
    logout: () => void
}


const BACKEND_URL = import.meta.env.VITE_BASE_URL || "http://localhost:4000"
const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppContextProvider = ({ children }: { children: ReactNode }) => {

    const [user, SetUser] = useState<User | null>(null)
    const [token, SetToken] = useState<string | null>(localStorage.getItem("token"))
    const [loading, SetLoading] = useState<boolean>(true)


    const api = axios.create({
        baseURL: BACKEND_URL
    })
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem("token")
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    })

    async function login(email: string, password: string) {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password })
            if (response.data.success) {
                SetToken(response.data.token)
                SetUser(response.data.user)
                localStorage.setItem("token", response.data.token)
                return { success: true }
            }
            return { success: false, message: response.data.message }
        } catch (error: any) {
            console.log(error)
            return { success: false, message: error.message || "Login failed" }

        }
    }
    async function register(name: string, email: string, password: string) {
        try {
            const { data } = await api.post(`${BACKEND_URL}/api/auth/register`, { name, email, password })
            if (data.success) {
                SetUser(data.user)
                SetToken(data.token)
                localStorage.setItem("token", data.token)
                return { success: true }
            }
        } catch (error: any) {
            console.log(error)
            return { success: false, message: error.message || "registeration failed" }
        }
    }
    async function logout() {
        SetToken(null)
        SetUser(null)
        localStorage.removeItem("token")
    }
    async function loadUser() {
        if (!token) {
            SetLoading(false)
            return
        }
        try {
            const { data } = await api.get("/api/auth/user")
            if (data.success) {
                SetUser(data.user)
            }
        } catch (error) {
            console.log(error)
            localStorage.removeItem("token")
            SetToken(null)
            SetUser(null)
        }
    }

    useEffect(() => {
        loadUser()
    }, [user])

    const value = {
        user,
        token,
        loading,
        api,
        login,
        register,
        logout
    }
    return (<AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>)
    
}

export function useAppContext() {
    const context = useContext(AppContext)
    if(!context) throw new Error("Context need to be inside AppContext Provider")
    return context
}