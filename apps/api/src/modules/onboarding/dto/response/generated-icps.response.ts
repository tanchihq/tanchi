export type GeneratedIcpDto = Readonly<{
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

export type GeneratedIcpsDto = Readonly<{
  icps: ReadonlyArray<GeneratedIcpDto>;
}>;
