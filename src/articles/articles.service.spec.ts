import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('ArticlesService', () => {
  let service: ArticlesService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let articlesRepository: Repository<Article>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let cacheManager: Cache;

  const mockArticleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    articlesRepository = module.get<Repository<Article>>(
      getRepositoryToken(Article),
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create an article', async () => {
      const articleData = { title: 'Test Article', content: 'Test Content' };
      const createdArticle = { id: 1, ...articleData };

      mockArticleRepository.create.mockReturnValue(createdArticle);
      mockArticleRepository.save.mockResolvedValue(createdArticle);

      const result = await service.create(articleData);
      expect(result).toEqual(createdArticle);
      expect(mockArticleRepository.save).toHaveBeenCalledWith(createdArticle);
    });
  });

  describe('findAll', () => {
    it('should return cached articles if present', async () => {
      const filters = { author: 'Author' };
      const cacheKey = `articles:${JSON.stringify(filters)}`;
      const cachedArticles = [
        { id: 1, title: 'Test Article', content: 'Test Content' },
      ];

      mockCacheManager.get.mockResolvedValue(cachedArticles);

      const result = await service.findAll(filters);
      expect(result).toEqual(cachedArticles);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockArticleRepository.createQueryBuilder).not.toHaveBeenCalled(); // Should not query the DB
    });

    it('should return articles from DB if not cached', async () => {
      const filters = { author: 'Author' };
      const cacheKey = `articles:${JSON.stringify(filters)}`;
      const articlesFromDB = [
        { id: 1, title: 'Test Article', content: 'Test Content' },
      ];

      mockCacheManager.get.mockResolvedValue(null); // No cached articles
      mockArticleRepository.getMany.mockResolvedValue(articlesFromDB);

      const result = await service.findAll(filters);
      expect(result).toEqual(articlesFromDB);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        articlesFromDB,
      );
    });
  });

  describe('findOne', () => {
    it('should return a cached article if present', async () => {
      const id = 1;
      const cacheKey = `article:${id}`;
      const cachedArticle = {
        id,
        title: 'Test Article',
        content: 'Test Content',
      };

      mockCacheManager.get.mockResolvedValue(cachedArticle);

      const result = await service.findOne(id);
      expect(result).toEqual(cachedArticle);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
    });

    it('should return an article from DB if not cached', async () => {
      const id = 1;
      const cacheKey = `article:${id}`;
      const articleFromDB = {
        id,
        title: 'Test Article',
        content: 'Test Content',
      };

      mockCacheManager.get.mockResolvedValue(null); // No cached article
      mockArticleRepository.findOne.mockResolvedValue(articleFromDB);

      const result = await service.findOne(id);
      expect(result).toEqual(articleFromDB);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        articleFromDB,
      );
    });

    it('should throw NotFoundException if article does not exist', async () => {
      const id = 1;
      mockArticleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an article and clear the cache', async () => {
      const id = 1;
      const articleData = { title: 'Updated Title' };
      const updatedArticle = { id, ...articleData };

      mockArticleRepository.update.mockResolvedValue(updatedArticle);
      mockCacheManager.clear.mockResolvedValue(undefined);
      mockArticleRepository.findOne.mockResolvedValue(updatedArticle);

      const result = await service.update(id, articleData);
      expect(result).toEqual(updatedArticle);
      expect(mockCacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an article and clear the cache', async () => {
      const id = 1;
      const article = { id, title: 'Test Article' };

      mockArticleRepository.findOne.mockResolvedValue(article);
      mockArticleRepository.delete.mockResolvedValue(undefined);
      mockCacheManager.clear.mockResolvedValue(undefined);

      await service.remove(id);

      expect(mockArticleRepository.delete).toHaveBeenCalledWith(id);
      expect(mockCacheManager.clear).toHaveBeenCalled();
    });

    it('should throw NotFoundException if article is not found', async () => {
      const id = 1;
      mockArticleRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if there is an error deleting the article', async () => {
      const id = 1;
      const article = { id, title: 'Test Article' };

      mockArticleRepository.findOne.mockResolvedValue(article);
      mockArticleRepository.delete.mockRejectedValue(
        new Error('Some DB error'),
      );

      await expect(service.remove(id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
