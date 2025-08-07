import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductDto } from './dto/update.product.dto';
import { CreateProductDto } from './dto/create.product.dto';
import { ResponseProductDto } from './dto/response.product.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductsService {
  // Inject Prisma service
  // eslint-disable-next-line no-unused-vars
  constructor(private prisma: PrismaService) {}

  // Get max. 20 products by searchTerm
  async getProducts(searchTerm: string): Promise<ResponseProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { category: { contains: searchTerm.toLocaleLowerCase() } },
          { name: { contains: searchTerm.toLocaleLowerCase() } },
          { brand: { contains: searchTerm.toLocaleLowerCase() } },
        ],
      },
      take: 20,
    });
    return products.map((p) => plainToInstance(ResponseProductDto, p));
  }

  // Create product
  async createProduct(data: CreateProductDto): Promise<ResponseProductDto> {
    const product = await this.prisma.product.create({
      data,
    });
    return plainToInstance(ResponseProductDto, product);
  }

  // Update note for user
  async updateProduct(
    productId: string,
    data: UpdateProductDto,
  ): Promise<ResponseProductDto> {
    const product = await this.prisma.product.update({
      where: { productId: productId },
      data,
    });
    return plainToInstance(ResponseProductDto, product);
  }

  // Delete note
  async deleteProduct(productId: string): Promise<ResponseProductDto> {
    const product = await this.prisma.product.delete({
      where: { productId: productId },
    });
    return plainToInstance(ResponseProductDto, product);
  }
}
