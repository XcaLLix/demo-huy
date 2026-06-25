import React, { useState, useEffect, useMemo } from 'react';
import { HiSparkles, HiStar, HiAdjustments, HiSelector, HiOutlineEmojiSad } from 'react-icons/hi';
import { mapDbCourseToMockFormat } from '../utils/courseMapper';

// Modular components
import CourseTabBar from '../components/courses/catalog/CourseTabBar';
import FilterSidebar from '../components/courses/catalog/FilterSidebar';
import CourseCard from '../components/courses/shared/CourseCard';

function SkeletonCard() {
  return (
    <div className="cc-list-skeleton">
      <div className="cc-list-skeleton__thumb" />
      <div className="cc-list-skeleton__body">
        <div className="cc-list-skeleton__line cc-list-skeleton__line--short" />
        <div className="cc-list-skeleton__line" />
        <div className="cc-list-skeleton__line cc-list-skeleton__line--mid" />
      </div>
    </div>
  );
}

export default function CoursesPage({ courses = [], currentUser, onSelectCourse, onCheckoutCourse, navigateTo }) {
  // Main Search and Filter States
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [block, setBlock] = useState('All');
  const [level, setLevel] = useState('All');
  const [priceLimit, setPriceLimit] = useState(2000000);
  const [onlyFree, setOnlyFree] = useState(false);
  const [duration, setDuration] = useState('All');
  const [ratingMin, setRatingMin] = useState(0);
  const [language, setLanguage] = useState('All');
  const [hasCert, setHasCert] = useState(false);
  const [hasLive, setHasLive] = useState(false);

  // Tabs and Sorting
  const [badgeFilter, setBadgeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  // Map backend courses to client mock format
  const mappedCourses = useMemo(() => {
    return (courses || []).map(mapDbCourseToMockFormat);
  }, [courses]);

  // Simulate shimmer loading on filter/page transitions
  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [search, subject, block, level, priceLimit, onlyFree, duration, ratingMin, language, hasCert, hasLive, sortBy, badgeFilter]);

  // Handle filtering
  const filteredCourses = useMemo(() => {
    let result = [...mappedCourses];

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.instructor?.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }

    // Subject Filter
    if (subject !== 'All') {
      result = result.filter(c => c.subject === subject);
    }

    // Exam Block Filter
    if (block !== 'All') {
      result = result.filter(c => {
        if (!c.block) return false;
        const blockName = block.replace("Khối ", "").trim();
        return c.block.includes(blockName);
      });
    }

    // Level Filter
    if (level !== 'All') {
      result = result.filter(c => c.level === level);
    }

    // Price Limit
    if (priceLimit < 2000000) {
      result = result.filter(c => c.priceSale <= priceLimit);
    }

    // Only Free
    if (onlyFree) {
      result = result.filter(c => c.priceSale === 0 || c.badge?.toUpperCase() === 'MIỄN PHÍ');
    }

    // Duration Filter
    if (duration !== 'All') {
      result = result.filter(c => {
        const hours = c.durationHours || 0;
        if (duration === 'short') return hours < 2;
        if (duration === 'medium') return hours >= 2 && hours <= 5;
        if (duration === 'long') return hours > 5 && hours <= 10;
        if (duration === 'unlimited') return hours > 10;
        return true;
      });
    }

    // Rating Filter
    if (ratingMin > 0) {
      result = result.filter(c => c.rating >= ratingMin);
    }

    // Language Filter
    if (language !== 'All') {
      result = result.filter(c => c.language === language || (language === 'Tiếng Việt' && (!c.language || c.language.includes('Việt'))));
    }

    // Certificate features
    if (hasCert) {
      result = result.filter(c => c.badge?.toUpperCase() === 'PRO' || c.id % 2 === 0);
    }

    // Live features
    if (hasLive) {
      result = result.filter(c => c.id % 3 === 0);
    }

    // Category Tabs (All, Bestsellers, New Releases, Recommendations, Free)
    if (badgeFilter !== 'All') {
      if (badgeFilter === 'MIỄN PHÍ') {
        result = result.filter(c => c.priceSale === 0 || c.badge?.toUpperCase() === 'MIỄN PHÍ');
      } else if (badgeFilter === 'BÁN CHẠY') {
        result = result.filter(c => c.badge?.toUpperCase() === 'BÁN CHẠY');
      } else if (badgeFilter === 'HOT') {
        result = result.filter(c => c.badge?.toUpperCase() === 'HOT');
      } else if (badgeFilter === 'ĐỀ XUẤT') {
        result = result.filter(c => c.badge?.toUpperCase() === 'ĐỀ XUẤT');
      }
    }

    // Sort operations
    if (sortBy === 'popular') {
      result.sort((a, b) => b.studentCount - a.studentCount);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.priceSale - b.priceSale);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.priceSale - a.priceSale);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return result;
  }, [mappedCourses, search, subject, block, level, priceLimit, onlyFree, duration, ratingMin, language, hasCert, hasLive, sortBy, badgeFilter]);

  // Compute paginated subset of courses
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = useMemo(() => {
    return filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  }, [filteredCourses, indexOfFirstCourse, indexOfLastCourse]);

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }
    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }
    return range;
  };

  const handleClearFilters = () => {
    setSearch('');
    setSubject('All');
    setBlock('All');
    setLevel('All');
    setPriceLimit(2000000);
    setOnlyFree(false);
    setDuration('All');
    setRatingMin(0);
    setLanguage('All');
    setHasCert(false);
    setHasLive(false);
    setBadgeFilter('All');
    setSortBy('popular');
    setCurrentPage(1);
  };

  // Compile active enrolled courses to display (simulate using unlocked courses in user object)
  const activeEnrolledCourses = useMemo(() => {
    if (!currentUser || !currentUser.unlockedCourses) return [];
    const ownedIds = currentUser.unlockedCourses.map(id => id.toString());
    return mappedCourses.filter(c => ownedIds.includes(c.id));
  }, [currentUser, mappedCourses]);

  const subjectsList = ['Toán', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Ngữ văn'];

  return (
    <div className="cp-page-container">
      <div className="cp-page animate-in">



        {/* 4. COURSE TABS (Bestsellers, New, Recommended, Free) */}
        <div style={{ margin: '12px 0 4px 0' }}>
          <CourseTabBar activeTab={badgeFilter} onSelectTab={setBadgeFilter} />
        </div>

        {/* 5. DUAL LAYOUT: SIDEBAR FILTER & MAIN CONTENT AREA */}
        <div className="catalog-layout">
          {/* LEFT SIDEBAR FILTER PANEL */}
          <FilterSidebar
            subject={subject} setSubject={setSubject}
            block={block} setBlock={setBlock}
            level={level} setLevel={setLevel}
            priceLimit={priceLimit} setPriceLimit={setPriceLimit}
            onlyFree={onlyFree} setOnlyFree={setOnlyFree}
            duration={duration} setDuration={setDuration}
            ratingMin={ratingMin} setRatingMin={setRatingMin}
            language={language} setLanguage={setLanguage}
            hasCert={hasCert} setHasCert={setHasCert}
            hasLive={hasLive} setHasLive={setHasLive}
            clearAll={handleClearFilters}
            subjectsList={subjectsList}
            resultsCount={filteredCourses.length}
            search={search}
            setSearch={setSearch}
          />

          {/* RIGHT GRID & TOOLBAR AREA */}
          <div className="catalog-main-content">
            {/* Sorting and Summary Toolbar */}
            <div className="catalog-toolbar">
              <span className="results-count-text">
                Tìm thấy <strong>{filteredCourses.length}</strong> khóa học phù hợp (Trang {currentPage}/{totalPages || 1})
              </span>
              
              <div className="sorting-group">
                <span className="sort-label">Sắp xếp theo:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-dropdown-select"
                >
                  <option value="popular">Phổ biến nhất</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="price_asc">Giá từ thấp đến cao</option>
                  <option value="price_desc">Giá từ cao đến thấp</option>
                  <option value="newest">Mới cập nhật</option>
                </select>
              </div>
            </div>

            {/* Courses Card List */}
            {loading ? (
              <div className="cp-list">
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : currentCourses.length > 0 ? (
              <>
                <div className="cp-list">
                  {currentCourses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isOwned={currentUser?.unlockedCourses?.includes(Number(course.id)) || currentUser?.unlockedCourses?.includes(course.id)}
                      onSelect={onSelectCourse}
                      onPurchase={onCheckoutCourse}
                      layout="list"
                    />
                  ))}
                </div>

                {/* Neo-brutalist Pagination Controls */}
                {totalPages > 1 && (
                  <div className="catalog-pagination" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '40px',
                    marginBottom: '20px'
                  }}>
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '10px 18px',
                        border: '2.5px solid #000',
                        borderRadius: '8px',
                        background: currentPage === 1 ? '#f1f5f9' : '#fff',
                        color: currentPage === 1 ? '#94a3b8' : '#000',
                        fontWeight: '900',
                        fontSize: '13.5px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        boxShadow: currentPage === 1 ? 'none' : '3px 3px 0px #000',
                        transform: currentPage === 1 ? 'none' : 'translate(0px, 0px)',
                        transition: 'all 0.1s'
                      }}
                      className="pagination-btn"
                    >
                      Trước
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`dots-${index}`} style={{ padding: '0 8px', fontWeight: '900', color: '#64748b', fontSize: '15px' }}>
                            ...
                          </span>
                        );
                      }
                      const isActive = page === currentPage;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2.5px solid #000',
                            borderRadius: '8px',
                            background: isActive ? '#FFE259' : '#fff',
                            color: '#000',
                            fontWeight: '900',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: isActive ? 'none' : '3px 3px 0px #000',
                            transform: isActive ? 'translate(2px, 2px)' : 'none',
                            transition: 'all 0.1s'
                          }}
                          className="pagination-btn"
                        >
                          {page}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '10px 18px',
                        border: '2.5px solid #000',
                        borderRadius: '8px',
                        background: currentPage === totalPages ? '#f1f5f9' : '#fff',
                        color: currentPage === totalPages ? '#94a3b8' : '#000',
                        fontWeight: '900',
                        fontSize: '13.5px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        boxShadow: currentPage === totalPages ? 'none' : '3px 3px 0px #000',
                        transform: currentPage === totalPages ? 'none' : 'translate(0px, 0px)',
                        transition: 'all 0.1s'
                      }}
                      className="pagination-btn"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="catalog-empty-state">
                <HiOutlineEmojiSad className="empty-icon" />
                <h3>Không tìm thấy khóa học nào phù hợp</h3>
                <p>Em hãy thử đặt lại các bộ lọc hoặc tìm kiếm từ khóa khác xem sao nhé.</p>
                <button type="button" onClick={handleClearFilters} className="btn-reset-catalog">
                  Đặt lại toàn bộ bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
