export interface Case {
  id: string;
  clientId: string;
  programEnrollmentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** `POST /api/cases/ensure` input — idempotent per (clientId, enrollmentId). */
export interface EnsureCaseInput {
  clientId: string;
  enrollmentId: string;
}
