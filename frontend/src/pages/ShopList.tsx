import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get } from '../api/client';
import styles from './ShopList.module.css';

interface Shop {
  id: number;
  name: string;
  images: string;
  area: string;
  address: string;
  avgPrice: number;
  sold: number;
  comments: number;
  score: number;
  openHours: string;
  distance?: number;
}

type SortKey = 'default' | 'distance' | 'comments' | 'score';

export default function ShopList() {
  const { typeId } = useParams();
  const [shops, setShops] = useState<Shop[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortKey>('default');
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const observer = useRef<IntersectionObserver>();

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ x: pos.coords.longitude, y: pos.coords.latitude }),
        () => {}
      );
    }
  }, []);

  const loadShops = useCallback(
    async (p: number, reset = false) => {
      if (loading) return;
      setLoading(true);
      let url = `/shop/of/type?typeId=${typeId}&current=${p}`;
      if (coords && sort === 'distance') {
        url += `&x=${coords.x}&y=${coords.y}`;
      }
      const res = await get<Shop[]>(url);
      if (res.success && res.data) {
        if (res.data.length === 0) {
          setHasMore(false);
          if (reset) setShops([]);
        } else {
          setShops((prev) => (reset ? res.data! : [...prev, ...res.data!]));
        }
      }
      setLoading(false);
    },
    [typeId, loading, coords, sort]
  );

  useEffect(() => {
    setShops([]);
    setPage(1);
    setHasMore(true);
    loadShops(1, true);
  }, [typeId, sort]);

  useEffect(() => {
    if (page > 1) loadShops(page);
  }, [page]);

  const lastRef = useCallback(
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

  const getImage = (images: string) => {
    if (!images) return null;
    const first = images.split(',')[0];
    if (first.startsWith('http')) return first;
    if (first.startsWith('/')) return first;
    return `/imgs/blogs/${first}`;
  };

  const renderStars = (score: number) => {
    const s = score / 10;
    const full = Math.floor(s);
    const half = s - full >= 0.5;
    return (
      <span className={styles.stars}>
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(5 - full - (half ? 1 : 0))}
        <span className={styles.scoreNum}>{s.toFixed(1)}</span>
      </span>
    );
  };

  const sortedShops = [...shops].sort((a, b) => {
    if (sort === 'comments') return b.comments - a.comments;
    if (sort === 'score') return b.score - a.score;
    return 0;
  });

  return (
    <div className="page-enter">
      <div className={styles.header}>
        <Link to="/" className={styles.back}>
          ← Back
        </Link>
        <h1 className={styles.title}>Shops</h1>
      </div>

      <div className={styles.sortBar}>
        {(['default', 'distance', 'comments', 'score'] as SortKey[]).map((key) => (
          <button
            key={key}
            className={`${styles.sortBtn} ${sort === key ? styles.sortActive : ''}`}
            onClick={() => setSort(key)}
          >
            {key === 'default' && 'Recommended'}
            {key === 'distance' && 'Nearest'}
            {key === 'comments' && 'Most Popular'}
            {key === 'score' && 'Top Rated'}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {sortedShops.map((shop, i) => {
          const img = getImage(shop.images);
          const isLast = i === sortedShops.length - 1;
          return (
            <Link
              key={shop.id}
              to={`/shop/${shop.id}`}
              className={styles.card}
              ref={isLast ? lastRef : undefined}
            >
              <div className={styles.cardImage}>
                {img ? (
                  <img src={img} alt={shop.name} loading="lazy" />
                ) : (
                  <div className={styles.placeholder}>🏪</div>
                )}
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.shopName}>{shop.name}</h3>
                <div className={styles.shopRating}>
                  {renderStars(shop.score)}
                  <span className={styles.reviewCount}>
                    {shop.comments} reviews
                  </span>
                </div>
                <p className={styles.shopAddr}>
                  {shop.area && `${shop.area} · `}
                  {shop.address}
                </p>
                <div className={styles.shopFooter}>
                  {shop.avgPrice > 0 && (
                    <span className={styles.price}>
                      Avg. ¥{shop.avgPrice}/person
                    </span>
                  )}
                  {shop.distance != null && (
                    <span className={styles.distance}>
                      {shop.distance < 1000
                        ? `${Math.round(shop.distance)}m`
                        : `${(shop.distance / 1000).toFixed(1)}km`}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {loading && (
        <div className={styles.loader}>
          <div className={styles.spinner} />
        </div>
      )}
    </div>
  );
}
