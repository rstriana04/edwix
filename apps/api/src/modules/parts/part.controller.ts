import { Request, Response, NextFunction } from 'express';
import { partService } from './part.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response';

export const getPartCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parentId = req.query.parentId as string | undefined;
        const categories = await partService.getCategories(
            parentId === '' ? null : parentId
        );
        sendSuccess(res, categories);
    } catch (error) {
        next(error);
    }
};

export const getPartCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await partService.getCategoryById(req.params.id);
        sendSuccess(res, category);
    } catch (error) {
        next(error);
    }
};

export const createPartCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await partService.createCategory(req.body);
        sendCreated(res, category, 'Part category created successfully');
    } catch (error) {
        next(error);
    }
};

export const updatePartCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await partService.updateCategory(req.params.id, req.body);
        sendSuccess(res, category, 'Part category updated successfully');
    } catch (error) {
        next(error);
    }
};

export const getParts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, categoryId, type } = req.query as Record<string, string | undefined>;
        const { total, data } = await partService.getParts(
            Number(page),
            Number(limit),
            search,
            categoryId,
            type
        );
        sendPaginated(res, data, total, Number(page), Number(limit));
    } catch (error) {
        next(error);
    }
};

export const getPartById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const includeMovements = req.query.details === 'true';
        const part = await partService.getPartById(req.params.id, includeMovements);
        sendSuccess(res, part);
    } catch (error) {
        next(error);
    }
};

export const createPart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const part = await partService.createPart(req.body);
        sendCreated(res, part, 'Part created successfully');
    } catch (error) {
        next(error);
    }
};

export const updatePart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const part = await partService.updatePart(req.params.id, req.body);
        sendSuccess(res, part, 'Part updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deletePart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await partService.deletePart(req.params.id);
        sendNoContent(res);
    } catch (error) {
        next(error);
    }
};

export const createStockMovement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.sub;
        const result = await partService.createStockMovement(
            req.params.partId,
            userId,
            req.body
        );
        sendCreated(res, result, 'Stock movement recorded');
    } catch (error) {
        next(error);
    }
};

export const getStockMovements = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = req.query as Record<string, string | undefined>;
        const { total, data } = await partService.getStockMovements(
            req.params.partId,
            Number(page) || 1,
            Number(limit) || 20
        );
        sendPaginated(res, data, total, Number(page) || 1, Number(limit) || 20);
    } catch (error) {
        next(error);
    }
};
