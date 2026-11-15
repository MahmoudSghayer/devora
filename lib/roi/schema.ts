import {z} from 'zod';
import {ROI_TASK_IDS} from './types';

const taskSchema = z.strictObject({
  taskId: z.enum(ROI_TASK_IDS),
  /** per employee */
  timesPerDay: z.number().min(0).max(1000),
  minutesEach: z.number().min(0).max(1440),
  employees: z.number().int().min(0).max(10000),
  /** percent 0–100 of the task's time removed by automation */
  automationPct: z.number().min(0).max(100),
});

const laborSchema = z.discriminatedUnion('mode', [
  z.strictObject({mode: z.literal('hourly'), hourlyCost: z.number().min(0).max(100000)}),
  z.strictObject({
    mode: z.literal('salary'),
    /** monthly GROSS salary */
    monthlyGross: z.number().min(0).max(10_000_000),
    employerCostMultiplier: z.number().min(1).max(3).optional(),
  }),
  /** "I don't know": engine falls back to configured defaults */
  z.strictObject({mode: z.literal('unknown')}),
]);

export const roiAnswersSchema = z
  .strictObject({
    tasks: z.array(taskSchema).max(ROI_TASK_IDS.length),
    labor: laborSchema.optional(),
    workingDays: z.number().min(1).max(31).optional(),
    /** share (0–1) of freed capacity counted as real cost reduction */
    directShare: z.number().min(0).max(1).optional(),
  })
  .superRefine((v, ctx) => {
    const seen = new Set<string>();
    v.tasks.forEach((t, i) => {
      if (seen.has(t.taskId)) {
        ctx.addIssue({code: 'custom', message: 'duplicate taskId', path: ['tasks', i, 'taskId']});
      }
      seen.add(t.taskId);
    });
  });

export type RoiAnswers = z.infer<typeof roiAnswersSchema>;
