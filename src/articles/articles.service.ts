import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { GetAllFilterDto } from './dto/get-all.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articlesRepository: Repository<Article>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(articleData: Partial<Article>): Promise<Article> {
    const article = this.articlesRepository.create(articleData);
    await this.cacheManager.clear();
    return this.articlesRepository.save(article);
  }

  async findAll(filters: GetAllFilterDto): Promise<Article[]> {
    const { page, limit, author, startDate, endDate } = filters;

    const cacheKey = `articles:${JSON.stringify(filters)}`;

    const cachedArticles = await this.cacheManager.get<Article[]>(cacheKey);
    if (cachedArticles) {
      console.log('Returned from cache');
      return cachedArticles;
    }

    const queryBuilder = this.articlesRepository.createQueryBuilder('article');

    if (author) {
      queryBuilder.andWhere('article.author = :author', { author });
    }

    if (startDate) {
      queryBuilder.andWhere('article.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('article.createdAt <= :endDate', { endDate });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const articles = await queryBuilder.getMany();

    await this.cacheManager.set(cacheKey, articles);

    return articles;
  }

  async findOne(id: number): Promise<Article> {
    const cacheKey = this.buildCacheKey(id);

    const cachedArticle = await this.cacheManager.get<Article>(cacheKey);
    if (cachedArticle) {
      console.log('Returned from cache');
      return cachedArticle;
    } else {
      console.log(`Not found in cache ${cacheKey}`);
    }

    const article = await this.articlesRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.cacheManager.set(cacheKey, article);
    console.log('Added to cache', cacheKey);
    return article;
  }

  async update(id: number, articleData: Partial<Article>): Promise<Article> {
    await this.articlesRepository.update(id, articleData);
    await this.cacheManager.clear();
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const cacheKey = `article:${id}`;
    const article = await this.findOne(id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    try {
      await this.articlesRepository.delete(id);
      await this.cacheManager.clear();
    } catch (error) {
      console.error('Error deleting article:', error);
      throw new InternalServerErrorException('Failed to delete article');
    }
  }
  private buildCacheKey(id: number): string {
    return `article:${id}`;
  }
}
