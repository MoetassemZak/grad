/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
'use server';

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { signUpSchema } from '~/schema';
import { signIn, signOut } from '~/server/auth';
import { db } from '~/server/db';

import  getServerSession  from "next-auth";
import { authConfig } from "~/server/auth/config";

type UserSession = {
  id: string;
  email: string;
  role?: string;
};

export async function getCurrentUser() {
  const session = getServerSession(authConfig);

  if (!session || !("user" in session)) {
    return null;
  }

  const user = session.user as UserSession;

  return {
    id: user.id,
    email: user.email,
    role: user.role ?? null,
  };
}

export async function signout() {
  await signOut();
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    const user = await db.user.findUnique({
      where: { email },
    });
    
    if (user?.role === "CUSTOMER") {
      redirect('/cus_dashboard');
    } else {
      redirect('/des_dashboard');
    }
    
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials';
        default:
          return 'Something went wrong';
      }
    }
    throw error;
  }
}

export async function register(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const { email, password, role } = await signUpSchema.parseAsync({
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
    });

    const user = await db.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      return 'User already exists';
    }

    const hash = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        email: email,
        password: hash,
        role: role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return error.errors.map((error) => error.message).join(', ');
    }
    return 'Something went wrong';
  }

  redirect('/signin');
}