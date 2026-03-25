import express from 'express';
import { protect } from '../middlewares/auth';
import { deleteProject, getProjectById, getProjectPreview, getPublishedProjects, makeRevision, rollbackToVersion, saveProjectCode } from '../controllers/projectController';
import { addPage, getPages, deletePage, makePageRevision, savePageCode, rollbackPageVersion } from '../controllers/pageController';

const projectRouter = express.Router();

projectRouter.get('/:projectId/pages', protect, getPages)
projectRouter.post('/:projectId/pages', protect, addPage)
projectRouter.delete('/:projectId/pages/:pageId', protect, deletePage)
projectRouter.post('/:projectId/pages/:pageId/revision', protect, makePageRevision)
projectRouter.put('/:projectId/pages/:pageId/save', protect, savePageCode)
projectRouter.get('/:projectId/pages/:pageId/rollback/:versionId', protect, rollbackPageVersion)

projectRouter.post('/revision/:projectId', protect, makeRevision)
projectRouter.put('/save/:projectId', protect, saveProjectCode)
projectRouter.get('/rollback/:projectId/:versionId', protect, rollbackToVersion)
projectRouter.delete('/:projectId', protect, deleteProject)
projectRouter.get('/preview/:projectId', protect, getProjectPreview)
projectRouter.get('/published', getPublishedProjects)
projectRouter.get('/published/:projectId', getProjectById)

export default projectRouter