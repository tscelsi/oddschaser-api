import { Price } from 'types';
import { supabase } from "./supabase/supabase-client";

export const getURL = () => {
  const url =
    process?.env?.URL && process.env.URL !== ''
      ? process.env.URL
      : process?.env?.VERCEL_URL && process.env.VERCEL_URL !== ''
        ? process.env.VERCEL_URL
        : 'http://localhost:3000';
  return url.includes('http') ? url : `https://${url}`;
};

export const getData = async ({ url, data, params }: { url: string; data?: object; params?: Record<string, string>; }) => {

  const session = supabase.auth.session();
  const token = session?.access_token;

  const full_url = params ? url + "?" + new URLSearchParams(params) : url;

  const res: Response = await fetch(full_url, {
    method: 'GET',
    headers: token ? new Headers({ 'Content-Type': 'application/json', token }) : new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    console.log('Error in postData', { url, token, data, res });

    throw Error('Error making request');
  }

  return res.json();
};

export const postData = async ({ url, data, }: { url: string; data?: object; }) => {

  const session = supabase.auth.session();
  const token = session?.access_token;

  const res: Response = await fetch(url, {
    method: 'POST',
    headers: token ? new Headers({ 'Content-Type': 'application/json', token }) : new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    console.log('Error in postData', { url, token, data, res });

    throw Error('Error making request');
  }

  return res.json();
};

export const toDateTime = (secs: number) => {
  var t = new Date('1970-01-01T00:30:00Z'); // Unix epoch start.
  t.setSeconds(secs);
  return t;
};

export const hexToRgb = (input: string) => {
  input = input + "";
  input = input.replace("#", "");
  let hexRegex = /[0-9A-Fa-f]/g;
  if (!hexRegex.test(input) || (input.length !== 3 && input.length !== 6)) {
    throw new Error("input is not a valid hex color.");
  }
  if (input.length === 3) {
    let first = input[0];
    let second = input[1];
    let last = input[2];
    input = first + first + second + second + last + last;
  }
  input = input.toUpperCase();
  let first = input[0] + input[1];
  let second = input[2] + input[3];
  let last = input[4] + input[5];
  return parseInt(first, 16) + ", " + parseInt(second, 16) + ", " + parseInt(last, 16);
};

export const parseUrlArgs = (url: string) => {
  let paramString = url.split("#")[1];
  return new URLSearchParams(paramString);
}