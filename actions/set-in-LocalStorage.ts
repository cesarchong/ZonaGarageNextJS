/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

export const setInLocalstorage = (key: string, value: any) => {
    return localStorage.setItem(key, JSON.stringify(value))
}