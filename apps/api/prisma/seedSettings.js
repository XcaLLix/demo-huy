import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function seedSystemSettings() {
    console.log('[SeedSettings] Khởi tạo các cấu hình hệ thống mặc định...');
    const defaultSettings = [
        {
            key: 'AI_ENABLED',
            value: 'true',
            type: 'BOOLEAN',
            description: 'Cho phép sử dụng các tính năng trợ lý ảo AI Coach (chat, roadmap, flashcards, mindmap)'
        },
        {
            key: 'REGISTRATION_ENABLED',
            value: 'true',
            type: 'BOOLEAN',
            description: 'Cho phép đăng ký tài khoản mới trên hệ thống'
        },
        {
            key: 'COURSE_CREATION_ENABLED',
            value: 'true',
            type: 'BOOLEAN',
            description: 'Cho phép Giáo viên/Admin tạo khóa học mới'
        },
        {
            key: 'MAINTENANCE_MODE',
            value: 'false',
            type: 'BOOLEAN',
            description: 'Bật chế độ bảo trì hệ thống (chỉ Admin mới truy cập được các tính năng)'
        },
        {
            key: 'FREE_AI_QUESTION_LIMIT',
            value: '20',
            type: 'NUMBER',
            description: 'Số câu hỏi AI miễn phí tối đa mỗi học sinh được hỏi trong ngày'
        },
        {
            key: 'MAX_UPLOAD_SIZE_MB',
            value: '50',
            type: 'NUMBER',
            description: 'Dung lượng tệp tải lên tối đa cho phép (MB) [1 - 500]'
        },
        {
            key: 'PREMIUM_MONTHLY_PRICE',
            value: '199000',
            type: 'NUMBER',
            description: 'Giá gói nâng cấp tài khoản Premium theo tháng (VND)'
        },
        {
            key: 'PREMIUM_YEARLY_PRICE',
            value: '1990000',
            type: 'NUMBER',
            description: 'Giá gói nâng cấp tài khoản Premium theo năm (VND)'
        },
        {
            key: 'LOG_SYNC_INTERVAL_MINUTES',
            value: '5',
            type: 'NUMBER',
            description: 'Chu kỳ tự động đồng bộ System Log vào Google Sheets (phút) [1 - 60]'
        },
        {
            key: 'LOG_RETENTION_DAYS',
            value: '7',
            type: 'NUMBER',
            description: 'Số ngày lưu trữ tối đa của System Log trong Database trước khi xóa [>= 1]'
        }
    ];
    let count = 0;
    for (const setting of defaultSettings) {
        const existing = await prisma.systemSetting.findUnique({
            where: { key: setting.key }
        });
        if (!existing) {
            await prisma.systemSetting.create({
                data: {
                    key: setting.key,
                    value: setting.value,
                    type: setting.type,
                    description: setting.description
                }
            });
            count++;
            console.log(`[SeedSettings] Đã thêm cấu hình mặc định: ${setting.key} = ${setting.value}`);
        }
    }
    console.log(`[SeedSettings] Đã hoàn thành khởi tạo cấu hình. Thêm mới ${count} cấu hình.`);
}
if (process.argv[1]?.includes('seedSettings')) {
    seedSystemSettings()
        .catch((err) => {
        console.error('[SeedSettings Error] Thất bại:', err);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
