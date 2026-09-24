import { NextFunction, Request, Response } from 'express';
import { HUD_OPTIONS } from '../constants/hudOptions';
import {
  CASE_ORIGIN_OPTIONS,
  CASE_STAGE_OPTIONS,
  CASE_STATUS_OPTIONS,
  HMIS_DATA_QUALITY_STATUS_OPTIONS,
} from '../constants/caseWorkspaceOptions';
import {
  CONFIDENTIALITY_TYPE_OPTIONS,
  INTERACTION_PURPOSE_OPTIONS,
} from '../constants/interactionSummaryOptions';
import { ROI_AUTHORIZATION_TEXT, ROI_REDISCLOSURE_NOTICE } from '../constants/roiDisclosureText';
import { sendSuccess } from '../utils/responder';

export function getHudOptionsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, { code: 200, message: 'HUD options retrieved', data: HUD_OPTIONS });
  } catch (err) {
    next(err);
  }
}

export function getRoiTextHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, {
      code: 200,
      message: 'ROI text retrieved',
      data: {
        authorizationText: ROI_AUTHORIZATION_TEXT,
        redisclosureNotice: ROI_REDISCLOSURE_NOTICE,
      },
    });
  } catch (err) {
    next(err);
  }
}

export function getCaseOptionsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, {
      code: 200,
      message: 'Case options retrieved',
      data: {
        stage: CASE_STAGE_OPTIONS,
        origin: CASE_ORIGIN_OPTIONS,
        status: CASE_STATUS_OPTIONS,
        hmisDataQualityStatus: HMIS_DATA_QUALITY_STATUS_OPTIONS,
        interactionPurpose: INTERACTION_PURPOSE_OPTIONS,
        confidentialityType: CONFIDENTIALITY_TYPE_OPTIONS,
      },
    });
  } catch (err) {
    next(err);
  }
}
