import { z } from 'zod';

const email = z.string().trim().email('Enter a valid email address').max(254);

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be 32 characters or less')
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]{3}$/, 'Use letters, numbers, underscores, or hyphens; start and end with a letter or number');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or less')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

export const registrationSchema = z
  .object({
    username: usernameSchema,
    email,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const emailSchema = z.object({ email });

export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const inviteAcceptanceSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const sixDigitCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the six-digit code'),
});

export const recoveryCodeSchema = z.object({
  recoveryCode: z
    .string()
    .trim()
    .min(8, 'Enter a recovery code')
    .transform((value) => value.toUpperCase()),
});

export function validationErrors(
  schema: z.ZodType,
  values: unknown,
): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};

  return result.error.issues.reduce<Record<string, string>>((errors, issue) => {
    const field = issue.path[0];
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = issue.message;
    }
    return errors;
  }, {});
}
