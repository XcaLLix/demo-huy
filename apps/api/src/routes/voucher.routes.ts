import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import {
  getVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  enableVoucher,
  disableVoucher,
  validateVoucher,
  reserveVoucher
} from '../controllers/voucher.js';

const router = Router();

// Student Checkout validation and reservation
router.post('/enrollments/validate-voucher', authenticateJWT, validateVoucher);
router.post('/enrollments/reserve-voucher', authenticateJWT, reserveVoucher);

// Admin voucher CRUD operations
router.get('/admin/vouchers', authenticateJWT, requireRole(['ADMIN']), getVouchers);
router.get('/admin/vouchers/:id', authenticateJWT, requireRole(['ADMIN']), getVoucherById);
router.post('/admin/vouchers', authenticateJWT, requireRole(['ADMIN']), createVoucher);
router.put('/admin/vouchers/:id', authenticateJWT, requireRole(['ADMIN']), updateVoucher);
router.delete('/admin/vouchers/:id', authenticateJWT, requireRole(['ADMIN']), deleteVoucher);
router.put('/admin/vouchers/:id/enable', authenticateJWT, requireRole(['ADMIN']), enableVoucher);
router.put('/admin/vouchers/:id/disable', authenticateJWT, requireRole(['ADMIN']), disableVoucher);

export default router;
