import { Router } from 'express';
import {
  createTaskHandler,
  listCaseTasksHandler,
  updateTaskHandler,
  updateTaskStatusHandler,
} from '../controllers/task.controller';
import { requireAuth } from '../middlewares/auth';

export const taskRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
taskRouter.get('/cases/:caseId/tasks', requireAuth, listCaseTasksHandler);
taskRouter.post('/tasks', requireAuth, createTaskHandler);
taskRouter.patch('/tasks/:id/status', requireAuth, updateTaskStatusHandler);
taskRouter.patch('/tasks/:id', requireAuth, updateTaskHandler);
