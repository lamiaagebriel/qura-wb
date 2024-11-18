"use client";

import dynamic from "next/dynamic";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";

export const ThemeProvider = dynamic<ThemeProviderProps>(
	() => Promise.resolve(({ ...props }) => <NextThemesProvider {...props} />),
	{ ssr: false },
);
