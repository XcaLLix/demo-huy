/**
 * seed-stats.ts
 * Tạo dữ liệu mẫu MonthlyStatistic (tháng 1-6/2026)
 * và DailyStatistic chi tiết (tháng 5 + tháng 6/2026).
 *
 * Chạy bằng lệnh:
 *   cd apps/api
 *   npx tsx prisma/seed-stats.ts
 *
 * KHÔNG dùng prisma db seed (seed.ts gốc có deleteMany xóa database).
 */

import dotenv from 'dotenv';
dotenv.config({ path: 'D:/SU2026/Edu Path/swp391-rbl-project-team-1/apps/api/.env' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ────────────────────────────────────────────────────────────
// Monthly seed data (tháng 1-6/2026)
// ────────────────────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: 1, year: 2026, newUsers: 45,  totalAttempts: 320, totalAiQuestions: 1850, revenue: 2100000, totalUsers: 45 },
  { month: 2, year: 2026, newUsers: 62,  totalAttempts: 410, totalAiQuestions: 2100, revenue: 2850000, totalUsers: 107 },
  { month: 3, year: 2026, newUsers: 58,  totalAttempts: 390, totalAiQuestions: 1980, revenue: 2600000, totalUsers: 165 },
  { month: 4, year: 2026, newUsers: 71,  totalAttempts: 520, totalAiQuestions: 2750, revenue: 3400000, totalUsers: 236 },
  { month: 5, year: 2026, newUsers: 83,  totalAttempts: 610, totalAiQuestions: 3200, revenue: 4150000, totalUsers: 319 },
  { month: 6, year: 2026, newUsers: 94,  totalAttempts: 680, totalAiQuestions: 3580, revenue: 5200000, totalUsers: 413 },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function startOfDayUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate(); // month là 1-12
}

/**
 * Phân phối tổng N cho d ngày, tạo pattern tự nhiên tăng dần về cuối tháng.
 * Không dùng Math.random — dùng sin/cos deterministic đã được precomputed.
 */
function distributeDays(total: number, days: number): number[] {
  if (total === 0 || days === 0) return Array(days).fill(0);

  // Tạo weights theo pattern tăng dần (mô phỏng học sinh thi cuối tháng)
  // Dùng giá trị xác định, không random
  const patterns: number[] = [];
  for (let i = 0; i < days; i++) {
    const x = i / (days - 1); // 0..1
    // Kết hợp: tăng dần + bump giữa tháng + cao điểm cuối tháng
    const w = 0.5 + 0.3 * x + 0.2 * (i % 7 < 5 ? 1 : 0.4); // weekday higher
    patterns.push(Math.max(0.1, w));
  }

  const sumW = patterns.reduce((a, b) => a + b, 0);
  const result: number[] = [];
  let allocated = 0;

  for (let i = 0; i < days - 1; i++) {
    const val = Math.round((patterns[i] / sumW) * total);
    result.push(val);
    allocated += val;
  }
  result.push(Math.max(0, total - allocated)); // remainder goes to last day

  return result;
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Bắt đầu seed MonthlyStatistic...\n');

  // ── 1. Seed MonthlyStatistic ──
  for (const data of MONTHLY_DATA) {
    const result = await prisma.monthlyStatistic.upsert({
      where: { month_year: { month: data.month, year: data.year } },
      create: data,
      update: data
    });
    console.log(
      `  ✓ Monthly ${data.month}/${data.year}: ` +
      `newUsers=${result.newUsers}, attempts=${result.totalAttempts}, ` +
      `aiQ=${result.totalAiQuestions}, revenue=${result.revenue.toLocaleString('vi-VN')}đ`
    );
  }

  // ── 2. Seed DailyStatistic cho tháng 5 và tháng 6/2026 ──
  console.log('\n🌱 Bắt đầu seed DailyStatistic...\n');

  const DAILY_MONTHS = [
    { month: 5, year: 2026 },
    { month: 6, year: 2026 }
  ];

  for (const { month, year } of DAILY_MONTHS) {
    const monthly = MONTHLY_DATA.find(m => m.month === month && m.year === year)!;
    const days = daysInMonth(year, month);

    // Nếu là tháng hiện tại (6/2026), chỉ seed đến ngày hôm nay (19)
    const effectiveDays = (month === 6 && year === 2026) ? 19 : days;

    const newUsersDist      = distributeDays(monthly.newUsers, effectiveDays);
    const attemptsDist      = distributeDays(monthly.totalAttempts, effectiveDays);
    const aiQuestionsDist   = distributeDays(monthly.totalAiQuestions, effectiveDays);
    const revenueDist       = distributeDays(monthly.revenue, effectiveDays);

    let count = 0;
    for (let day = 1; day <= effectiveDays; day++) {
      const date = startOfDayUTC(year, month, day);
      const i = day - 1;

      await prisma.dailyStatistic.upsert({
        where: { date },
        create: {
          date,
          newUsers:         newUsersDist[i],
          totalAttempts:    attemptsDist[i],
          totalAiQuestions: aiQuestionsDist[i],
          revenue:          revenueDist[i]
        },
        update: {
          newUsers:         newUsersDist[i],
          totalAttempts:    attemptsDist[i],
          totalAiQuestions: aiQuestionsDist[i],
          revenue:          revenueDist[i]
        }
      });
      count++;
    }

    console.log(
      `  ✓ Daily ${month}/${year}: ${count} ngày | ` +
      `attempts=${monthly.totalAttempts}, aiQ=${monthly.totalAiQuestions}, revenue=${monthly.revenue.toLocaleString('vi-VN')}đ`
    );
  }

  // ── 3. Seed/Update User Data for testing User Management ──
  console.log('\n🌱 Cập nhật dữ liệu người dùng mẫu (ACTIVE/BLOCKED, phone)...');
  
  const usersToUpdate = [
    {
      email: 'admin@edupath.vn',
      update: { status: 'ACTIVE', phone: '0912345678', lastLoginAt: new Date('2026-06-19T10:00:00Z'), isActive: true }
    },
    {
      email: 'theanh.math@edupath.vn',
      update: { status: 'ACTIVE', phone: '0987654321', lastLoginAt: new Date('2026-06-19T09:30:00Z'), isActive: true }
    },
    {
      email: 'huong.physics@edupath.vn',
      update: { status: 'ACTIVE', phone: '0901234567', lastLoginAt: new Date('2026-06-18T15:00:00Z'), isActive: true }
    },
    {
      email: 'student1@gmail.com',
      update: {
        status: 'ACTIVE',
        phone: '0934567890',
        lastLoginAt: new Date('2026-06-19T11:00:00Z'),
        isActive: true,
        student: { update: { totalAiQuestions: 25 } }
      }
    },
    {
      email: 'student2@gmail.com',
      update: {
        status: 'BLOCKED',
        phone: '0945678901',
        isActive: false,
        blockedAt: new Date('2026-06-18T08:00:00Z'),
        blockedReason: 'Vi phạm quy chế thi thử (quay cóp 3 lần)',
        blockedBy: 'admin@edupath.vn'
      }
    },
    {
      email: 'student3@gmail.com',
      update: {
        status: 'BLOCKED',
        phone: '0956789012',
        isActive: false,
        blockedAt: new Date('2026-06-17T12:00:00Z'),
        blockedReason: 'Spam nội dung không phù hợp trên diễn đàn',
        blockedBy: 'admin@edupath.vn'
      }
    },
    {
      email: 'student4@gmail.com',
      update: { status: 'ACTIVE', phone: '0967890123', lastLoginAt: new Date('2026-06-19T12:15:00Z'), isActive: true }
    },
    {
      email: 'student5@gmail.com',
      update: { status: 'ACTIVE', phone: '0978901234', lastLoginAt: null, isActive: true }
    }
  ];

  for (const item of usersToUpdate) {
    try {
      const u = await prisma.user.findUnique({ where: { email: item.email } });
      if (u) {
        await prisma.user.update({
          where: { email: item.email },
          data: item.update as any
        });
        console.log(`  ✓ Đã cập nhật user: ${item.email}`);
      } else {
        console.log(`  ✗ Không tìm thấy user: ${item.email}`);
      }
    } catch (e: any) {
      console.error(`  ✗ Lỗi cập nhật user ${item.email}:`, e.message);
    }
  }

  console.log('\n✅ Seed hoàn tất!');
}

main()
  .catch(err => {
    console.error('❌ Lỗi seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
