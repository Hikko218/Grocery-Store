import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductDto } from './dto/update.product.dto';
import { CreateProductDto } from './dto/create.product.dto';
import { ResponseProductDto } from './dto/response.product.dto';
import { type Product, Prisma } from '@prisma/client';

function toProductResponse(p: Product): ResponseProductDto {
  return {
    id: p.id,
    productId: p.productId,
    name: p.name,
    description: p.description ?? undefined,
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

// Check if insensitive search is supported
const SUPPORTS_INSENSITIVE = process.env.INSENSITIVE_SEARCH === 'true';

@Injectable()
export class ProductsService {
  // Inject Prisma service
  // eslint-disable-next-line no-unused-vars
  constructor(private prisma: PrismaService) {}

  // Get a single product by productId
  async getProductById(productId: string): Promise<ResponseProductDto> {
    const p = await this.prisma.product.findUnique({
      where: { productId },
    });
    if (!p) throw new NotFoundException(`Product "${productId}" not found`);
    return toProductResponse(p);
  }

  // Get max. 12 products by searchTerm
  async getProducts(
    searchTerm: string,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    take: number = 12,
    skip: number = 0,
  ): Promise<ResponseProductDto[]> {
    const term = (searchTerm ?? '').trim();
    let where: Prisma.ProductWhereInput | undefined = undefined;

    if (term) {
      const modeOpt = SUPPORTS_INSENSITIVE
        ? { mode: 'insensitive' as const }
        : {};

      where = {
        OR: [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { category: { contains: term, ...modeOpt } as unknown as any },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { name: { contains: term, ...modeOpt } as unknown as any },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { brand: { contains: term, ...modeOpt } as unknown as any },
        ],
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
      take,
      skip,
    });
    return products.map(toProductResponse);
  }

  // Create product
  async createProduct(data: CreateProductDto): Promise<ResponseProductDto> {
    const product = await this.prisma.product.create({
      data: {
        ...data,
        price: data.price !== undefined ? data.price : null,
        name: data.name ?? '',
        brand: data.brand ?? '',
        category: data.category ?? '',
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
