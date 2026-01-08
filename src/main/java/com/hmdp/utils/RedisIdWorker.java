package com.hmdp.utils;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * ClassName:RedisIdWorker
 * Package: com.hmdp.utils
 * Description:
 *
 * @Autor: Tong
 * @Create: 08.01.26 - 11:01
 * @Version: v1.0
 *
 */
@Component
public class RedisIdWorker {

    private static final long BEGIN_TIMESTAMP = 1767225600L;
    private static final long COUNT_BITS = 32;

    private StringRedisTemplate stringRedisTemplate;

    public RedisIdWorker(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public long nextId(String keyPrefix) {
        // 1. Generate timestamp
        LocalDateTime now = LocalDateTime.now();
        long nowSecond = now.toEpochSecond(ZoneOffset.UTC);
        long timestamp = nowSecond - BEGIN_TIMESTAMP;

        // 2. Generate sequence number
        // 2.1 Get the current date, truncated to days
        String date = now.format(DateTimeFormatter.ofPattern("yyyy:MM:dd"));
        // 2.2 Auto-increment
        long count = stringRedisTemplate.opsForValue().increment("icr:" + keyPrefix + date);

        // 3. Combine and return
        return timestamp << COUNT_BITS | count;
    }
}
