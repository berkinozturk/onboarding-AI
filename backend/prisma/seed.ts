import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create initial badges
  const coffeeBadge = await prisma.badge.create({
    data: {
      id: 'coffee-explorer',
      name: 'Coffee Explorer',
      description: 'Successfully located the sacred coffee machine',
      icon: 'coffee',
      requiredXP: 50,
      image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?q=80&w=200'
    }
  });

  const safetyBadge = await prisma.badge.create({
    data: {
      id: 'safety-first',
      name: 'Safety Champion',
      description: 'Demonstrated commitment to workplace safety',
      icon: 'shield',
      requiredXP: 75,
      image: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=200'
    }
  });

  const teamBadge = await prisma.badge.create({
    data: {
      id: 'team-player',
      name: 'Team Player',
      description: 'Successfully connected with team members',
      icon: 'users',
      requiredXP: 100,
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=200'
    }
  });

  // Create initial questions
  await prisma.question.create({
    data: {
      id: '1',
      text: "Have you found the coffee machine in the break room? It's an essential part of our office culture!",
      type: 'boolean',
      category: 'Office Navigation',
      xpReward: 50,
      order: 1,
      badge: {
        connect: { id: coffeeBadge.id }
      }
    }
  });

  await prisma.question.create({
    data: {
      id: '2',
      text: 'Do you know where to find the emergency exits? Safety first!',
      type: 'boolean',
      category: 'Safety',
      xpReward: 75,
      order: 2,
      badge: {
        connect: { id: safetyBadge.id }
      }
    }
  });

  await prisma.question.create({
    data: {
      id: '3',
      text: 'Have you met your team members? Building connections is important!',
      type: 'boolean',
      category: 'Team Building',
      xpReward: 100,
      order: 3,
      badge: {
        connect: { id: teamBadge.id }
      }
    }
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 