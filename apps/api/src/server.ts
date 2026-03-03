import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import customerRouter from './modules/customers/customer.routes';
import deviceRouter from './modules/devices/device.routes';
import ticketRouter from './modules/tickets/ticket.routes';
import partRouter from './modules/parts/part.routes';
import supplierRouter from './modules/suppliers/supplier.routes';
import quoteRouter from './modules/quotes/quote.routes';
import invoiceRouter from './modules/invoices/invoice.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import settingsRouter from './modules/settings/settings.routes';
import assetRouter from './modules/assets/asset.routes';
import notificationRouter from './modules/notifications/notification.routes';
import reportRouter from './modules/reports/report.routes';

export function createApp() {
  const app = express();

  // Security & parsing
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging (skip in test)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // API docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API v1 routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/customers', customerRouter);
  app.use('/api/v1/devices', deviceRouter);
  app.use('/api/v1/tickets', ticketRouter);
  app.use('/api/v1/parts', partRouter);
  app.use('/api/v1/suppliers', supplierRouter);
  app.use('/api/v1/quotes', quoteRouter);
  app.use('/api/v1/invoices', invoiceRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/assets', assetRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/reports', reportRouter);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
