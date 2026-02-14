import { Loader2Icon } from 'lucide-react'
import { useEffect } from 'react'
import api from '@/configs/axios'

const Loading = () => {

    useEffect(() => {
        const confirm = async () => {
            const params = new URLSearchParams(window.location.search)
            const sessionId = params.get('session_id')

            if (sessionId) {
                try {
                    await api.post('/api/user/confirm-checkout', { sessionId })
                } catch (error) {
                    console.log(error)
                }
            }

            setTimeout(() => {
                window.location.href = '/'
            }, 2500)
        }

        void confirm()
    }, [])
    return (
        <div className='h-screen flex flex-col'>
            <div className='flex-1 flex items-center justify-center'>
                <Loader2Icon className='animate-spin size-7 text-indigo-200' />
            </div>
        </div>
    )
}

export default Loading