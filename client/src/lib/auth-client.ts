import { createAuthClient } from "better-auth/react"

const baseURLFromEnv = import.meta.env.VITE_BASE_URL
const baseURL = baseURLFromEnv?.endsWith("/api/_auth")
    ? baseURLFromEnv
    : `${baseURLFromEnv?.replace(/\/$/, "")}/api/_auth`

export const authClient = createAuthClient({
    baseURL,
    fetchOptions: {
        credentials: "include"
    }
})

export const { signIn,signUp,useSession } = authClient