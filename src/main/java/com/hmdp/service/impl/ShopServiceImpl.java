package com.hmdp.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.hmdp.dto.Result;
import com.hmdp.entity.Shop;
import com.hmdp.mapper.ShopMapper;
import com.hmdp.service.IShopService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

import static com.hmdp.utils.RedisConstants.CACHE_SHOP_KEY;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@Service
public class ShopServiceImpl extends ServiceImpl<ShopMapper, Shop> implements IShopService {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Override
    public Result queryById(Long id) {
        String key = CACHE_SHOP_KEY + id;
        // 1. Query shop data from Redis cache
        String shopJson = stringRedisTemplate.opsForValue().get(key);

        // 2. Check whether the data exists
        if (StrUtil.isNotBlank(shopJson)) {
            // 3. If it exists, return it directly
            Shop shop = JSONUtil.toBean(shopJson, Shop.class);
            return Result.ok(shop);
        }
        // 4. If it does not exist, query the database by id
        Shop shop = getById(id);
        // 5. If the data does not exist in the database, return an error
        if (shop == null) {
            return Result.fail("the shop does not exist!");
        }
        // 6. If it exists, write the data into Redis
        stringRedisTemplate.opsForValue().set(key,JSONUtil.toJsonStr(shop));

        // 7. Return the result
        return Result.ok(shop);
    }
}
