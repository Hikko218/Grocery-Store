import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductDto } from './dto/update.product.dto';
import { CreateProductDto } from './dto/create.product.dto';
import { ResponseProductDto } from './dto/response.product.dto';
import { type Product, Prisma } from '@prisma/client';

// Service for product management and database operations

// Helper: Convert Product model to response DTO
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

// Check if insensitive search is enabled via environment variable

// Helper: Build Prisma string filter for search
// Check if insensitive search is supported
const SUPPORTS_INSENSITIVE = process.env.INSENSITIVE_SEARCH === 'true';

// Type savety helper for string filter
const containsFilter = (value: string): Prisma.StringFilter<'Product'> => {
  return SUPPORTS_INSENSITIVE
    ? ({
        contains: value,
        mode: 'insensitive',
      } as unknown as Prisma.StringFilter<'Product'>)
    : ({ contains: value } as Prisma.StringFilter<'Product'>);
};

@Injectable()
// Provides product CRUD operations and category retrieval
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

  // Get products by search term, category, sorting, and pagination
  async getProducts(
    searchTerm: string,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    take: number = 12,
    skip: number = 0,
    category?: string,
  ): Promise<ResponseProductDto[]> {
    const term = (searchTerm ?? '').trim();
    const cat = (category ?? '').trim();
    let where: Prisma.ProductWhereInput | undefined = undefined;

    if (cat) {
      where = {
        category: containsFilter(cat),
      };
    } else if (term) {
      where = {
        OR: [
          { category: containsFilter(term) },
          { name: containsFilter(term) },
          { brand: containsFilter(term) },
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

  // Get all product categories
  async getCategories(): Promise<string[]> {
    const rows = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows
      .map((r) => r.category)
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
  }

  // Create a new product
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

  // Update an existing product
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

  // Delete a product by productId
  async deleteProduct(productId: string): Promise<{ success: boolean }> {
    await this.prisma.product.delete({ where: { productId } });
    return { success: true };
  }
}
