// pagination.dto.ts
import {
  IsInt,
  IsOptional,
  Min,
  IsString,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAllFilterDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : 1))
  page: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @Min(1)
  limit: number;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  constructor() {
    this.page = this.page || 1;
    this.limit = this.limit || 10;
  }
}
