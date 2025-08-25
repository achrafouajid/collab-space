import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
    },
  });

  console.log('👥 Created users:', { adminUser, regularUser });

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'laptop-001' },
      update: {},
      create: {
        id: 'laptop-001',
        name: 'MacBook Pro 16"',
        description: 'High-performance laptop for professionals',
        price: 2499.99,
        stock: 10,
        category: 'Electronics',
        imageUrl: 'https://example.com/macbook.jpg',
      },
    }),
    prisma.product.upsert({
      where: { id: 'phone-001' },
      update: {},
      create: {
        id: 'phone-001',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced features',
        price: 999.99,
        stock: 25,
        category: 'Electronics',
        imageUrl: 'https://example.com/iphone.jpg',
      },
    }),
    prisma.product.upsert({
      where: { id: 'headphones-001' },
      update: {},
      create: {
        id: 'headphones-001',
        name: 'AirPods Pro',
        description: 'Wireless noise-canceling headphones',
        price: 249.99,
        stock: 50,
        category: 'Electronics',
        imageUrl: 'https://example.com/airpods.jpg',
      },
    }),
  ]);

  console.log('📦 Created products:', products);

  // Create sample order
  const order = await prisma.order.create({
    data: {
      userId: regularUser.id,
      status: 'PENDING',
      totalAmount: 1249.98,
      orderItems: {
        create: [
          {
            productId: products[1].id, // iPhone
            quantity: 1,
            price: 999.99,
          },
          {
            productId: products[2].id, // AirPods
            quantity: 1,
            price: 249.99,
          },
        ],
      },
    },
    include: {
      orderItems: true,
    },
  });

  console.log('🛒 Created order:', order);

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 