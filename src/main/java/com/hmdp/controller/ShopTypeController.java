package com.hmdp.controller;


import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.hmdp.dto.Result;
import com.hmdp.entity.ShopType;
import com.hmdp.service.IShopTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static com.hmdp.utils.RedisConstants.CACHE_SHOP_TYPE_KEY;
import static com.hmdp.utils.RedisConstants.CACHE_SHOP_TYPE_TTL;

@Tag(name = "Shop Type", description = "Shop category listing")
@RestController
@RequestMapping("/shop-type")
public class ShopTypeController {
    @Resource
    private IShopTypeService typeService;

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Operation(summary = "List all shop types", description = "Get all shop categories, cached in Redis for 30 minutes")
    @GetMapping("list")
    public Result queryTypeList() {
        String key = CACHE_SHOP_TYPE_KEY;

        String json = stringRedisTemplate.opsForValue().get(key);

        if (StringUtils.isNotBlank(json)) {
            List<ShopType> typeList = JSONUtil.toList(JSONUtil.parseArray(json), ShopType.class);
            return Result.ok(typeList);
        }

        List<ShopType> typeList = typeService.query().orderByAsc("sort").list();

        if (typeList ==  null || typeList.isEmpty()) {
            return Result.fail("shop type list is empty");
        }

        stringRedisTemplate.opsForValue().set(
                key,
                JSONUtil.toJsonStr(typeList),
                CACHE_SHOP_TYPE_TTL,
                TimeUnit.MINUTES
        );

        return Result.ok(typeList);
    }
}
