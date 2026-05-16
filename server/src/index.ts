import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { getDailyCaseSnapshot, getUtcDateKey } from './daily.js';
import { getDailyLeaderboard, upsertDailyResult } from './store.js';

const completeDailySchema = z.object({
  installId: z.string().min(3).max(120),
  username: z.string().min(1).max(40).default('Detective'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  caseId: z.string().min(1).max(80),
  caseName: z.string().min(1).max(120),
  dayNumber: z.number().int().positive(),
  stars: z.number().int().min(0).max(3),
  timeSeconds: z.number().int().min(0).max(24 * 60 * 60),
  errors: z.number().int().min(0).max(999),
  completedAt: z.string().optional(),
});

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

app.get('/health', async () => ({ ok: true }));

app.get('/cases/daily', async (request) => {
  const query = request.query as { date?: string };
  const date = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : getUtcDateKey();
  return getDailyCaseSnapshot(date);
});

app.post('/cases/daily/complete', async (request, reply) => {
  const parsed = completeDailySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, issues: parsed.error.issues });
  }

  const saved = await upsertDailyResult({
    ...parsed.data,
    completedAt: parsed.data.completedAt ?? new Date().toISOString(),
  });

  return { ok: true, result: saved };
});

app.get('/cases/daily/leaderboard', async (request) => {
  const query = request.query as { date?: string };
  const date = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : getUtcDateKey();
  const leaderboard = await getDailyLeaderboard(date);
  return { date, leaderboard };
});

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? '0.0.0.0';

await app.listen({ port, host });
