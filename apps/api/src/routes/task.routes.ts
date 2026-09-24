import { Router } from 'express';
import {
  createTaskHandler,
  getTaskHandler,
  listCaseTasksHandler,
  listTasksHandler,
  updateTaskHandler,
  updateTaskStatusHandler,
} from '../controllers/task.controller';
import { requireAuth } from '../middlewares/auth';

export const taskRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
// GET routes for the Tasks page (home-workspace) — listed first for
// readability; method-based matching means order doesn't affect the PATCH
// routes below.
taskRouter.get('/tasks', requireAuth, listTasksHandler);
taskRouter.get('/tasks/:id', requireAuth, getTaskHandler);
taskRouter.get('/cases/:caseId/tasks', requireAuth, listCaseTasksHandler);
taskRouter.post('/tasks', requireAuth, createTaskHandler);
taskRouter.patch('/tasks/:id/status', requireAuth, updateTaskStatusHandler);
taskRouter.patch('/tasks/:id', requireAuth, updateTaskHandler);
