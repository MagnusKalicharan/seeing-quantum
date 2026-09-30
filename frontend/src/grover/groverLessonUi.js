/** UI copy and step helpers for the Grover interactive lesson. */

export const LESSON_TIER = { BEGINNER: 'beginner', EXPLORE: 'explore' };

/** Steps hidden in beginner mode (same simulation, fewer stops). */
export const BEGINNER_SKIP_TYPES = new Set(['init', 'speedup']);

export function filterStepsForTier(steps, tier) {
  if (tier === LESSON_TIER.EXPLORE) return steps;
  return steps.filter((s) => !BEGINNER_SKIP_TYPES.has(s.type));
}

/** Human-readable progress node for the rail. */
export function progressLabelForStep(step) {
  switch (step.type) {
    case 'problem':
      return 'Start';
    case 'init':
      return 'Start';
    case 'hadamard':
      return 'Superposition';
    case 'oracle':
      return step.iteration > 0 ? `Oracle ×${step.iteration + 1}` : 'Oracle';
    case 'diffuser':
      return step.iteration > 0 ? `Diffusion ×${step.iteration + 1}` : 'Diffusion';
    case 'speedup':
      return 'Speedup';
    case 'measure':
      return 'Measure';
    default:
      return step.title;
  }
}

/** Short rail labels (fits small screens). */
export function progressShortLabel(step) {
  switch (step.type) {
    case 'hadamard':
      return 'H';
    case 'oracle':
      return 'O';
    case 'diffuser':
      return 'D';
    case 'measure':
      return 'M';
    case 'problem':
    case 'init':
      return '·';
    default:
      return '·';
  }
}

/**
 * Primary forward action label — what the next click will do.
 */
export function forwardActionLabel(currentStep, nextStep, atLastStep) {
  if (atLastStep) return null;
  if (!nextStep) return 'Next step →';

  switch (nextStep.type) {
    case 'hadamard':
      return 'Create superposition →';
    case 'oracle':
      return 'Run the Oracle →';
    case 'diffuser':
      return 'Apply diffusion →';
    case 'measure':
      return 'Go to measurement →';
    case 'speedup':
      return 'Learn why this works →';
    default:
      return 'Next step →';
  }
}

/** Hint above the primary button. */
export function forwardActionHint(currentStep, nextStep, atLastStep) {
  if (atLastStep && currentStep?.type === 'measure') {
    return 'Click below to pick one state at random, using the probabilities shown.';
  }
  if (atLastStep) return 'You have reached the end of this run. Reset to try again.';

  switch (nextStep?.type) {
    case 'hadamard':
      return 'Every state will get the same chance of being the answer.';
    case 'oracle':
      return 'The target stays hidden, but its amplitude will flip sign (phase mark).';
    case 'diffuser':
      return 'The target’s chance should grow; the other states should shrink.';
    case 'measure':
      return 'You will see the final probabilities before measuring.';
    default:
      return 'Advance one stage of the algorithm.';
  }
}

/** After diffuser, if another oracle follows. */
export function forwardActionLabelAfterDiffuser(currentStep, nextStep) {
  if (nextStep?.type === 'oracle') return 'Amplify again →';
  if (nextStep?.type === 'measure') return 'Continue to measurement →';
  return forwardActionLabel(currentStep, nextStep, false);
}

export function resolveForwardLabel(currentStep, nextStep, atLastStep) {
  if (currentStep?.type === 'diffuser') {
    return forwardActionLabelAfterDiffuser(currentStep, nextStep);
  }
  return forwardActionLabel(currentStep, nextStep, atLastStep);
}
