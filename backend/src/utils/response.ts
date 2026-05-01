import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(status).json(response);
}

export function sendError(res: Response, error: string, status = 500, message?: string) {
  const response: ApiResponse = {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
  };
  return res.status(status).json(response);
}
