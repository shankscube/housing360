import { Router } from 'express';
import {
  addCeAnswerOptionHandler,
  createCeFlagOverrideHandler,
  createCeQuestionHandler,
  createCeScoreBandHandler,
  deleteCeAnswerOptionHandler,
  deleteCeFlagOverrideHandler,
  deleteCeQuestionHandler,
  deleteCeScoreBandHandler,
  listCeFlagOverridesHandler,
  listCeScoreBandsHandler,
  listRuleChangesHandler,
  updateCeAnswerOptionHandler,
  updateCeFlagOverrideHandler,
  updateCeQuestionHandler,
  updateCeScoreBandHandler,
} from '../controllers/ceRuleAdmin.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const ceRuleAdminRouter = Router();

const MANAGE_CE_RULES = requirePermission('ce:manage-rules');

// Mounted at `/api` by the orchestrator — paths below are relative to that.
// Every route requires `requireAuth` THEN `ce:manage-rules` (6.1-6.3) — list
// of active questions for the client-facing form is `GET /api/ce/questions`
// (coordinatedEntry.routes.ts), not gated by this permission.
ceRuleAdminRouter.post('/ce/questions', requireAuth, MANAGE_CE_RULES, createCeQuestionHandler);
ceRuleAdminRouter.patch('/ce/questions/:id', requireAuth, MANAGE_CE_RULES, updateCeQuestionHandler);
ceRuleAdminRouter.delete('/ce/questions/:id', requireAuth, MANAGE_CE_RULES, deleteCeQuestionHandler);

ceRuleAdminRouter.post('/ce/questions/:id/answer-options', requireAuth, MANAGE_CE_RULES, addCeAnswerOptionHandler);
ceRuleAdminRouter.patch('/ce/answer-options/:id', requireAuth, MANAGE_CE_RULES, updateCeAnswerOptionHandler);
ceRuleAdminRouter.delete('/ce/answer-options/:id', requireAuth, MANAGE_CE_RULES, deleteCeAnswerOptionHandler);

ceRuleAdminRouter.get('/ce/score-bands', requireAuth, MANAGE_CE_RULES, listCeScoreBandsHandler);
ceRuleAdminRouter.post('/ce/score-bands', requireAuth, MANAGE_CE_RULES, createCeScoreBandHandler);
ceRuleAdminRouter.patch('/ce/score-bands/:id', requireAuth, MANAGE_CE_RULES, updateCeScoreBandHandler);
ceRuleAdminRouter.delete('/ce/score-bands/:id', requireAuth, MANAGE_CE_RULES, deleteCeScoreBandHandler);

ceRuleAdminRouter.get('/ce/flag-overrides', requireAuth, MANAGE_CE_RULES, listCeFlagOverridesHandler);
ceRuleAdminRouter.post('/ce/flag-overrides', requireAuth, MANAGE_CE_RULES, createCeFlagOverrideHandler);
ceRuleAdminRouter.patch('/ce/flag-overrides/:id', requireAuth, MANAGE_CE_RULES, updateCeFlagOverrideHandler);
ceRuleAdminRouter.delete('/ce/flag-overrides/:id', requireAuth, MANAGE_CE_RULES, deleteCeFlagOverrideHandler);

ceRuleAdminRouter.get('/ce/rule-changes', requireAuth, MANAGE_CE_RULES, listRuleChangesHandler);
