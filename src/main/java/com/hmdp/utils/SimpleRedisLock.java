package com.hmdp.utils;

import cn.hutool.core.lang.UUID;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import javax.swing.text.StyledEditorKit;
import java.util.Collections;
import java.util.concurrent.TimeUnit;

/**
 * ClassName:SimpleRedisLock
 * Package: com.hmdp.utils
 * Description:
 *
 * @Autor: Tong
 * @Create: 10.01.26 - 11:11
 * @Version: v1.0
 *
 */
public class SimpleRedisLock implements ILock {

    private String name;
    private StringRedisTemplate stringRedisTemplate;

    public SimpleRedisLock(String name, StringRedisTemplate stringRedisTemplate) {
        this.name = name;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    private static final String KEY_PREFIX = "lock:";
    private static final String ID_PREFIX = UUID.randomUUID().toString(true) + "-";
    private static final DefaultRedisScript<Long> UNLOCK_SCRIPT;
    static {
        UNLOCK_SCRIPT = new DefaultRedisScript<>();
        UNLOCK_SCRIPT.setLocation(new ClassPathResource("unlock.lua"));
        UNLOCK_SCRIPT.setResultType(Long.class);
    }

    @Override
    public boolean tryLock(long timeoutSec) {

        // Get the unique identifier of the current thread
        String threadId = ID_PREFIX + Thread.currentThread().getId();
        // Acquire the lock
        Boolean success = stringRedisTemplate.opsForValue().setIfAbsent(KEY_PREFIX + name, threadId, timeoutSec, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(success);
    }

    @Override
    public void unlock() {
        stringRedisTemplate.execute(
                UNLOCK_SCRIPT,
                Collections.singletonList(KEY_PREFIX + name),
                ID_PREFIX + Thread.currentThread().getId()
        );
    }

    /*@Override
    public void unlock() {

        // Get the unique identifier of the current thread
        String threadId = ID_PREFIX + Thread.currentThread().getId();
        // Get the lock identifier
        String id = stringRedisTemplate.opsForValue().get(KEY_PREFIX + name);
        // Check whether the identifiers match
        if (threadId.equals(id)) {
            // Release the lock
            stringRedisTemplate.delete(KEY_PREFIX + name);
        }
    }*/
}
