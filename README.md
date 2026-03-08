# Locale

A full-stack local dining & shop review platform, built with **Spring Boot** and **React**. Features include Redis-powered caching strategies, flash sale with distributed locking, social feed with scroll pagination, and geo-based shop discovery.

## Tech Stack

**Backend:** Java 8 · Spring Boot 2.3 · MyBatis-Plus · Redis · Redisson · MySQL 8

**Frontend:** React 18 · TypeScript · Vite

**Infrastructure:** Docker Compose · Nginx

## Key Features

| Feature | Implementation |
|---------|---------------|
| **Caching** | Cache-aside, cache penetration protection (null caching), cache breakdown prevention (mutex lock + logical expiration) |
| **Flash Sale** | Redis + Lua script for atomic stock check, Redis Stream for async order processing |
| **Distributed Lock** | Redisson-based reentrant lock for one-order-per-user |
| **Social Feed** | Fan-out on write with Redis ZSET, scroll pagination (timestamp-based cursor) |
| **Geo Search** | Redis GEO for nearby shop discovery, sorted by distance |
| **Sign-in Tracking** | Redis Bitmap for daily check-in, bitwise operations for consecutive day counting |
| **UV Statistics** | Redis HyperLogLog for unique visitor counting |
| **Global ID Generator** | Redis INCR + timestamp + sequence for distributed unique IDs |
| **API Documentation** | SpringDoc OpenAPI (Swagger UI) |
| **Error Handling** | Centralized exception handling with typed error codes |

## Quick Start

### Docker (Recommended)

```bash
git clone <repo-url>
cd locale

# Configure secrets
cp .env.example .env
# Edit .env and set DB_PASSWORD

# Start all services (MySQL + Redis + App)
docker compose up --build
```

The app will be available at `http://localhost:8082`.

### Local Development

**Prerequisites:** JDK 17, Maven, MySQL 8, Redis

```bash
# 1. Create database and import schema
mysql -u root -p -e "CREATE DATABASE locale"
mysql -u root -p locale < src/main/resources/db/locale.sql

# 2. Set environment variables
export DB_PASSWORD=your_mysql_password
export REDIS_PASSWORD=your_redis_password  # leave empty if no password

# 3. Start backend
mvn spring-boot:run

# 4. Start frontend
cd frontend
npm install
npm run dev
```

- Backend: `http://localhost:8081`
- Frontend: `http://localhost:3000`
- Swagger UI: `http://localhost:8081/swagger-ui/index.html`

## Architecture

```
┌──────────┐     ┌──────────┐     ┌───────────┐
│  React   │────▶│  Spring  │────▶│   MySQL   │
│ Frontend │     │   Boot   │     │           │
└──────────┘     │          │     └───────────┘
                 │          │────▶┌───────────┐
                 │          │     │   Redis   │
                 └──────────┘     │ Cache/MQ  │
                                  └───────────┘
```

**Redis is used for 7 different purposes:**
1. Session token storage (Hash)
2. Shop data caching (String + logical expiration)
3. Flash sale stock & eligibility check (Lua script)
4. Async order queue (Stream)
5. Blog like ranking (Sorted Set)
6. Social feed inbox (Sorted Set)
7. Nearby shop search (GEO)
8. Daily sign-in tracking (Bitmap)
9. UV statistics (HyperLogLog)
10. Distributed locking (Redisson)

## Project Structure

```
src/main/java/com/hmdp/
├── config/          # Redis, Redisson, MVC, OpenAPI config
├── controller/      # REST API endpoints
├── dto/             # Request/Response DTOs, ErrorCode, BusinessException
├── entity/          # JPA entities
├── mapper/          # MyBatis-Plus mappers
├── service/         # Business logic
│   └── impl/        # Service implementations
├── interceptor/     # Login interceptor, token refresh
└── utils/           # CacheClient, RedisIdWorker, RedisConstants

frontend/src/
├── api/             # API client with auth handling
├── components/      # Layout, shared components
├── context/         # Auth context provider
└── pages/           # Login, Home, ShopList, ShopDetail, BlogDetail
```

## License

This project is for educational and portfolio purposes.
