const { z } = require('zod');

const sprintCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Sprint name is required'),
    projectId: z.string().min(1, 'Project ID is required'),
    goal: z.string().min(2, 'Sprint goal is required'),
    startDate: z.string(),
    endDate: z.string()
  })
});

module.exports = { sprintCreateSchema };
