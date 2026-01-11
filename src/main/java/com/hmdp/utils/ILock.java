package com.hmdp.utils;

/**
 * ClassName:ILock
 * Package: com.hmdp.utils
 * Description:
 *
 * @Autor: Tong
 * @Create: 10.01.26 - 11:07
 * @Version: v1.0
 *
 */
public interface ILock {

    /**
     * Try to acquire the lock.
     *
     * @param timeoutSec the lock expiration time in seconds; the lock will be automatically released after expiration
     * @return true if the lock is successfully acquired; false otherwise
     */
    boolean tryLock(long timeoutSec);

    /**
     * Release the lock.
     */
    void unlock();
}
