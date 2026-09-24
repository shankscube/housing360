import { NextFunction, Request, Response } from 'express';
import type { TaskCreateInput, TaskFilter, TaskUpdateInput } from '@housing360/types';
import { createTask, getTask, listTasks, listTasksByCase, updateTask, updateTaskStatus } from '../services/task.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

const TASK_FILTERS: TaskFilter[] = ['all', 'due_today', 'overdue', 'upcoming'];

function parseTaskFilter(value: unknown): TaskFilter {
  return typeof value === 'string' && (TASK_FILTERS as string[]).includes(value) ? (value as TaskFilter) : 'all';
}

export async function listCaseTasksHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { caseId } = req.params;
    if (!caseId) {
      throw new AppError(400, 'Case id is required');
    }
    const tasks = await listTasksByCase(caseId);
    sendSuccess(res, { code: 200, message: 'Tasks retrieved', data: tasks });
  } catch (err) {
    next(err);
  }
}

export async function createTaskHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<TaskCreateInput> | undefined;
    if (!input?.clientId) {
      throw new AppError(400, 'clientId is required');
    }
    const task = await createTask(input as TaskCreateInput);
    sendSuccess(res, { code: 201, message: 'Task created', data: task });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Task id is required');
    }
    const input = req.body as TaskUpdateInput;
    const task = await updateTask(id, input);
    sendSuccess(res, { code: 200, message: 'Task updated', data: task });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    if (!id) {
      throw new AppError(400, 'Task id is required');
    }
    if (!status) {
      throw new AppError(400, 'status is required');
    }
    const task = await updateTaskStatus(id, status);
    sendSuccess(res, { code: 200, message: 'Task status updated', data: task });
  } catch (err) {
    next(err);
  }
}

export async function listTasksHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = parseTaskFilter(req.query.filter);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = req.query.page !== undefined ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize !== undefined ? Number(req.query.pageSize) : undefined;
    const result = await listTasks({ filter, search, page, pageSize });
    sendSuccess(res, { code: 200, message: 'Tasks retrieved', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getTaskHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Task id is required');
    }
    const task = await getTask(id);
    sendSuccess(res, { code: 200, message: 'Task retrieved', data: task });
  } catch (err) {
    next(err);
  }
}
