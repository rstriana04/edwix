import 'dotenv/config';
import { beforeAll, afterAll } from 'vitest';
import { prisma } from './config/database';

beforeAll(async () => {
  // Clean all tables before test suite runs
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.internalAlert.deleteMany(),
    prisma.notificationLog.deleteMany(),
    prisma.notificationTemplate.deleteMany(),
    prisma.assetMaintenance.deleteMany(),
    prisma.assetCheckout.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceLine.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.quoteLine.deleteMany(),
    prisma.quote.deleteMany(),
    prisma.purchaseReceiptItem.deleteMany(),
    prisma.purchaseReceipt.deleteMany(),
    prisma.purchaseOrderItem.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.stockMovement.deleteMany(),
    prisma.ticketPart.deleteMany(),
    prisma.ticketLabor.deleteMany(),
    prisma.ticketNote.deleteMany(),
    prisma.ticketApproval.deleteMany(),
    prisma.ticketStatusChange.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.ticketStatus.deleteMany(),
    prisma.part.deleteMany(),
    prisma.partCategory.deleteMany(),
    prisma.communicationLog.deleteMany(),
    prisma.device.deleteMany(),
    prisma.deviceCategory.deleteMany(),
    prisma.laborRateDefault.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.businessProfile.deleteMany(),
    prisma.setting.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
