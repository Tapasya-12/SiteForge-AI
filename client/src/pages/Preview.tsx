import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProjectPreview from "../components/ProjectPreview";
import api from '@/configs/axios';
import type { Project } from "../types";
import { toast } from 'sonner';

const Preview = () => {
  const { projectId, versionId } = useParams()
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCode = async () => {
    if(!projectId){
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data } = await api.get(`/api/project/preview/${projectId}`)
      if (data?.project?.current_code) {
        setCode(data.project.current_code)
      } else {
        toast.error('Preview not found')
      }
    } catch (error: any) {
      toast.error('Failed to load preview')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    fetchCode()
  },[])
  
  if(loading){
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2Icon className='size-7 animate-spin text-indigo-200'/>
      </div>
    )
  }
  
  return (
    <div className='h-screen'>
      {code && <ProjectPreview project={{ current_code: code } as Project} isGenerating={false} showEditorPanel={false}/>}
    </div>
  )
}

export default Preview
