import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post } from '../api/client';
import styles from './ShopDetail.module.css';

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
  x: number;
  y: number;
}

interface Voucher {
  id: number;
  title: string;
  subTitle: string;
  payValue: number;
  actualValue: number;
  type: number;
  stock: number;
  beginTime: string;
  endTime: string;
}

export default function ShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedImg, setSelectedImg] = useState(0);
  const [buying, setBuying] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    get<Shop>(`/shop/${id}`).then((res) => {
      if (res.success && res.data) setShop(res.data);
    });
    get<Voucher[]>(`/voucher/list/${id}`).then((res) => {
      if (res.success && res.data) setVouchers(res.data);
    });
  }, [id]);

  const images = shop?.images
    ? shop.images.split(',').map((img) =>
        img.startsWith('http') ? img : img.startsWith('/') ? img : `/imgs/blogs/${img}`
      )
    : [];

  const handleSeckill = async (voucherId: number) => {
    setBuying(voucherId);
    setMessage('');
    try {
      const res = await post<number>(`/voucher-order/seckill/${voucherId}`);
      if (res.success) {
        setMessage('Order placed successfully!');
        setVouchers((prev) =>
          prev.map((v) =>
            v.id === voucherId ? { ...v, stock: v.stock - 1 } : v
          )
        );
      } else {
        setMessage(res.errorMsg || 'Failed to place order');
      }
    } finally {
      setBuying(null);
    }
  };

  const renderStars = (score: number) => {
    const s = score / 10;
    const full = Math.floor(s);
    const half = s - full >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  };

  const getCountdown = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m remaining`;
  };

  const isFlashActive = (v: Voucher) => {
    const now = Date.now();
    return new Date(v.beginTime).getTime() <= now && now <= new Date(v.endTime).getTime();
  };

  if (!shop) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const scoreVal = (shop.score / 10).toFixed(1);

  return (
    <div className={`page-enter ${styles.page}`}>
      <Link to="/" className={styles.back}>← Back</Link>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            <img src={images[selectedImg]} alt={shop.name} />
          </div>
          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`${styles.thumb} ${i === selectedImg ? styles.thumbActive : ''}`}
                  onClick={() => setSelectedImg(i)}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shop Info */}
      <div className={styles.info}>
        <div className={styles.infoMain}>
          <h1 className={styles.name}>{shop.name}</h1>
          <div className={styles.rating}>
            <span className={styles.stars}>{renderStars(shop.score)}</span>
            <span className={styles.scoreNum}>{scoreVal}</span>
            <span className={styles.sep}>·</span>
            <span className={styles.reviews}>{shop.comments} reviews</span>
            <span className={styles.sep}>·</span>
            <span className={styles.sold}>{shop.sold} sold</span>
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>📍</span>
            <div>
              <div className={styles.detailLabel}>Address</div>
              <div className={styles.detailValue}>
                {shop.area && `${shop.area}, `}{shop.address}
              </div>
            </div>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>🕐</span>
            <div>
              <div className={styles.detailLabel}>Hours</div>
              <div className={styles.detailValue}>{shop.openHours || 'Not specified'}</div>
            </div>
          </div>
          {shop.avgPrice > 0 && (
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>💰</span>
              <div>
                <div className={styles.detailLabel}>Average price</div>
                <div className={styles.detailValue}>¥{shop.avgPrice} / person</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vouchers */}
      {vouchers.length > 0 && (
        <section className={styles.vouchers}>
          <h2 className={styles.sectionTitle}>Deals & Vouchers</h2>
          {message && (
            <div className={styles.message}>
              {message}
            </div>
          )}
          <div className={styles.voucherList}>
            {vouchers.map((v) => {
              const isFlash = v.type === 1;
              const active = isFlash && isFlashActive(v);
              const countdown = isFlash ? getCountdown(v.endTime) : null;

              return (
                <div
                  key={v.id}
                  className={`${styles.voucherCard} ${isFlash ? styles.flashCard : ''}`}
                >
                  <div className={styles.voucherLeft}>
                    <div className={styles.voucherValue}>
                      <span className={styles.currency}>¥</span>
                      {(v.actualValue / 100).toFixed(0)}
                    </div>
                    <div className={styles.voucherPay}>
                      Pay ¥{(v.payValue / 100).toFixed(0)}
                    </div>
                  </div>
                  <div className={styles.voucherRight}>
                    <h3 className={styles.voucherTitle}>{v.title}</h3>
                    {v.subTitle && (
                      <p className={styles.voucherSub}>{v.subTitle}</p>
                    )}
                    {isFlash && (
                      <div className={styles.flashInfo}>
                        <span className={styles.flashBadge}>⚡ Flash Sale</span>
                        {v.stock > 0 && (
                          <span className={styles.stock}>
                            {v.stock} left
                          </span>
                        )}
                        {countdown && (
                          <span className={styles.countdown}>{countdown}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.voucherAction}>
                    {isFlash ? (
                      <button
                        className={styles.buyBtn}
                        onClick={() => handleSeckill(v.id)}
                        disabled={!active || v.stock <= 0 || buying === v.id}
                      >
                        {buying === v.id
                          ? '...'
                          : v.stock <= 0
                          ? 'Sold out'
                          : !active
                          ? 'Not started'
                          : 'Grab it'}
                      </button>
                    ) : (
                      <button className={styles.claimBtn}>Claim</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
