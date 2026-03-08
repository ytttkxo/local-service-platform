import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, put } from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from './BlogDetail.module.css';

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
  createTime: string;
}

interface UserDTO {
  id: number;
  nickName: string;
  icon: string;
}

export default function BlogDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeUsers, setLikeUsers] = useState<UserDTO[]>([]);
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => {
    get<Blog>(`/blog/${id}`).then((res) => {
      if (res.success && res.data) {
        setBlog(res.data);
        // Check follow status
        get<boolean>(`/follow/or/not/${res.data.userId}`).then((fRes) => {
          if (fRes.success && fRes.data != null) setIsFollowing(fRes.data);
        });
      }
    });
    get<UserDTO[]>(`/blog/likes/${id}`).then((res) => {
      if (res.success && res.data) setLikeUsers(res.data);
    });
  }, [id]);

  const toggleLike = async () => {
    if (!blog) return;
    const res = await put(`/blog/like/${blog.id}`);
    if (res.success) {
      setBlog({
        ...blog,
        isLike: !blog.isLike,
        liked: blog.liked + (blog.isLike ? -1 : 1),
      });
      // Refresh like users
      const lRes = await get<UserDTO[]>(`/blog/likes/${id}`);
      if (lRes.success && lRes.data) setLikeUsers(lRes.data);
    }
  };

  const toggleFollow = async () => {
    if (!blog) return;
    const res = await put(`/follow/${blog.userId}/${!isFollowing}`);
    if (res.success) setIsFollowing(!isFollowing);
  };

  if (!blog) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const images = blog.images
    ? blog.images.split(',').map((img) =>
        img.startsWith('http') ? img : img.startsWith('/') ? img : `/imgs/blogs/${img}`
      )
    : [];

  const isOwnPost = user?.id === blog.userId;

  return (
    <div className={`page-enter ${styles.page}`}>
      <Link to="/" className={styles.back}>← Back</Link>

      <article className={styles.article}>
        {/* Image Carousel */}
        {images.length > 0 && (
          <div className={styles.carousel}>
            <div className={styles.carouselMain}>
              <img src={images[selectedImg]} alt={blog.title} />
            </div>
            {images.length > 1 && (
              <div className={styles.carouselDots}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === selectedImg ? styles.dotActive : ''}`}
                    onClick={() => setSelectedImg(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Author Bar */}
        <div className={styles.authorBar}>
          <div className={styles.author}>
            <div className={styles.avatar}>
              {blog.icon ? (
                <img src={blog.icon} alt="" />
              ) : (
                <span>{blog.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className={styles.authorName}>{blog.name || 'Anonymous'}</div>
              {blog.createTime && (
                <div className={styles.date}>
                  {new Date(blog.createTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
          </div>
          {!isOwnPost && (
            <button
              className={`${styles.followBtn} ${isFollowing ? styles.following : ''}`}
              onClick={toggleFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Content */}
        <h1 className={styles.title}>{blog.title}</h1>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.likeBtn} ${blog.isLike ? styles.liked : ''}`}
            onClick={toggleLike}
          >
            <span className={styles.likeIcon}>{blog.isLike ? '♥' : '♡'}</span>
            <span>{blog.liked}</span>
          </button>
          <span className={styles.commentCount}>💬 {blog.comments}</span>
        </div>

        {/* Like Users */}
        {likeUsers.length > 0 && (
          <div className={styles.likedBy}>
            <span className={styles.likedByLabel}>Liked by</span>
            <div className={styles.likeAvatars}>
              {likeUsers.slice(0, 8).map((u) => (
                <div key={u.id} className={styles.likeAvatar} title={u.nickName}>
                  {u.icon ? (
                    <img src={u.icon} alt="" />
                  ) : (
                    <span>{u.nickName?.charAt(0)}</span>
                  )}
                </div>
              ))}
              {likeUsers.length > 8 && (
                <span className={styles.moreCount}>
                  +{likeUsers.length - 8}
                </span>
              )}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
