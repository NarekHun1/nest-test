import { IsString, IsDateString } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  publishedAt: Date;

  @IsString()
  author: string;
}
