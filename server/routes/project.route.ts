import express from "express";
import { makeRevision, rollbackToVersion, deleteProject, saveProjectCode, getProjectPreview, getPublishedProjects, getProjectById } from "../controllers/project.controller";
import { protect } from "../middlewares/auth";

const projectRouter = express.Router();

projectRouter.post('/revision/:projectId',protect, makeRevision);
projectRouter.put('/save/:projectId',protect, saveProjectCode);
projectRouter.get('/rollback/:projectId/:versionId',protect, rollbackToVersion);
projectRouter.delete('/delete/:projectId',protect, deleteProject);
projectRouter.get('/preview/:projectId',protect, getProjectPreview);
projectRouter.get('/published', getPublishedProjects);
projectRouter.get('/published/:projectId', getProjectById);

export default projectRouter;
