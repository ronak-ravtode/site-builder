import { Loader2Icon } from 'lucide-react'
import { useEffect } from 'react'

const Loading = () => {

    useEffect(() => {
        setTimeout(() => {
            window.location.href = '/'
        }, 6000)
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