import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    console.error(`[ERROR] ${err.message}`, err.stack);
    sendError(res, 'Internal server error', 500, err.message);
}

export function notFound(req: Request, res: Response) {
    sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}
