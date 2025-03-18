import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { Article } from './article.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetAllFilterDto } from './dto/get-all.dto';

@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Post()
  async create(@Body() articleData: CreateArticleDto) {
    return this.articlesService.create(articleData);
  }

  @Get()
  async findAll(@Query() filters: GetAllFilterDto): Promise<Article[]> {
    return this.articlesService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.articlesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() articleData: UpdateArticleDto) {
    return this.articlesService.update(id, articleData);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.articlesService.remove(id);
  }
}
