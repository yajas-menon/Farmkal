import { PartialType } from '@nestjs/mapped-types';
import { CategoryDTO } from './create-category-dto';

export class updateCategoryDto extends PartialType(CategoryDTO) {}
