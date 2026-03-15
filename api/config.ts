import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
  });
}
