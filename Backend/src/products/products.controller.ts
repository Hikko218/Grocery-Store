import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { HttpCode } from '@nestjs/common';
import { ResponseProductDto } from './dto/response.product.dto';
import { AdminGuard } from '../auth/auth.guard';
import { AuthGuard } from '@nestjs/passport';

// Controller for product-related API endpoints
@Controller('products')
export class ProductsController {
  // Inject ProductsService
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly productsService: ProductsService) {}

  // GET /products/categories - Get all product categories
  @Get('categories')
  @HttpCode(200)
  async categories(): Promise<string[]> {
    try {
      const cats = await this.productsService.getCategories();
      Logger.log(`Successfully received product categories`);
      return cats;
    } catch (error) {
      Logger.error(`Error retrieving product categories: ${error}`);
      throw new NotFoundException('Cant get categories');
    }
  }

  // GET /products - Get products by search term, sorting, and pagination
  @Get('/')
  @HttpCode(200)
  async getProducts(
    @Query('searchTerm') searchTerm: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('take') take: number = 12,
    @Query('skip') skip: number = 0,
    @Query('category') category?: string,
  ): Promise<ResponseProductDto[]> {
    try {
      const products = await this.productsService.getProducts(
        searchTerm,
        sortBy,
        sortOrder,
        Number(take),
        Number(skip),
        category,
      );
      if (!products) {
        throw new NotFoundException('Cant get products');
      }
      Logger.log(`Successfully received products`);
      return products;
    } catch (error) {
      Logger.error(`Error retrieving products: ${error}`);
      throw new NotFoundException('Cant get products');
    }
  }

  // GET /products/:productId - Get product by productId
  @Get(':productId')
  @HttpCode(200)
  async getProductById(
    @Param('productId') productId: string,
  ): Promise<ResponseProductDto> {
    try {
      const product = await this.productsService.getProductById(productId);
      if (!product) {
        throw new NotFoundException(`Product "${productId}" not found`);
      }
      Logger.log(`Successfully received product ${productId}`);
      return product;
    } catch (error) {
      Logger.error(`Error retrieving product ${productId}: ${error}`);
      throw new NotFoundException('Cant get product');
    }
  }

  // POST /products - Create a new product (admin only)
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post()
  @HttpCode(201)
  async createProduct(
    @Body() data: CreateProductDto,
  ): Promise<ResponseProductDto> {
    try {
      const product = await this.productsService.createProduct(data);
      Logger.log(`Successfully created product`);
      return product;
    } catch (error) {
      Logger.error(`Error creating product: ${error}`);
      throw new BadRequestException('Cant create product');
    }
  }

  // PUT /products/:productId - Update product (admin only)
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Put(':productId')
  @HttpCode(200)
  async updateProduct(
    @Param('productId') productId: string,
    @Body() data: UpdateProductDto,
  ): Promise<ResponseProductDto> {
    try {
      const product = await this.productsService.updateProduct(productId, data);
      Logger.log(`Successfully updated product`);
      return product;
    } catch (error) {
      Logger.error(`Error updating product: ${error}`);
      throw new BadRequestException('Cant update product');
    }
  }

  // DELETE /products/:productId - Delete product (admin only)
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete(':productId')
  @HttpCode(200)
  async deleteProduct(
    @Param('productId') productId: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.productsService.deleteProduct(productId);
      Logger.log('Product successfully deleted');
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting product ${productId}: ${error}`);
      throw new BadRequestException('Cant delete product');
    }
  }
}
