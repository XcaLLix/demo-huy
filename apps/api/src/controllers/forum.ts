import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getIO } from '../lib/socket.js';
import { awardForumEffortPoints } from './gamification.js';
import { LeaderboardService } from '../services/leaderboard.service.js';

// =========================================================================
// FORUM CACHE SYSTEM (SWR)
// =========================================================================

class ForumCache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly TTL = 8000; // 8 seconds SWR fresh duration

  public static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.TTL) {
      return entry.data;
    }
    return null;
  }

  public static set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public static clear() {
    this.cache.clear();
  }
}

// =========================================================================
// HELPERS
// =========================================================================

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function getLevelFromXP(xp: number): number {
  let level = 1;
  while (xp >= Math.floor(100 * Math.pow(level, 1.5))) {
    level++;
  }
  return level - 1 || 1;
}

const TOXIC_WORDS = [
  'địt', 'đéo', 'vcl', 'đcm', 'đệt', 'đũy', 'dâm', 'khiêu dâm', 'lô đề', 'soi cầu',
  'nhà cái', 'cá độ', 'cờ bạc', 'tuyển ctv', 'kiem tien online', 'kiếm tiền online',
  'mua bán acc', 'hack game', 'sex', 'phim người lớn', 'đĩ', 'chịch', 'nứng'
];

async function moderateContent(title: string, content: string): Promise<{ isSafe: boolean; reason?: string }> {
  const combinedText = `${title} ${content}`.toLowerCase();

  // 1. Local checks
  for (const word of TOXIC_WORDS) {
    if (combinedText.includes(word)) {
      return { isSafe: false, reason: `Nội dung phát hiện từ ngữ thô tục hoặc spam: "${word}"` };
    }
  }

  // 2. OpenRouter AI checks
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { isSafe: true };
  }

  try {
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
    const systemPrompt = `Bạn là AI kiểm duyệt nội dung của diễn đàn giáo dục EduPath. Hãy kiểm tra nội dung sau xem có vi phạm: quảng cáo rác (spam), cá độ, cờ bạc, lừa đảo, hoặc từ ngữ thô tục, bạo lực, 18+.
Hãy trả về duy nhất định dạng JSON sau:
{
  "isSafe": true hoặc false,
  "reason": "Lý do bằng tiếng Việt nếu không an toàn, nếu an toàn thì để rỗng"
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edupath.vn',
        'X-Title': 'EduPath Forum Moderation'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Tiêu đề: ${title}\nNội dung: ${content}` }
        ],
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (response.ok) {
      const resData = (await response.json()) as any;
      const contentText = resData.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(contentText.trim().replace(/^```json|```$/g, ''));
        return {
          isSafe: typeof parsed.isSafe === 'boolean' ? parsed.isSafe : true,
          reason: parsed.reason || undefined
        };
      } catch (e) {
        if (contentText.toLowerCase().includes('"issafe": false') || contentText.toLowerCase().includes('false')) {
          return { isSafe: false, reason: 'Nội dung không hợp lệ hoặc chứa từ ngữ không chuẩn mực.' };
        }
      }
    }
  } catch (err: any) {
    console.error('[AI Moderation Error]', err.message);
  }

  return { isSafe: true };
}

// Award reputation XP and recalculate levels and badges
async function awardXP(userId: number, points: number, action: any, referenceId?: string) {
  try {
    // 1. Create ReputationHistory log
    await prisma.reputationHistory.create({
      data: {
        userId,
        points,
        action,
        referenceId
      }
    });

    // Award effort points
    let effortPoints = 0;
    if (action === 'POST_CREATED') effortPoints = 10;
    else if (action === 'COMMENT_CREATED') effortPoints = 5;
    else if (action === 'UPVOTE_RECEIVED') effortPoints = 15;
    else if (action === 'ACCEPTED_ANSWER') effortPoints = 50;
    else if (action === 'RESOURCE_DOWNLOADED') effortPoints = 5;

    if (points < 0 && effortPoints > 0) {
      effortPoints = -effortPoints;
    }

    if (effortPoints !== 0) {
      await awardForumEffortPoints(userId, effortPoints);
    }

    // 2. Fetch or initialize UserGamification
    let gamify = await prisma.userGamification.findUnique({
      where: { userId }
    });

    if (!gamify) {
      gamify = await prisma.userGamification.create({
        data: {
          userId,
          level: 1,
          xp: 0,
          streakDays: 0,
          milestonesReached: []
        }
      });
    }

    const nextXP = Math.max(0, gamify.xp + points);
    const nextLevel = getLevelFromXP(nextXP);
    const leveledUp = nextLevel > gamify.level;

    await prisma.userGamification.update({
      where: { userId },
      data: {
        xp: nextXP,
        level: nextLevel,
        lastActiveDate: new Date()
      }
    });

    // 3. Trigger notification on level up
    if (leveledUp) {
      await prisma.notification.create({
        data: {
          userId,
          title: '🎉 Lên cấp độ mới!',
          message: `Chúc mừng bạn đã đạt cấp độ ${nextLevel} trên diễn đàn EduPath!`
        }
      });
    }

    // 4. Badge checks
    await checkAndAwardBadges(userId);

  } catch (err) {
    console.error('[XP Award Error]', err);
  }
}

async function checkAndAwardBadges(userId: number) {
  try {
    // Standard badges definition helper
    const badges: Array<{ name: string; desc: string; cat: string; code: string; req: { posts?: number; solutions?: number; xp?: number } }> = [
      { name: 'Khởi đầu', desc: 'Đã tạo câu hỏi đầu tiên trên diễn đàn', cat: 'POSTING', code: 'FIRST_POST', req: { posts: 1 } },
      { name: 'Chuyên gia giải đáp', desc: 'Có 5 câu trả lời được chấp nhận là Lời giải hay', cat: 'ANSWERS', code: 'GURU', req: { solutions: 5 } },
      { name: 'Cây sáng kiến', desc: 'Đạt điểm uy tín (XP) từ 500 trở lên', cat: 'REPUTATION', code: 'POPULAR', req: { xp: 500 } }
    ];

    // Get user statistics
    const postsCount = await prisma.forumPost.count({ where: { authorId: userId } });
    const solutionsCount = await prisma.forumComment.count({ where: { authorId: userId, isSolution: true } });
    const gamify = await prisma.userGamification.findUnique({ where: { userId } });
    const xpCount = gamify?.xp || 0;

    for (const badgeInfo of badges) {
      // Check if user already unlocked this badge
      const existingBadge = await prisma.badge.findUnique({
        where: { name: badgeInfo.name }
      });

      let badgeId = existingBadge?.id;

      if (!existingBadge) {
        const newB = await prisma.badge.create({
          data: {
            name: badgeInfo.name,
            description: badgeInfo.desc,
            iconUrl: `/assets/badges/${badgeInfo.code.toLowerCase()}.svg`,
            category: badgeInfo.cat as any,
            criteria: badgeInfo.req
          }
        });
        badgeId = newB.id;
      }

      const userHasBadge = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badgeId! } }
      });

      if (!userHasBadge) {
        let qualifies = false;
        if (badgeInfo.code === 'FIRST_POST' && badgeInfo.req.posts !== undefined && postsCount >= badgeInfo.req.posts) qualifies = true;
        if (badgeInfo.code === 'GURU' && badgeInfo.req.solutions !== undefined && solutionsCount >= badgeInfo.req.solutions) qualifies = true;
        if (badgeInfo.code === 'POPULAR' && badgeInfo.req.xp !== undefined && xpCount >= badgeInfo.req.xp) qualifies = true;


        if (qualifies) {
          await prisma.userBadge.create({
            data: { userId, badgeId: badgeId! }
          });
          await prisma.notification.create({
            data: {
              userId,
              title: '🎖️ Nhận huy hiệu mới!',
              message: `Bạn đã mở khóa huy hiệu: "${badgeInfo.name}"!`
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('[Badge Checking Error]', err);
  }
}

// =========================================================================
// CATEGORY CONTROLLERS
// =========================================================================

export async function getCategories(req: AuthRequest, res: Response) {
  try {
    const list = await prisma.forumCategory.findMany({
      include: {
        subCategories: true
      }
    });
    // Filter root level categories
    const rootCategories = list.filter(cat => cat.parentId === null);
    return res.status(200).json({ success: true, data: rootCategories });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createCategory(req: AuthRequest, res: Response) {
  const { name, description, parentId, allowedRoles } = req.body;
  try {
    const newCat = await prisma.forumCategory.create({
      data: {
        name,
        slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
        description,
        parentId: parentId ? Number(parentId) : null,
        allowedRoles: allowedRoles || ['STUDENT', 'TEACHER', 'ADMIN']
      }
    });
    return res.status(201).json({ success: true, data: newCat });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    await prisma.forumCategory.delete({
      where: { id: Number(id) }
    });
    return res.status(200).json({ success: true, data: 'Xóa danh mục diễn đàn thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// POST CONTROLLERS
// =========================================================================

export async function getPosts(req: AuthRequest, res: Response) {
  const { categoryId, tag, search, postType, studyGroupId, sort, difficulty, hasAttachment, resolved, dateRange, isSaved } = req.query;
  const userId = req.user?.id;

  const cacheKey = `posts:${categoryId || ''}_${tag || ''}_${search || ''}_${postType || ''}_${studyGroupId || ''}_${sort || ''}_${difficulty || ''}_${hasAttachment || ''}_${resolved || ''}_${dateRange || ''}_${isSaved || ''}_${userId || ''}`;
  const cachedData = ForumCache.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({ success: true, data: cachedData });
  }

  try {
    const filters: any = { isDraft: false };

    if (categoryId) filters.categoryId = Number(categoryId);
    if (postType) filters.postType = postType as any;
    if (studyGroupId) filters.studyGroupId = Number(studyGroupId);
    else if (!categoryId) {
      filters.studyGroupId = null;
    }

    if (difficulty) {
      filters.difficulty = difficulty as any;
    }

    if (hasAttachment === 'true') {
      filters.resource = { isNot: null };
    }

    if (resolved === 'true') {
      filters.comments = { some: { isSolution: true } };
    } else if (resolved === 'false') {
      filters.comments = { none: { isSolution: true } };
    }

    if (dateRange) {
      const now = new Date();
      let startDate: Date | null = null;
      if (dateRange === '24h') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (dateRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (startDate) {
        filters.createdAt = { gte: startDate };
      }
    }

    if (isSaved === 'true' && userId) {
      filters.savedBy = {
        some: {
          userId: userId
        }
      };
    }

    if (search) {
      filters.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { content: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (tag) {
      filters.tags = {
        some: {
          slug: slugify(String(tag))
        }
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'views') {
      orderBy = { viewsCount: 'desc' };
    } else if (sort === 'pinned') {
      orderBy = [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ];
    }

    const posts = await prisma.forumPost.findMany({
      where: filters,
      orderBy,
      include: {
        category: { select: { name: true, slug: true } },
        author: { select: { fullName: true, avatarUrl: true, email: true } },
        tags: true,
        _count: {
          select: { comments: true }
        },
        reactions: {
          select: { userId: true, type: true }
        },
        savedBy: {
          where: { userId: userId || 0 },
          select: { id: true }
        },
        resource: true
      }
    });

    const mapped = posts.map(p => {
      const upvotes = p.reactions.filter(r => r.type === 'UPVOTE' || r.type === 'LIKE' || r.type === 'LOVE' || r.type === 'LAUGH' || r.type === 'CLAP').length;
      const downvotes = p.reactions.filter(r => r.type === 'DOWNVOTE').length;
      const likedBy = p.reactions.map(r => r.userId);
      const isBookmarked = p.savedBy.length > 0;
      
      const reactionCounts: Record<string, number> = {};
      p.reactions.forEach(r => {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      });

      const userReaction = p.reactions.find(r => r.userId === userId)?.type || null;

      const { reactions, savedBy, ...rest } = p;
      return {
        ...rest,
        likes: upvotes - downvotes,
        likedBy,
        isSaved: isBookmarked,
        reactionCounts,
        userReaction,
        comments: new Array(p._count.comments).fill(null)
      };
    });

    ForumCache.set(cacheKey, mapped);

    return res.status(200).json({ success: true, data: mapped });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getPostById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        author: { select: { fullName: true, avatarUrl: true, email: true } },
        tags: true,
        reactions: true,
        savedBy: {
          where: { userId: userId || 0 },
          select: { id: true }
        },
        resource: true
      }
    });

    if (!post) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết này!' });
    }

    await prisma.forumPost.update({
      where: { id: Number(id) },
      data: { viewsCount: { increment: 1 } }
    });

    const upvotes = post.reactions.filter(r => r.type === 'UPVOTE' || r.type === 'LIKE' || r.type === 'LOVE' || r.type === 'LAUGH' || r.type === 'CLAP').length;
    const downvotes = post.reactions.filter(r => r.type === 'DOWNVOTE').length;
    const likedBy = post.reactions.map(r => r.userId);
    const isBookmarked = post.savedBy.length > 0;

    const reactionCounts: Record<string, number> = {};
    post.reactions.forEach(r => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    const userReaction = post.reactions.find(r => r.userId === userId)?.type || null;

    const { reactions, savedBy, ...rest } = post;
    const mapped = {
      ...rest,
      likes: upvotes - downvotes,
      likedBy,
      isSaved: isBookmarked,
      reactionCounts,
      userReaction
    };

    return res.status(200).json({ success: true, data: mapped });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createPost(req: AuthRequest, res: Response) {
  const { title, content, categoryId, postType, difficulty, tags, studyGroupId, resourceFile } = req.body;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const modResult = await moderateContent(title || '', content || '');
    if (!modResult.isSafe) {
      return res.status(400).json({ success: false, error: modResult.reason || 'Nội dung vi phạm tiêu chuẩn cộng đồng.' });
    }

    const slug = `${slugify(title)}-${Date.now().toString().slice(-6)}`;

    // Prepare tags
    const tagConnectOrCreate = (tags || []).map((t: string) => ({
      where: { name: t },
      create: { name: t, slug: slugify(t) }
    }));

    const newPost = await prisma.forumPost.create({
      data: {
        title,
        content,
        slug,
        postType: postType || 'GENERAL',
        categoryId: Number(categoryId),
        authorId,
        difficulty: difficulty || null,
        studyGroupId: studyGroupId ? Number(studyGroupId) : null,
        tags: {
          connectOrCreate: tagConnectOrCreate
        }
      },
      include: {
        category: true,
        author: { select: { fullName: true, avatarUrl: true } }
      }
    });

    // If resource type, add resource metadata
    if (postType === 'RESOURCE' && resourceFile) {
      await prisma.resourceShare.create({
        data: {
          postId: newPost.id,
          fileUrl: resourceFile.fileUrl,
          fileType: resourceFile.fileType || 'PDF',
          fileSize: resourceFile.fileSize || 1024,
          status: 'APPROVED' // Auto-approve for simplified local flow
        }
      });
    }

    // Award XP for contributing a post
    await awardXP(authorId, 5, 'POST_CREATED', `post_${newPost.id}`);

    ForumCache.clear();

    return res.status(201).json({ success: true, data: newPost });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function deletePost(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const post = await prisma.forumPost.findUnique({ where: { id: Number(id) } });
    if (!post) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết!' });

    // Permissions: Admin or Author
    if (post.authorId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Không có quyền xóa bài viết này!' });
    }

    await prisma.forumPost.delete({ where: { id: Number(id) } });
    ForumCache.clear();
    return res.status(200).json({ success: true, data: 'Xóa bài viết thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function togglePinPost(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const post = await prisma.forumPost.findUnique({ where: { id: Number(id) } });
    if (!post) return res.status(404).json({ success: false, error: 'Không tìm thấy!' });

    const updated = await prisma.forumPost.update({
      where: { id: Number(id) },
      data: { isPinned: !post.isPinned }
    });

    ForumCache.clear();

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function reactPost(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { type } = req.body; // e.g. LIKE, LOVE, LAUGH, CLAP, UPVOTE, DOWNVOTE
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const post = await prisma.forumPost.findUnique({ where: { id: Number(id) } });
    if (!post) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết!' });

    const existingReaction = await prisma.forumReaction.findFirst({
      where: { userId, postId: Number(id) }
    });

    const isPositiveType = (t: string) => ['UPVOTE', 'LIKE', 'LOVE', 'LAUGH', 'CLAP'].includes(t);

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off reaction
        await prisma.forumReaction.delete({ where: { id: existingReaction.id } });
        // Reverse reputation logic
        const points = isPositiveType(type) ? -5 : 2;
        await awardXP(post.authorId, points, 'UPVOTE_RECEIVED', `post_${post.id}`);
      } else {
        // Switch reaction type
        await prisma.forumReaction.update({
          where: { id: existingReaction.id },
          data: { type }
        });
        
        let points = 0;
        if (isPositiveType(type) && !isPositiveType(existingReaction.type)) {
          points = 7; // switch from negative to positive
        } else if (!isPositiveType(type) && isPositiveType(existingReaction.type)) {
          points = -7; // switch from positive to negative
        }
        if (points !== 0) {
          await awardXP(post.authorId, points, 'UPVOTE_RECEIVED', `post_${post.id}`);
        }
      }
    } else {
      // Create new reaction
      await prisma.forumReaction.create({
        data: {
          userId,
          postId: Number(id),
          type
        }
      });
      const points = isPositiveType(type) ? 5 : -2;
      await awardXP(post.authorId, points, isPositiveType(type) ? 'UPVOTE_RECEIVED' : 'DOWNVOTE_RECEIVED', `post_${post.id}`);
    }

    // Recalculate metrics
    const updatedPost = await prisma.forumPost.findUnique({
      where: { id: Number(id) },
      include: { reactions: true }
    });
    
    const upvotes = updatedPost!.reactions.filter(r => isPositiveType(r.type)).length;
    const downvotes = updatedPost!.reactions.filter(r => r.type === 'DOWNVOTE').length;

    const reactionCounts: Record<string, number> = {};
    updatedPost!.reactions.forEach(r => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    const userReaction = updatedPost!.reactions.find(r => r.userId === userId)?.type || null;

    ForumCache.clear();

    return res.status(200).json({ 
      success: true, 
      data: { 
        likes: upvotes - downvotes,
        reactionCounts,
        userReaction
      } 
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function reactComment(req: AuthRequest, res: Response) {
  const { id } = req.params; // commentId
  const { type } = req.body; // LIKE, LOVE, etc.
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const comment = await prisma.forumComment.findUnique({ where: { id: Number(id) } });
    if (!comment) return res.status(404).json({ success: false, error: 'Không tìm thấy bình luận!' });

    const existingReaction = await prisma.forumReaction.findFirst({
      where: { userId, commentId: Number(id) }
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        await prisma.forumReaction.delete({ where: { id: existingReaction.id } });
      } else {
        await prisma.forumReaction.update({
          where: { id: existingReaction.id },
          data: { type }
        });
      }
    } else {
      await prisma.forumReaction.create({
        data: {
          userId,
          commentId: Number(id),
          type
        }
      });
    }

    const updatedComment = await prisma.forumComment.findUnique({
      where: { id: Number(id) },
      include: { reactions: true }
    });

    const reactionCounts: Record<string, number> = {};
    updatedComment!.reactions.forEach(r => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    const userReaction = updatedComment!.reactions.find(r => r.userId === userId)?.type || null;

    return res.status(200).json({ success: true, data: { reactionCounts, userReaction } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function toggleSavePost(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const post = await prisma.forumPost.findUnique({ where: { id: Number(id) } });
    if (!post) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết!' });

    const existingSave = await prisma.savedForumPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: Number(id)
        }
      }
    });

    if (existingSave) {
      await prisma.savedForumPost.delete({
        where: { id: existingSave.id }
      });
      ForumCache.clear();
      return res.status(200).json({ success: true, isSaved: false, message: 'Đã bỏ lưu bài viết!' });
    } else {
      await prisma.savedForumPost.create({
        data: {
          userId,
          postId: Number(id)
        }
      });
      ForumCache.clear();
      return res.status(200).json({ success: true, isSaved: true, message: 'Đã lưu bài viết thành công!' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// COMMENT CONTROLLERS
// =========================================================================

export async function getComments(req: AuthRequest, res: Response) {
  const { postId } = req.params;
  const userId = req.user?.id;
  try {
    const list = await prisma.forumComment.findMany({
      where: { postId: Number(postId) },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { fullName: true, avatarUrl: true, email: true } },
        reactions: {
          select: { userId: true, type: true }
        }
      }
    });

    // Helper to build hierarchy tree local node map
    const map = new Map<number, any>();
    list.forEach(c => {
      const upvotes = c.reactions.filter(r => r.type === 'UPVOTE' || r.type === 'LIKE' || r.type === 'LOVE' || r.type === 'LAUGH' || r.type === 'CLAP').length;
      const downvotes = c.reactions.filter(r => r.type === 'DOWNVOTE').length;
      
      const reactionCounts: Record<string, number> = {};
      c.reactions.forEach(r => {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      });

      const userReaction = userId ? (c.reactions.find(r => r.userId === userId)?.type || null) : null;

      map.set(c.id, {
        id: c.id,
        postId: c.postId,
        parentId: c.parentId,
        content: c.content,
        isSolution: c.isSolution,
        createdAt: c.createdAt,
        author: c.author.fullName,
        authorAvatar: c.author.avatarUrl || 'HS',
        likes: upvotes - downvotes,
        reactionCounts,
        userReaction,
        replies: []
      });
    });

    const rootComments: any[] = [];
    map.forEach(node => {
      if (node.parentId) {
        const parent = map.get(node.parentId);
        if (parent) parent.replies.push(node);
      } else {
        rootComments.push(node);
      }
    });

    return res.status(200).json({ success: true, data: rootComments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createComment(req: AuthRequest, res: Response) {
  const { postId } = req.params;
  const { content, parentId } = req.body;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const modResult = await moderateContent('', content || '');
    if (!modResult.isSafe) {
      return res.status(400).json({ success: false, error: modResult.reason || 'Bình luận vi phạm tiêu chuẩn cộng đồng.' });
    }

    const newComment = await prisma.forumComment.create({
      data: {
        postId: Number(postId),
        parentId: parentId ? Number(parentId) : null,
        authorId,
        content
      },
      include: {
        author: { select: { fullName: true, avatarUrl: true } }
      }
    });

    // Award +2 XP for commenting/contributing help
    await awardXP(authorId, 2, 'COMMENT_CREATED', `comment_${newComment.id}`);

    // Return flattened formatted structure
    const formatted = {
      id: newComment.id,
      postId: newComment.postId,
      parentId: newComment.parentId,
      content: newComment.content,
      isSolution: newComment.isSolution,
      createdAt: newComment.createdAt,
      author: newComment.author.fullName,
      authorAvatar: newComment.author.avatarUrl || 'HS',
      likes: 0,
      reactionCounts: {},
      userReaction: null,
      replies: []
    };

    // Broadcast to room members
    const io = getIO();
    if (io) {
      io.to(`post_${postId}`).emit('comment_received', formatted);
    }

    return res.status(201).json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function acceptCommentSolution(req: AuthRequest, res: Response) {
  const { id } = req.params; // commentId
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const comment = await prisma.forumComment.findUnique({
      where: { id: Number(id) },
      include: { post: true }
    });

    if (!comment) return res.status(404).json({ success: false, error: 'Không tìm thấy bình luận!' });

    // Validate permission: only author of post OR a teacher can accept solutions
    const isAuthor = comment.post.authorId === userId;
    const isTeacher = req.user!.role === 'TEACHER' || req.user!.role === 'ADMIN';


    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ success: false, error: 'Không có quyền chọn lời giải hay cho câu hỏi này!' });
    }

    // Toggle solution flag
    const nextStatus = !comment.isSolution;
    const updated = await prisma.forumComment.update({
      where: { id: Number(id) },
      data: { isSolution: nextStatus }
    });

    // Award XP to Comment Author
    if (nextStatus) {
      await awardXP(comment.authorId, 15, 'ACCEPTED_ANSWER', `comment_${comment.id}`);
      // Award minor +2 XP to the Question Author for marking the solution
      await awardXP(comment.post.authorId, 2, 'ACCEPTED_ANSWER', `comment_${comment.id}`);
    } else {
      // Reverse points
      await awardXP(comment.authorId, -15, 'ACCEPTED_ANSWER', `comment_${comment.id}`);
      await awardXP(comment.post.authorId, -2, 'ACCEPTED_ANSWER', `comment_${comment.id}`);
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// STUDY GROUP CONTROLLERS
// =========================================================================

export async function getStudyGroups(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  try {
    const list = await prisma.studyGroup.findMany({
      include: {
        members: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } }
          }
        },
        creator: { select: { fullName: true } }
      }
    });

    // Map flag checking if current user is active member
    const mapped = list.map(g => {
      const isMember = g.members.some(m => m.userId === userId);
      return {
        ...g,
        isMember,
        memberCount: g.members.length
      };
    });

    return res.status(200).json({ success: true, data: mapped });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createStudyGroup(req: AuthRequest, res: Response) {
  const { name, description, isPrivate, avatarUrl } = req.body;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const group = await prisma.studyGroup.create({
      data: {
        name,
        description,
        isPrivate: !!isPrivate,
        avatarUrl: avatarUrl || null,
        creatorId,
        members: {
          create: {
            userId: creatorId,
            role: 'CREATOR'
          }
        }
      }
    });

    // Broadcast real-time update to all connected clients
    const io = getIO();
    if (io) {
      io.emit('study_group_created', {
        ...group,
        isMember: false,
        memberCount: 1
      });
    }

    return res.status(201).json({ success: true, data: group });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function joinStudyGroup(req: AuthRequest, res: Response) {
  const { id } = req.params; // groupId
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const existing = await prisma.studyGroupMember.findFirst({
      where: { groupId: Number(id), userId }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Bạn đã là thành viên của nhóm học tập này!' });
    }

    const membership = await prisma.studyGroupMember.create({
      data: {
        groupId: Number(id),
        userId,
        role: 'MEMBER'
      }
    });

    return res.status(201).json({ success: true, data: membership });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function leaveStudyGroup(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const membership = await prisma.studyGroupMember.findFirst({
      where: { groupId: Number(id), userId }
    });

    if (!membership) {
      return res.status(404).json({ success: false, error: 'Bạn không thuộc nhóm này!' });
    }

    await prisma.studyGroupMember.delete({ where: { id: membership.id } });
    return res.status(200).json({ success: true, data: 'Rời nhóm học tập thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// GAMIFICATION CONTROLLERS
// =========================================================================

export async function getLeaderboard(req: AuthRequest, res: Response) {
  try {
    const start = Date.now();
    const result = await LeaderboardService.getForumLeaderboard();
    console.log(`[ForumController] getLeaderboard completed in ${Date.now() - start}ms`);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUserGamificationProfile(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    let gamify = await prisma.userGamification.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            badges: {
              include: { badge: true }
            }
          }
        }
      }
    });

    if (!gamify) {
      gamify = await prisma.userGamification.create({
        data: {
          userId,
          level: 1,
          xp: 0,
          streakDays: 0,
          milestonesReached: []
        },
        include: {
          user: {
            select: {
              badges: {
                include: { badge: true }
              }
            }
          }
        }
      });
    }

    const nextLevelXP = Math.floor(100 * Math.pow(gamify.level, 1.5));
    const prevLevelXP = gamify.level > 1 ? Math.floor(100 * Math.pow(gamify.level - 1, 1.5)) : 0;
    const progressPercent = Math.min(100, Math.round(((gamify.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let alreadyCheckedInToday = false;
    if (gamify.lastActiveDate) {
      const lastActive = new Date(gamify.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);
      if (lastActive.getTime() === today.getTime()) {
        alreadyCheckedInToday = true;
      }
    }

    const result = {
      level: gamify.level,
      xp: gamify.xp,
      streakDays: gamify.streakDays,
      progress: progressPercent,
      nextLevelXP,
      badges: (gamify.user.badges || []).map(ub => ub.badge),
      lastActiveDate: gamify.lastActiveDate,
      alreadyCheckedInToday
    };

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// RESOURCES & MODERATION CONTROLLERS
// =========================================================================

export async function downloadResource(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const resShare = await prisma.resourceShare.update({
      where: { id: Number(id) },
      data: { downloadCount: { increment: 1 } },
      include: { post: true }
    });
    // Award +5 XP to the resource author for their download contribution
    await awardXP(resShare.post.authorId, 5, 'RESOURCE_DOWNLOADED', `resource_${resShare.id}`);
    return res.status(200).json({ success: true, data: { downloadCount: resShare.downloadCount } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createReport(req: AuthRequest, res: Response) {
  const { postId, commentId, reason } = req.body;
  const reporterId = req.user?.id;
  if (!reporterId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const report = await prisma.forumReport.create({
      data: {
        reporterId,
        postId: postId ? Number(postId) : null,
        commentId: commentId ? Number(commentId) : null,
        reason,
        status: 'PENDING'
      }
    });
    return res.status(201).json({ success: true, data: report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getReports(req: AuthRequest, res: Response) {
  try {
    const reports = await prisma.forumReport.findMany({
      where: { status: 'PENDING' },
      include: {
        reporter: { select: { fullName: true } },
        post: { select: { title: true, id: true } },
        comment: { select: { content: true, id: true } }
      }
    });
    return res.status(200).json({ success: true, data: reports });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function resolveReport(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { status, notes } = req.body;
  const resolvedById = req.user?.id;

  try {
    const report = await prisma.forumReport.update({
      where: { id: Number(id) },
      data: {
        status: status as any,
        resolutionNotes: notes,
        resolvedById,
        resolvedAt: new Date()
      }
    });
    return res.status(200).json({ success: true, data: report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getGroupAnnouncements(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const group = await prisma.studyGroup.findUnique({
      where: { id: Number(id) }
    });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nhóm học tập!' });
    }

    if (group.isPrivate) {
      const isMember = await prisma.studyGroupMember.findFirst({
        where: { groupId: Number(id), userId }
      });
      if (!isMember && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền truy cập nhóm riêng tư này!' });
      }
    }

    const list = await prisma.groupAnnouncement.findMany({
      where: { groupId: Number(id) },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { fullName: true, avatarUrl: true } }
      }
    });

    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createGroupAnnouncement(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const group = await prisma.studyGroup.findUnique({
      where: { id: Number(id) }
    });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nhóm học tập!' });
    }

    const member = await prisma.studyGroupMember.findFirst({
      where: { groupId: Number(id), userId }
    });

    const hasPermission = member?.role === 'CREATOR' || member?.role === 'ADMIN' || req.user?.role === 'ADMIN';

    if (!hasPermission) {
      return res.status(403).json({ success: false, error: 'Chỉ quản trị viên hoặc trưởng nhóm mới được tạo thông báo!' });
    }

    const ann = await prisma.groupAnnouncement.create({
      data: {
        groupId: Number(id),
        title,
        content,
        authorId: userId
      },
      include: {
        author: { select: { fullName: true, avatarUrl: true } }
      }
    });

    return res.status(201).json({ success: true, data: ann });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updatePost(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { title, content, categoryId, postType, difficulty, tags } = req.body;
  const userId = req.user?.id;

  try {
    const post = await prisma.forumPost.findUnique({ where: { id: Number(id) } });
    if (!post) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết!' });

    // Permissions: Author or Admin
    if (post.authorId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Không có quyền chỉnh sửa bài viết này!' });
    }

    const modResult = await moderateContent(title || '', content || '');
    if (!modResult.isSafe) {
      return res.status(400).json({ success: false, error: modResult.reason || 'Nội dung vi phạm tiêu chuẩn cộng đồng.' });
    }

    const tagConnectOrCreate = (tags || []).map((t: string) => ({
      where: { name: t },
      create: { name: t, slug: slugify(t) }
    }));

    const updated = await prisma.forumPost.update({
      where: { id: Number(id) },
      data: {
        title,
        content,
        postType: postType || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        difficulty: difficulty || undefined,
        tags: tags ? {
          set: [], // clear existing tags
          connectOrCreate: tagConnectOrCreate
        } : undefined
      },
      include: {
        category: true,
        author: { select: { fullName: true, avatarUrl: true } }
      }
    });

    ForumCache.clear();
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteStudyGroup(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const group = await prisma.studyGroup.findUnique({ where: { id: Number(id) } });
    if (!group) return res.status(404).json({ success: false, error: 'Không tìm thấy nhóm học tập!' });

    // Permissions: Creator of the group or Admin
    if (group.creatorId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Chỉ người tạo nhóm hoặc Admin mới được xóa nhóm này!' });
    }

    await prisma.studyGroup.delete({ where: { id: Number(id) } });

    // Broadcast update to all connected socket clients
    const io = getIO();
    if (io) {
      io.emit('study_group_deleted', { id: Number(id) });
    }

    return res.status(200).json({ success: true, data: 'Xóa nhóm học tập thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


