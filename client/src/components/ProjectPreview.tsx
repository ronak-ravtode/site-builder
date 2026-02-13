import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Project } from '../types';
import { iframeScript } from '../assets/assets';
import EditorPanel from './EditorPanel';
import LoaderSteps from './LoaderSteps';

export interface ProjectPreviewRef {
    getCode: ()=> string | undefined
}

interface ProjectPreviewProps {
    project: Project;
    isGenerating: boolean;
    device?: 'desktop' | 'phone' | 'tablet';
    showEditorPanel?: boolean;
}

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(({project,isGenerating,device = 'desktop',showEditorPanel = true},ref) => {

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [selectedElement, setSelectedElement] = useState<any>(null);

    const resoultions = {
        phone : 'w-[412px]',
        tablet : 'w-[768px]',
        desktop : 'w-full'
    }

    useImperativeHandle(ref,()=>({
        getCode:()=>{
            const doc = iframeRef.current?.contentDocument;
            if(!doc) return undefined;
            //remove classes
            doc.querySelectorAll('.ai-selected-element,[data-ai-selected]').forEach((el)=>{
                el.classList.remove('ai-selected-element');
                el.removeAttribute('data-ai-selected');
                (el as HTMLElement).style.outline = '';
            })
            // remove injected style and script
            const previwStyle = doc.getElementById('ai-preview-style');
            if(previwStyle) {
                previwStyle.remove();
            }
            const previwScript = doc.getElementById('ai-preview-script');
            if(previwScript) {
                previwScript.remove();
            }
            //serialize clean html
            const html = doc.documentElement.outerHTML;
            return html;
        }
    }))

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if(event.data.type === 'ELEMENT_SELECTED') {
                setSelectedElement(event.data.payload);
            }
            else if(event.data.type === 'CLEAR_SELECTION') {
                setSelectedElement(null);
            }
        }        
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        }
    }, [showEditorPanel])

    const handleUpdate = (updates: any) => {
        if(iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({type: 'UPDATE_ELEMENT', payload: updates}, '*');
        }
    }

    const injectPreview = (html:string) => {
        if (!html) return '';
        if(!showEditorPanel) return html;

        if(html.includes('</body>')) {
            return html.replace('</body>', iframeScript + '</body>');
        }else{
            return html + iframeScript;
        }
    }

  return (
    <div className='relative h-full bg-gray-900 flex justify-center items-center no-scrollbar rounded-xl overflow-hidden max-sm:ml-2'>
        {
            project.current_code ? (
                <>
                    <iframe className={`h-full max-sm:w-full ${resoultions[device]} max-auto transition-all`} ref={iframeRef} srcDoc={injectPreview(project.current_code)}></iframe>
                    {showEditorPanel && selectedElement && (
                        <EditorPanel selectedElement={selectedElement} onUpdate={handleUpdate} onClose={()=>{
                            setSelectedElement(null);
                            if(iframeRef.current?.contentWindow) {
                                iframeRef.current.contentWindow.postMessage({type: 'CLEAR_SELECTION'}, '*');
                            }
                        }} />
                    )}
                </>
            ) : isGenerating && (
                <LoaderSteps />
            )
        }
    </div>
  )
})

export default ProjectPreview