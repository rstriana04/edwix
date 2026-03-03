import { Prisma, AssetStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/errors';

const assetInclude = {
  checkouts: {
    where: { checkedInAt: null },
    take: 1,
    include: {
      checkedOutTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      checkedOutBy: { select: { id: true, firstName: true, lastName: true } },
    },
  },
};

export class AssetService {
  async list(
    page: number,
    limit: number,
    search?: string,
    status?: AssetStatus,
    category?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {
      ...(status ? { status } : {}),
      ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { serialNumber: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        include: assetInclude,
        orderBy: { name: 'asc' },
      }),
    ]);

    return { total, data };
  }

  async getById(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: assetInclude,
    });
    if (!asset) throw new NotFoundError('Asset', id);
    return asset;
  }

  async create(data: Prisma.AssetUncheckedCreateInput) {
    return prisma.asset.create({
      data: {
        ...data,
        status: AssetStatus.AVAILABLE,
        purchaseCost: data.purchaseCost != null ? new Decimal(data.purchaseCost as any) : null,
        photos: data.photos ?? [],
      },
      include: assetInclude,
    });
  }

  async update(id: string, data: Prisma.AssetUncheckedUpdateInput) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundError('Asset', id);

    const updateData = { ...data };
    if (data.purchaseCost !== undefined) {
      updateData.purchaseCost = data.purchaseCost != null ? new Decimal(data.purchaseCost as any) : null;
    }

    return prisma.asset.update({
      where: { id },
      data: updateData,
      include: assetInclude,
    });
  }

  async delete(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { checkouts: { where: { checkedInAt: null }, take: 1 } },
    });
    if (!asset) throw new NotFoundError('Asset', id);

    if (asset.checkouts.length > 0) {
      throw new BadRequestError('Cannot delete an asset with an active checkout. Check it in first.');
    }

    await prisma.$transaction([
      prisma.assetMaintenance.deleteMany({ where: { assetId: id } }),
      prisma.assetCheckout.deleteMany({ where: { assetId: id } }),
      prisma.asset.delete({ where: { id } }),
    ]);
  }

  async checkout(
    assetId: string,
    checkedOutToId: string,
    checkedOutById: string,
    notes?: string | null,
  ) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundError('Asset', assetId);
    if (asset.status !== AssetStatus.AVAILABLE) {
      throw new BadRequestError('Asset must be in AVAILABLE status to check out.');
    }

    const user = await prisma.user.findUnique({ where: { id: checkedOutToId } });
    if (!user) throw new NotFoundError('User', checkedOutToId);

    const [, checkout] = await prisma.$transaction([
      prisma.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.IN_USE },
      }),
      prisma.assetCheckout.create({
        data: {
          assetId,
          checkedOutToId,
          checkedOutById,
          notes: notes ?? null,
        },
        include: {
          checkedOutTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          checkedOutBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return checkout;
  }

  async checkin(assetId: string, notes?: string | null) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundError('Asset', assetId);
    if (asset.status !== AssetStatus.IN_USE) {
      throw new BadRequestError('Asset must be in IN_USE status to check in.');
    }

    const activeCheckout = await prisma.assetCheckout.findFirst({
      where: { assetId, checkedInAt: null },
    });
    if (!activeCheckout) {
      throw new BadRequestError('No active checkout found for this asset.');
    }

    await prisma.$transaction([
      prisma.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.AVAILABLE },
      }),
      prisma.assetCheckout.update({
        where: { id: activeCheckout.id },
        data: {
          checkedInAt: new Date(),
          notes: notes != null ? notes : activeCheckout.notes,
        },
      }),
    ]);

    return prisma.asset.findUnique({
      where: { id: assetId },
      include: assetInclude,
    });
  }

  async addMaintenance(
    assetId: string,
    performedById: string,
    data: {
      description: string;
      cost?: number | null;
      performedAt?: Date;
      nextMaintenanceDate?: Date | null;
      notes?: string | null;
    },
  ) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundError('Asset', assetId);
    if (asset.status === AssetStatus.RETIRED) {
      throw new BadRequestError('Cannot add maintenance to a retired asset.');
    }

    const [, maintenance] = await prisma.$transaction([
      prisma.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.MAINTENANCE },
      }),
      prisma.assetMaintenance.create({
        data: {
          assetId,
          performedById,
          description: data.description,
          cost: data.cost != null ? new Decimal(data.cost) : null,
          performedAt: data.performedAt ?? new Date(),
          nextMaintenanceDate: data.nextMaintenanceDate ?? null,
          notes: data.notes ?? null,
        },
        include: {
          performedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return maintenance;
  }

  async getCheckouts(assetId: string, page: number, limit: number) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundError('Asset', assetId);

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      prisma.assetCheckout.count({ where: { assetId } }),
      prisma.assetCheckout.findMany({
        where: { assetId },
        skip,
        take: limit,
        include: {
          checkedOutTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          checkedOutBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { checkedOutAt: 'desc' },
      }),
    ]);

    return { total, data };
  }

  async getMaintenanceLog(assetId: string, page: number, limit: number) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundError('Asset', assetId);

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      prisma.assetMaintenance.count({ where: { assetId } }),
      prisma.assetMaintenance.findMany({
        where: { assetId },
        skip,
        take: limit,
        include: {
          performedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { performedAt: 'desc' },
      }),
    ]);

    return { total, data };
  }
}

export const assetService = new AssetService();
