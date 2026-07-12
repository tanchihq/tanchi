export type EngineRunSummaryDto = Readonly<{
  sourced: number;
  profiled: number;
  drafted: number;
}>;

export type EngineRunQueuedDto = Readonly<{
  queued: true;
}>;
