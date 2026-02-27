import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ─── 1. Ticket Statuses ─────────────────────────────
    const statuses = [
        { name: 'Recibido', color: '#3B82F6', sortOrder: 1, isDefault: true, isTerminal: false },
        { name: 'En diagnóstico', color: '#F59E0B', sortOrder: 2, isDefault: false, isTerminal: false },
        { name: 'Esperando aprobación', color: '#EF4444', sortOrder: 3, isDefault: false, isTerminal: false },
        { name: 'Esperando repuestos', color: '#8B5CF6', sortOrder: 4, isDefault: false, isTerminal: false },
        { name: 'En reparación', color: '#F97316', sortOrder: 5, isDefault: false, isTerminal: false },
        { name: 'Reparado', color: '#10B981', sortOrder: 6, isDefault: false, isTerminal: false },
        { name: 'Listo para entrega', color: '#06B6D4', sortOrder: 7, isDefault: false, isTerminal: false },
        { name: 'Entregado', color: '#6B7280', sortOrder: 8, isDefault: false, isTerminal: true },
        { name: 'Cancelado', color: '#DC2626', sortOrder: 9, isDefault: false, isTerminal: true },
    ];

    for (const status of statuses) {
        await prisma.ticketStatus.upsert({
            where: { name: status.name },
            update: status,
            create: status,
        });
    }
    console.log(`  ✅ ${statuses.length} ticket statuses`);

    // ─── 2. Device Categories ───────────────────────────
    const categories = [
        { name: 'Smartphone', icon: '📱', sortOrder: 1 },
        { name: 'Tablet', icon: '📲', sortOrder: 2 },
        { name: 'Laptop', icon: '💻', sortOrder: 3 },
        { name: 'Desktop', icon: '🖥️', sortOrder: 4 },
        { name: 'Consola de videojuegos', icon: '🎮', sortOrder: 5 },
        { name: 'Smartwatch', icon: '⌚', sortOrder: 6 },
        { name: 'Auriculares / Audio', icon: '🎧', sortOrder: 7 },
        { name: 'Otro', icon: '🔧', sortOrder: 99 },
    ];

    const categoryRecords: Record<string, string> = {};
    for (const cat of categories) {
        const record = await prisma.deviceCategory.upsert({
            where: { name: cat.name },
            update: cat,
            create: cat,
        });
        categoryRecords[cat.name] = record.id;
    }
    console.log(`  ✅ ${categories.length} device categories`);

    // ─── 3. Part Categories ─────────────────────────────
    const partCategories = [
        { name: 'Pantallas' },
        { name: 'Baterías' },
        { name: 'Conectores / Puertos' },
        { name: 'Carcasas y marcos' },
        { name: 'Cámaras' },
        { name: 'Altavoces y micrófonos' },
        { name: 'Tornillos y adhesivos' },
        { name: 'Otros repuestos' },
    ];

    for (const pc of partCategories) {
        const existing = await prisma.partCategory.findFirst({
            where: { name: pc.name, parentId: null },
        });
        if (!existing) {
            await prisma.partCategory.create({ data: pc });
        }
    }
    console.log(`  ✅ ${partCategories.length} part categories`);

    // ─── 4. Labor Rate Defaults ─────────────────────────
    const laborRates = [
        { categoryName: 'Smartphone', description: 'Diagnóstico general', ratePerHour: 30000 },
        { categoryName: 'Smartphone', description: 'Cambio de pantalla', ratePerHour: 40000 },
        { categoryName: 'Laptop', description: 'Diagnóstico general', ratePerHour: 45000 },
        { categoryName: 'Laptop', description: 'Mantenimiento preventivo', ratePerHour: 50000 },
        { categoryName: 'Tablet', description: 'Diagnóstico general', ratePerHour: 35000 },
        { categoryName: 'Consola de videojuegos', description: 'Diagnóstico general', ratePerHour: 40000 },
    ];

    for (const lr of laborRates) {
        const catId = categoryRecords[lr.categoryName];
        if (!catId) continue;
        // Check if it already exists to avoid duplicates
        const existing = await prisma.laborRateDefault.findFirst({
            where: { deviceCategoryId: catId, description: lr.description },
        });
        if (!existing) {
            await prisma.laborRateDefault.create({
                data: {
                    deviceCategoryId: catId,
                    description: lr.description,
                    ratePerHour: lr.ratePerHour,
                },
            });
        }
    }
    console.log(`  ✅ ${laborRates.length} labor rate defaults`);

    // ─── 5. Business Profile ────────────────────────────
    const profileCount = await prisma.businessProfile.count();
    if (profileCount === 0) {
        await prisma.businessProfile.create({
            data: {
                name: 'Edwix Repair Shop',
                currency: 'COP',
                footerText: 'Gracias por confiar en nosotros.',
            },
        });
        console.log('  ✅ Business profile created');
    } else {
        console.log('  ⏭️  Business profile already exists, skipped');
    }

    // ─── 6. Default Settings ───────────────────────────
    const settings = [
        { key: 'default_currency', value: 'COP' },
        { key: 'default_tax_rate', value: '19' },
        { key: 'ticket_auto_number', value: 'true' },
        { key: 'low_stock_threshold', value: '5' },
    ];

    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: s,
        });
    }
    console.log(`  ✅ ${settings.length} settings`);

    // ─── 7. Default Admin User ─────────────────────────
    const adminEmail = 'admin@edwix.local';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'Edwix',
                role: 'ADMIN',
                isActive: true,
            },
        });
        console.log('  ✅ Admin user created (admin@edwix.local / Admin123!)');
    } else {
        console.log('  ⏭️  Admin user already exists, skipped');
    }

    console.log('\n✨ Seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
