type PgActivity = Readonly<{
  id: string;
  type: string;
  title: string;
  lead_id: string | null;
  created_at: Date;
}>;

type PgActivityStatusRow = Readonly<{
  last_run_started: Date | null;
  last_run_done: Date | null;
  researched_today: number;
  drafted_today: number;
  sent_today: number;
  replies_today: number;
}>;

export type { PgActivity, PgActivityStatusRow };
