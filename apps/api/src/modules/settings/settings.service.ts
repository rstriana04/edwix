import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class SettingsService {
  // ── Business Profile ──────────────────────────

  async getBusinessProfile() {
    const profile = await prisma.businessProfile.findFirst();
    if (profile) return profile;

    return prisma.businessProfile.create({
      data: { name: 'Mi Negocio', currency: 'COP' },
    });
  }

  async updateBusinessProfile(data: Prisma.BusinessProfileUpdateInput) {
    const existing = await prisma.businessProfile.findFirst();

    if (existing) {
      return prisma.businessProfile.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.businessProfile.create({
      data: {
        name: (data.name as string) ?? 'Mi Negocio',
        logo: data.logo as string | null,
        address: data.address as string | null,
        phone: data.phone as string | null,
        email: data.email as string | null,
        taxId: data.taxId as string | null,
        footerText: data.footerText as string | null,
        currency: (data.currency as string) ?? 'COP',
      },
    });
  }

  // ── Labor Rates ───────────────────────────────

  async getLaborRates() {
    return prisma.laborRateDefault.findMany({
      include: { deviceCategory: true },
      orderBy: { deviceCategory: { name: 'asc' } },
    });
  }

  async getLaborRateById(id: string) {
    const rate = await prisma.laborRateDefault.findUnique({
      where: { id },
      include: { deviceCategory: true },
    });
    if (!rate) throw new NotFoundError('Labor rate', id);
    return rate;
  }

  async createLaborRate(data: { deviceCategoryId: string; description: string; ratePerHour: number }) {
    const category = await prisma.deviceCategory.findUnique({
      where: { id: data.deviceCategoryId },
    });
    if (!category) throw new NotFoundError('Device category', data.deviceCategoryId);

    return prisma.laborRateDefault.create({
      data: {
        deviceCategoryId: data.deviceCategoryId,
        description: data.description,
        ratePerHour: new Decimal(data.ratePerHour),
      },
      include: { deviceCategory: true },
    });
  }

  async updateLaborRate(id: string, data: Partial<{ deviceCategoryId: string; description: string; ratePerHour: number }>) {
    const existing = await prisma.laborRateDefault.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Labor rate', id);

    if (data.deviceCategoryId) {
      const category = await prisma.deviceCategory.findUnique({
        where: { id: data.deviceCategoryId },
      });
      if (!category) throw new NotFoundError('Device category', data.deviceCategoryId);
    }

    const updateData: Prisma.LaborRateDefaultUpdateInput = {};
    if (data.deviceCategoryId) updateData.deviceCategory = { connect: { id: data.deviceCategoryId } };
    if (data.description !== undefined) updateData.description = data.description;
    if (data.ratePerHour !== undefined) updateData.ratePerHour = new Decimal(data.ratePerHour);

    return prisma.laborRateDefault.update({
      where: { id },
      data: updateData,
      include: { deviceCategory: true },
    });
  }

  async deleteLaborRate(id: string) {
    const existing = await prisma.laborRateDefault.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Labor rate', id);
    return prisma.laborRateDefault.delete({ where: { id } });
  }

  // ── General Settings ──────────────────────────

  async getSettings(prefix?: string) {
    const where: Prisma.SettingWhereInput = prefix
      ? { key: { startsWith: prefix } }
      : {};

    return prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });
  }

  async upsertSetting(key: string, value: string) {
    return prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async deleteSetting(key: string) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) throw new NotFoundError('Setting', key);
    return prisma.setting.delete({ where: { key } });
  }
}

export const settingsService = new SettingsService();
