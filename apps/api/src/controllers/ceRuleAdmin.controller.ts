import { NextFunction, Request, Response } from 'express';
import type {
  CeFlagOverrideInput,
  CeFlagOverrideUpdateInput,
  CeQuestionInput,
  CeQuestionUpdateInput,
  CeScoreBandInput,
  CeScoreBandUpdateInput,
} from '@housing360/types';
import {
  addCeAnswerOption,
  createCeFlagOverride,
  createCeQuestion,
  createCeScoreBand,
  deleteCeAnswerOption,
  deleteCeFlagOverride,
  deleteCeQuestion,
  deleteCeScoreBand,
  listCeFlagOverrides,
  listCeScoreBands,
  listRuleChanges,
  updateCeAnswerOption,
  updateCeFlagOverride,
  updateCeQuestion,
  updateCeScoreBand,
} from '../services/ceRuleAdmin.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

function requireActorId(req: Request): number {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }
  return req.user.id;
}

// ---- CeQuestion ----

export async function createCeQuestionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const input = req.body as Partial<CeQuestionInput> | undefined;
    if (!input?.text || !input.answerOptions) {
      throw new AppError(400, 'text and answerOptions are required');
    }
    const question = await createCeQuestion(input as CeQuestionInput, actorId);
    sendSuccess(res, { code: 201, message: 'Question created', data: question });
  } catch (err) {
    next(err);
  }
}

export async function updateCeQuestionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    const input = (req.body as CeQuestionUpdateInput | undefined) ?? {};
    const question = await updateCeQuestion(id, input, actorId);
    sendSuccess(res, { code: 200, message: 'Question updated', data: question });
  } catch (err) {
    next(err);
  }
}

export async function deleteCeQuestionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    await deleteCeQuestion(id, actorId);
    sendSuccess(res, { code: 200, message: 'Question deleted', data: { id } });
  } catch (err) {
    next(err);
  }
}

// ---- CeAnswerOption ----

export async function addCeAnswerOptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    const input = req.body as Partial<{ text: string; score: number }> | undefined;
    if (!input?.text || input.score === undefined) {
      throw new AppError(400, 'text and score are required');
    }
    const option = await addCeAnswerOption(id, { text: input.text, score: input.score }, actorId);
    sendSuccess(res, { code: 201, message: 'Answer option added', data: option });
  } catch (err) {
    next(err);
  }
}

export async function updateCeAnswerOptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    const input = (req.body as Partial<{ text: string; score: number }> | undefined) ?? {};
    const option = await updateCeAnswerOption(id, input, actorId);
    sendSuccess(res, { code: 200, message: 'Answer option updated', data: option });
  } catch (err) {
    next(err);
  }
}

export async function deleteCeAnswerOptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    await deleteCeAnswerOption(id, actorId);
    sendSuccess(res, { code: 200, message: 'Answer option deleted', data: { id } });
  } catch (err) {
    next(err);
  }
}

// ---- CeScoreBand ----

export async function listCeScoreBandsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const bands = await listCeScoreBands();
    sendSuccess(res, { code: 200, message: 'Score bands retrieved', data: bands });
  } catch (err) {
    next(err);
  }
}

export async function createCeScoreBandHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const input = req.body as Partial<CeScoreBandInput> | undefined;
    if (!input?.name || input.minScore === undefined || input.maxScore === undefined || !input.recommendedProjectTypeCodes) {
      throw new AppError(400, 'name, minScore, maxScore, and recommendedProjectTypeCodes are required');
    }
    const band = await createCeScoreBand(input as CeScoreBandInput, actorId);
    sendSuccess(res, { code: 201, message: 'Score band created', data: band });
  } catch (err) {
    next(err);
  }
}

export async function updateCeScoreBandHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    const input = (req.body as CeScoreBandUpdateInput | undefined) ?? {};
    const band = await updateCeScoreBand(id, input, actorId);
    sendSuccess(res, { code: 200, message: 'Score band updated', data: band });
  } catch (err) {
    next(err);
  }
}

export async function deleteCeScoreBandHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    await deleteCeScoreBand(id, actorId);
    sendSuccess(res, { code: 200, message: 'Score band deleted', data: { id } });
  } catch (err) {
    next(err);
  }
}

// ---- CeFlagOverride ----

export async function listCeFlagOverridesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const overrides = await listCeFlagOverrides();
    sendSuccess(res, { code: 200, message: 'Flag overrides retrieved', data: overrides });
  } catch (err) {
    next(err);
  }
}

export async function createCeFlagOverrideHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const input = req.body as Partial<CeFlagOverrideInput> | undefined;
    if (!input?.flag || !input.behavior) {
      throw new AppError(400, 'flag and behavior are required');
    }
    const override = await createCeFlagOverride(input as CeFlagOverrideInput, actorId);
    sendSuccess(res, { code: 201, message: 'Flag override created', data: override });
  } catch (err) {
    next(err);
  }
}

export async function updateCeFlagOverrideHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    const input = (req.body as CeFlagOverrideUpdateInput | undefined) ?? {};
    const override = await updateCeFlagOverride(id, input, actorId);
    sendSuccess(res, { code: 200, message: 'Flag override updated', data: override });
  } catch (err) {
    next(err);
  }
}

export async function deleteCeFlagOverrideHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = requireActorId(req);
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    await deleteCeFlagOverride(id, actorId);
    sendSuccess(res, { code: 200, message: 'Flag override deleted', data: { id } });
  } catch (err) {
    next(err);
  }
}

// ---- CeRuleChange ----

export async function listRuleChangesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
    const result = await listRuleChanges(page > 0 ? page : 1, pageSize > 0 ? pageSize : 20);
    sendSuccess(res, { code: 200, message: 'Rule changes retrieved', data: result });
  } catch (err) {
    next(err);
  }
}
