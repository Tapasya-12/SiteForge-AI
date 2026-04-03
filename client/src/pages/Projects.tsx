import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Project } from '../types';
import { ArrowBigDownDashIcon, EyeIcon, EyeOffIcon, FullscreenIcon, LaptopIcon, Loader2Icon, MessageSquareIcon, SaveIcon, SmartphoneIcon, TabletIcon, XIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Sidebar from '../components/Sidebar';
import ProjectPreview, { type ProjectPreviewRef } from '../components/ProjectPreview';
import PageSwitcher from '../components/PageSwitcher';
import AddPageModal from '../components/AddPageModal';
import api from '@/configs/axios';
import { toast } from 'sonner';

const Projects = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(true)
  const [device, setDevice] = useState<'phone'|'tablet'|'desktop'>('desktop')

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Multi-page support
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false)
  const [isAddingPage, setIsAddingPage] = useState(false)

  // Derive activePage from project data
  const activePage = project?.pages?.find(page => page.id === activePageId) || null
  const pages = project?.pages || []

  const previewRef = useRef<ProjectPreviewRef>(null)

  const fetchProject = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data } = await api.get(`/api/user/project/${projectId}`)
      if (data?.project) {
        setProject(data.project)
        setIsGenerating(false) // Always false for multi-page
      } else {
        toast.error('Project not found')
      }
    } catch (error: any) {
      toast.error('Failed to load project')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const saveProject = async () => {
    if (!project) return
    setIsSaving(true)

    try {
      const code = previewRef.current?.getCode()
      if (!code) {
        toast.error('Nothing to save')
        return
      }

      if (activePage) {
        await api.put(`/api/project/${project.id}/pages/${activePage.id}/save`, { code })
      } else {
        await api.put(`/api/project/save/${project.id}`, { code })
      }

      toast.success('Saved!')
      await fetchProject()
    } catch (error: any) {
      toast.error('Failed to save')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublish = async () => {
    if (!project) return
    try {
      await api.get(`/api/user/publish-toggle/${project.id}`)
      const newValue = !project.isPublished
      setProject((prev) => prev ? { ...prev, isPublished: newValue } : prev)
      toast.success(newValue ? 'Published!' : 'Unpublished!')
    } catch (error: any) {
      toast.error('Failed to update publish status')
      console.error(error)
    }
  }

  const addPage = async (name: string, slug: string) => {
    if (!project) return
    setIsAddingPage(true)
    try {
      const { data } = await api.post(`/api/project/${project.id}/pages`, { name, slug })
      await fetchProject()
      setActivePageId(data.page.id)
      setIsAddPageModalOpen(false)
      toast.success(`${name} page generated!`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add page')
    } finally {
      setIsAddingPage(false)
    }
  }

  const deletePage = async (pageId: string) => {
    if (!project) return
    try {
      await api.delete(`/api/project/${project.id}/pages/${pageId}`)
      if (activePageId === pageId) setActivePageId(null)
      await fetchProject()
      toast.success('Page deleted')
    } catch (error: any) {
      toast.error('Failed to delete page')
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  useEffect(() => {
    if (!isGenerating) return
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/user/project/${projectId}`)
        if (data?.project) {
          setProject(data.project)
          setIsGenerating(false)
          clearInterval(interval)
        }
      } catch (e) {
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isGenerating, projectId])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2Icon className='size-7 animate-spin text-violet-200' />
      </div>
    )
  }

  const handleDownloadZip = async () => {
    if (!project) return

    setIsDownloading(true)
    try {
      const zip = new JSZip()
      const homeFileName = 'index.html'

      const readmeLines = [
        `# ${project.name}`,
        '',
        'This ZIP was exported from SiteForge AI.',
        '',
        '## Included files',
        `- ${homeFileName} (Home page)`,
        ...pages.map((page) => `- ${page.slug}.html (${page.name})`),
        '',
        '## How to use',
        `1. Open ${homeFileName} in your browser to view the home page.`,
        '2. Open other HTML files directly or link them through your own navigation.',
        '3. Upload all files to your static hosting provider to deploy the site.',
      ]

      zip.file('README.md', readmeLines.join('\n'))

      zip.file(homeFileName, project.current_code ?? '<!-- Home page has no generated content yet -->')

      for (const page of pages) {
        zip.file(`${page.slug}.html`, page.current_code ?? `<!-- ${page.name} has no content yet -->`)
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `${project.name.replace(/\s+/g, '-').toLowerCase()}.zip`)
    } finally {
      setIsDownloading(false)
    }
  }

  return project ? (
    <div className='flex flex-col h-screen w-full bg-gray-900 text-white'>
      <div className='flex max-sm:flex-col sm:items-center gap-4 px-4 py-2 no-scrollbar'>
        <div className='flex items-center gap-2 sm:min-w-90 text-nonwrap'>
          <img src='/favicon.svg' alt='logo' className='h-6 cursor-pointer' onClick={() => navigate('/')} />
          <div className='max-w-64 sm:max-w-xs'>
            <p className='text-sm text-medium capitalize truncate'>{project.name}</p>
            <p className='text-xs text-gray-400 -mt-0.5'>Previewing last saved version</p>
          </div>
          <div className='sm:hidden flex-1 flex-justify-end'>
            {isMenuOpen ? <MessageSquareIcon onClick={() => setIsMenuOpen(false)} className='size-6 cursor-pointer' /> : <XIcon onClick={() => setIsMenuOpen(true)} className='size-6 cursor-pointer' />}
          </div>
        </div>

        <div className='hidden sm:flex gap-2 bg-gray-950 p-1.5 rounded-md'>
          <SmartphoneIcon onClick={() => setDevice('phone')} className={`size-6 p-1 rounded cursor-pointer ${device === 'phone' ? 'bg-gray-700' : ''}`} />
          <TabletIcon onClick={() => setDevice('tablet')} className={`size-6 p-1 rounded cursor-pointer ${device === 'tablet' ? 'bg-gray-700' : ''}`} />
          <LaptopIcon onClick={() => setDevice('desktop')} className={`size-6 p-1 rounded cursor-pointer ${device === 'desktop' ? 'bg-gray-700' : ''}`} />
        </div>

        <div className='flex items-center justify-end gap-3 flex-1 text-xs sm:text-sm'>
          <button onClick={saveProject} disabled={isSaving} className='max-sm:hidden bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm transition-colors border border-gray-700'>
            {isSaving ? <Loader2Icon className='animate-spin' size={16} /> : <SaveIcon size={16} />}
            Save
          </button>
          <Link target='_blank' to={`/preview/${project.id}`} className='flex items-center gap-2 px-4 py-1 rounded sm:rounded-sm border border-gray-700 hover:border-gray-500 transition-colors'>
            <FullscreenIcon size={16} />Preview
          </Link>
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            title='Download all pages as ZIP'
            className='bg-linear-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white px-3.5 py-1 flex items-center gap-2 rounded sm:runded-sm transition-colors disabled:opacity-60'
          >
            {isDownloading ? <Loader2Icon className='animate-spin' size={16} /> : <ArrowBigDownDashIcon size={16} />}
            {isDownloading ? 'Downloading...' : 'Download ZIP'}
          </button>
          <button onClick={togglePublish} className='bg-linear-to-br from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white px-3.5 py-1 flex items-center gap-2 rounded sm:runded-sm transition-colors'>
            {project.isPublished ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            {project.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className='flex-1 flex overflow-auto'>
        <Sidebar isMenuOpen={isMenuOpen} project={project} setProject={setProject} isGenerating={isGenerating} setIsGenerating={setIsGenerating} refreshProject={fetchProject} activePage={activePage} />
        <div className='flex-1 flex flex-col'>
          <PageSwitcher
            pages={project.pages || []}
            activePage={activePage}
            onSelectPage={(page) => setActivePageId(page?.id || null)}
            onAddPage={() => setIsAddPageModalOpen(true)}
            onDeletePage={deletePage}
            isGenerating={isGenerating || isAddingPage}
          />
          <div className='flex-1 p-2 pl-0'>
            <ProjectPreview
              ref={previewRef}
              project={project}
              activePage={activePage}
              isGenerating={isGenerating || isAddingPage}
              device={device}
              onCodeChange={(code) => {
                if (activePage) {
                  // Update the page in the project state
                  setProject(prev => prev ? {
                    ...prev,
                    pages: prev.pages?.map(page =>
                      page.id === activePage.id
                        ? { ...page, current_code: code }
                        : page
                    )
                  } : prev)
                } else {
                  setProject({ ...project, current_code: code })
                }
              }}
            />
          </div>
        </div>
      </div>

      <AddPageModal
        isOpen={isAddPageModalOpen}
        onClose={() => setIsAddPageModalOpen(false)}
        onAdd={addPage}
        isLoading={isAddingPage}
      />
    </div>
  ) : (
    <div className='flex items-center justify-center h-screen'>
      <p className='text-2xl font-medium text-gray-200'>Unable to load project!</p>
    </div>
  )
}

export default Projects
