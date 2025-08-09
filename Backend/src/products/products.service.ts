import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductDto } from './dto/update.product.dto';
import { CreateProductDto } from './dto/create.product.dto';
import { ResponseProductDto } from './dto/response.product.dto';
import type { Product } from '@prisma/client';

function toProductResponse(p: Product): ResponseProductDto {
  return {
    id: p.id,
    productId: p.productId,
    name: p.name,
    brand: p.brand ?? undefined,
    category: p.category ?? undefined,
    quantity: p.quantity ?? undefined,
    packaging: p.packaging ?? undefined,
    country: p.country ?? undefined,
    ingredients: p.ingredients ?? undefined,
    calories: p.calories ?? undefined,
    price:
      p.price !== null && p.price !== undefined ? Number(p.price) : undefined,
    imageUrl: p.imageUrl ?? undefined,
    createdAt: p.createdAt,
  };
}

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
    return products.map(toProductResponse);
  }

  // Create product
  async createProduct(data: CreateProductDto): Promise<ResponseProductDto> {
    const product = await this.prisma.product.create({
      data: {
        ...data,
        price: data.price !== undefined ? data.price : null,
      },
    });
    return toProductResponse(product);
  }

  // Update note for user
  async updateProduct(
    productId: string,
    data: UpdateProductDto,
  ): Promise<ResponseProductDto> {
    const updated = await this.prisma.product.update({
      where: { productId },
      data: {
        ...data,
        price: data.price !== undefined ? data.price : null,
      },
    });
    return toProductResponse(updated);
  }

  // Delete note
  async deleteProduct(productId: string): Promise<{ success: boolean }> {
    await this.prisma.product.delete({ where: { productId } });
    return { success: true };
  }
}
