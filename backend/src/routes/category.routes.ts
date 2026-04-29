import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

export const categoryRoutes = Router();
const categoryController = new CategoryController();

categoryRoutes.get('/', categoryController.getCategories.bind(categoryController));
