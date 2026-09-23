import type { InteractionSummary, InteractionSummaryInput } from '@housing360/types';
import { createInteractionSummary as createInteractionSummaryRow } from '../models/interactionSummary.model';
import { toInteractionSummary } from '../models/interactionSummary.mapper';

/** `POST /interaction-summaries` — always a create; the wizard's step 8 is optional
 * (see spec's "Interaction Summary Step Is Optional") and only calls this when the
 * case manager answers Yes. */
export async function createInteractionSummary(
  input: InteractionSummaryInput
): Promise<InteractionSummary> {
  const row = await createInteractionSummaryRow(input);
  return toInteractionSummary(row);
}
