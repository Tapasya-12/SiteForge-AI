import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Project, Page } from '../types';
import { iframeScript } from '../assets/assets';
import EditorPanel from './EditorPanel';
import { toast } from 'sonner';

interface ProjectPreviewProps {
    project: Project,
    activePage?: Page | null,
    isGenerating: boolean;
    device?: 'phone'|'tablet'|'desktop';
    showEditorPanel?: boolean;
    onCodeChange?: (code: string) => void;
}

export interface ProjectPreviewRef {
    getCode: () => string | undefined;
}

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(({project, activePage, isGenerating, device = 'desktop', showEditorPanel = true, onCodeChange}, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [selectedElement, setSelectedElement] = useState<{
        selector: string
        className: string
        text: string
        color: string
        fontSize: string
        bgColor: string
        padding: string
        margin: string
    } | null>(null)

    const resolutions = {
        phone: 'w-[412px]',
        tablet: 'w-[768px]',
        desktop: 'w-full'
    }

    useImperativeHandle(ref, () => ({
        getCode: () => {
            const iframe = iframeRef.current
            return iframe?.contentDocument?.documentElement?.outerHTML
                || activePage?.current_code || project.current_code
        }
    }))

    // Listen for messages from iframe using iframeScript's postMessage protocol
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'ELEMENT_SELECTED' && e.data?.payload) {
                const p = e.data.payload
                setSelectedElement({
                    selector: p.tagName?.toLowerCase() || '',
                    className: p.className || '',
                    text: p.text || '',
                    color: p.styles?.color || '#000000',
                    fontSize: p.styles?.fontSize || '16px',
                    bgColor: p.styles?.backgroundColor || '#ffffff',
                    padding: p.styles?.padding || '',
                    margin: p.styles?.margin || '',
                })
            }
            if (e.data?.type === 'CLEAR_SELECTION') {
                setSelectedElement(null)
            }
        }
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    const injectPreview = (html: string) => {
        if (!html) return '';
        if (!showEditorPanel) return html

        if (html.includes('</body>')) {
            return html.replace('</body>', iframeScript + '</body>')
        } else {
            return html + iframeScript
        }
    }

    const rgbToHex = (rgb: string): string => {
        if (!rgb || rgb === 'transparent') return '#ffffff'
        if (rgb.startsWith('#')) return rgb
        const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (!match) return '#000000'
        const r = parseInt(match[1]).toString(16).padStart(2, '0')
        const g = parseInt(match[2]).toString(16).padStart(2, '0')
        const b = parseInt(match[3]).toString(16).padStart(2, '0')
        return `#${r}${g}${b}`
    }

    // Send update to iframe using iframeScript's UPDATE_ELEMENT protocol
    const sendUpdateToIframe = (updates: any) => {
        const iframe = iframeRef.current
        if (!iframe?.contentWindow) return
        iframe.contentWindow.postMessage({
            type: 'UPDATE_ELEMENT',
            payload: {
                ...(updates.text !== undefined && { text: updates.text }),
                ...(updates.className !== undefined && { className: updates.className }),
                ...(updates.styles && { styles: updates.styles }),
            }
        }, '*')
    }

    return (
        <div className='relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden max-sm:ml-2'>
            {(activePage?.current_code || project.current_code) ? (
                <>
                    <iframe
                        ref={iframeRef}
                        srcDoc={injectPreview(activePage?.current_code || project.current_code)}
                        key={activePage?.current_version_index || project.current_version_index || (activePage?.current_code || project.current_code)?.slice(0, 100)}
                        className={`h-full max-sm:w-full ${resolutions[device]} mx-auto transition-all`}
                        style={{ cursor: selectedElement ? 'default' : 'pointer' }}
                    />

                    {showEditorPanel && (
                        <EditorPanel
                            selectedElement={selectedElement ? {
                                tagName: selectedElement.selector,
                                className: selectedElement.className || '',
                                text: selectedElement.text,
                                styles: {
                                    padding: selectedElement.padding || '',
                                    margin: selectedElement.margin || '',
                                    backgroundColor: rgbToHex(selectedElement.bgColor),
                                    color: rgbToHex(selectedElement.color),
                                    fontSize: selectedElement.fontSize || '16px',
                                }
                            } : null}
                            onUpdate={(updates) => {
                                if (!selectedElement) return

                                // Update local state
                                if (updates.text !== undefined) {
                                    setSelectedElement({ ...selectedElement, text: updates.text })
                                }
                                if (updates.className !== undefined) {
                                    setSelectedElement({ ...selectedElement, className: updates.className })
                                }
                                if (updates.styles) {
                                    setSelectedElement({
                                        ...selectedElement,
                                        color: updates.styles.color ?? selectedElement.color,
                                        bgColor: updates.styles.backgroundColor ?? selectedElement.bgColor,
                                        fontSize: updates.styles.fontSize ?? selectedElement.fontSize,
                                        padding: updates.styles.padding ?? selectedElement.padding,
                                        margin: updates.styles.margin ?? selectedElement.margin,
                                    })
                                }

                                // Send live update to iframe via iframeScript's UPDATE_ELEMENT
                                sendUpdateToIframe(updates)
                            }}
                            onClose={() => {
                                // Clear selection in iframe too
                                iframeRef.current?.contentWindow?.postMessage(
                                    { type: 'CLEAR_SELECTION_REQUEST' }, '*'
                                )
                                setSelectedElement(null)
                            }}
                            onApply={() => {
                                const iframe = iframeRef.current
                                if (!iframe?.contentDocument) return
                                const updatedCode = iframe.contentDocument.documentElement.outerHTML
                                if (onCodeChange) onCodeChange(updatedCode)
                                // Clear selection in iframe
                                iframe.contentWindow?.postMessage(
                                    { type: 'CLEAR_SELECTION_REQUEST' }, '*'
                                )
                                setSelectedElement(null)
                                toast.success('Applied! Click Save in toolbar to persist.')
                            }}
                        />
                    )}
                </>
            ) : isGenerating && (
                <div className='flex items-center justify-center h-full'>
                    <div className='flex gap-1.5'>
                        <span className='size-2 rounded-full animate-bounce bg-gray-400' style={{ animationDelay: '0s' }} />
                        <span className='size-2 rounded-full animate-bounce bg-gray-400' style={{ animationDelay: '0.2s' }} />
                        <span className='size-2 rounded-full animate-bounce bg-gray-400' style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
            )}
        </div>
    );
});

export default ProjectPreview