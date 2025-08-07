import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { HttpCode } from '@nestjs/common';
import { ResponseProductDto } from './dto/response.product.dto';

@Controller('products')
export class ProductsController {
  // Service injection
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly productsService: ProductsService) {}

  // GET /products?searchTerm=salt
  @Get('/')
  @HttpCode(200)
  async getProducts(
    @Query('searchTerm') searchTerm: string,
  ): Promise<ResponseProductDto[]> {
    try {
      const products = await this.productsService.getProducts(searchTerm);
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

  // POST /products
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

  // PUT /products/:productId
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

  // DELETE /products/:productId
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
