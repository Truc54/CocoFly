import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const registerSchema = z.object({
  email: z
    .string({ message: 'Email là bắt buộc' })
    .regex(emailRegex, 'Email không đúng định dạng')
    .refine((val) => !val.includes(' '), 'Email không được chứa khoảng trắng'),
  password: z
    .string({ message: 'Mật khẩu là bắt buộc' })
    .regex(
      passwordRegex,
      'Mật khẩu tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
    ),
  fullName: z
    .string({ message: 'Họ tên là bắt buộc' })
    .min(1, 'Họ tên không được rỗng')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),
});

export const verifyOtpSchema = z.object({
  email: z
    .string({ message: 'Email là bắt buộc' })
    .regex(emailRegex, 'Email không đúng định dạng'),
  code: z
    .string({ message: 'Mã OTP là bắt buộc' })
    .regex(/^\d{6}$/, 'Mã OTP phải là 6 chữ số'),
});

export const resendOtpSchema = z.object({
  email: z
    .string({ message: 'Email là bắt buộc' })
    .regex(emailRegex, 'Email không đúng định dạng'),
});

export const loginSchema = z.object({
  email: z
    .string({ message: 'Email là bắt buộc' })
    .regex(emailRegex, 'Email không đúng định dạng'),
  password: z
    .string({ message: 'Mật khẩu là bắt buộc' })
    .min(1, 'Mật khẩu không được rỗng'),
});
