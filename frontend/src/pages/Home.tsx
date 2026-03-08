import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { get, put } from '../api/client';
import styles from './Home.module.css';

interface ShopType {
  id: number;
  name: string;
  icon: string;
}

interface Blog {
  id: number;
  title: string;
  images: string;
  content: string;
  liked: number;
  comments: number;
  userId: number;
  icon: string;
  name: string;
  isLike: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  'KTV': '🎤',
  '美食': '🍜',
  default: '🏪',
};

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] || CATEGORY_ICONS.default;
}

const CATEGORY_LABELS: Record<string, string> = {
  '美食': 'Food',
  'KTV': 'Karaoke',
  '丽人·美发': 'Beauty',
  '休闲·棋牌': 'Leisure',
  '按摩·足疗': 'Spa',
  '美睫·美甲': 'Nails',
  '酒吧': 'Bar',
  '亲子游乐': 'Family',
  '健身运动': 'Fitness',
  '会展·演出': 'Events',
};

function translateCategory(name: string): string {
  return CATEGORY_LABELS[name] || name;
}

export default function Home() {
  const [types, setTypes] = useState<ShopType[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver>();

  useEffect(() => {
    get<ShopType[]>('/shop-type/list').then((res) => {
      if (res.success && res.data) setTypes(res.data);
    });
  }, []);

  const loadBlogs = useCallback(async (p: number) => {
    if (loading) return;
    setLoading(true);
    const res = await get<Blog[]>(`/blog/hot?current=${p}`);
    if (res.success && res.data) {
      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setBlogs((prev) => (p === 1 ? res.data! : [...prev, ...res.data!]));
      }
    }
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    loadBlogs(1);
  }, []);

  useEffect(() => {
    if (page > 1) loadBlogs(page);
  }, [page]);

  const lastBlogRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const toggleLike = async (blog: Blog) => {
    const res = await put(`/blog/like/${blog.id}`);
    if (res.success) {
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === blog.id
            ? { ...b, isLike: !b.isLike, liked: b.liked + (b.isLike ? -1 : 1) }
            : b
        )
      );
    }
  };

  const getFirstImage = (images: string) => {
    if (!images) return null;
    const first = images.split(',')[0];
    if (first.startsWith('http')) return first;
    if (first.startsWith('/')) return first;
    return `/imgs/blogs/${first}`;
  };

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          What are you <em>craving</em> today?
        </h1>
        <p className={styles.heroSub}>
          Explore restaurants, cafes, and local favorites near you
        </p>
      </section>

      {/* Categories */}
      <section className={styles.categories}>
        <h2 className={styles.sectionTitle}>Browse by category</h2>
        <div className={styles.categoryGrid}>
          {types.map((t) => (
            <Link
              key={t.id}
              to={`/shops/${t.id}`}
              className={styles.categoryCard}
            >
              <span className={styles.categoryIcon}>
                {getCategoryIcon(t.name)}
              </span>
              <span className={styles.categoryName}>
                {translateCategory(t.name)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Blog Feed */}
      <section className={styles.feed}>
        <h2 className={styles.sectionTitle}>Trending posts</h2>
        <div className={styles.blogGrid}>
          {blogs.map((blog, i) => {
            const img = getFirstImage(blog.images);
            const isLast = i === blogs.length - 1;
            return (
              <article
                key={blog.id}
                className={styles.blogCard}
                ref={isLast ? lastBlogRef : undefined}
              >
                {img && (
                  <Link to={`/blog/${blog.id}`} className={styles.blogImage}>
                    <img src={img} alt={blog.title} loading="lazy" />
                  </Link>
                )}
                <div className={styles.blogBody}>
                  <Link to={`/blog/${blog.id}`}>
                    <h3 className={styles.blogTitle}>{blog.title}</h3>
                  </Link>
                  <p className={styles.blogExcerpt}>
                    {blog.content?.replace(/<[^>]*>/g, '').slice(0, 120)}
                  </p>
                  <div className={styles.blogMeta}>
                    <div className={styles.blogAuthor}>
                      <div className={styles.blogAvatar}>
                        {blog.icon ? (
                          <img src={blog.icon} alt="" />
                        ) : (
                          <span>{blog.name?.charAt(0)}</span>
                        )}
                      </div>
                      <span>{blog.name || 'Anonymous'}</span>
                    </div>
                    <div className={styles.blogActions}>
                      <button
                        className={`${styles.likeBtn} ${blog.isLike ? styles.liked : ''}`}
                        onClick={() => toggleLike(blog)}
                      >
                        {blog.isLike ? '♥' : '♡'} {blog.liked}
                      </button>
                      <span className={styles.commentCount}>
                        💬 {blog.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {loading && (
          <div className={styles.loader}>
            <div className={styles.spinner} />
          </div>
        )}
        {!hasMore && blogs.length > 0 && (
          <p className={styles.endText}>You've seen it all</p>
        )}
      </section>
    </div>
  );
}
