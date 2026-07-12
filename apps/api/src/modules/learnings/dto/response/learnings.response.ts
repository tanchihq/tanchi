export type LearningDto = Readonly<{
  icp: string;
  points: ReadonlyArray<string>;
  stat: string;
}>;

export type LearningsDto = ReadonlyArray<LearningDto>;
