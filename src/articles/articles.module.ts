import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { Article } from './article.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), ConfigModule],
  providers: [ArticlesService],
  controllers: [ArticlesController],
  exports: [],
})
export class ArticlesModule {}
