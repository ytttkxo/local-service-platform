package com.hmdp.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import cn.hutool.core.lang.UUID;
import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hmdp.dto.LoginFormDTO;
import com.hmdp.dto.Result;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.User;
import com.hmdp.mapper.UserMapper;
import com.hmdp.service.IUserService;
import com.hmdp.utils.RegexUtils;
import com.hmdp.utils.UserHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.connection.BitFieldSubCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static com.hmdp.utils.RedisConstants.*;
import static com.hmdp.utils.SystemConstants.USER_NICK_NAME_PREFIX;

@Slf4j
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements IUserService {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Override
    public Result sendCode(String phone, HttpSession session) {
        // 1. Validate the phone number
        if (RegexUtils.isPhoneInvalid(phone)) {
            // 2. If invalid, return an error message
            return Result.fail("the phone number is invalid");
        }

        // 3. If valid, generate a verification code
        String code = RandomUtil.randomNumbers(6);

        // 4. Store the verification code in redis
        stringRedisTemplate.opsForValue().set(LOGIN_CODE_KEY + phone, code,LOGIN_CODE_TTL, TimeUnit.MINUTES);

        // 5. Send the verification code
        log.debug("it is successfully sending code, code: {}", code);
        // Return OK
        return Result.ok();
    }

    @Override
    public Result login(LoginFormDTO loginForm, HttpSession session) {
        // 1. Validate the phone number
        String phone = loginForm.getPhone();
        if (RegexUtils.isPhoneInvalid(phone)) {
            // If invalid, return an error message
            return Result.fail("the phone number is invalid");
        }

        // 2. Validate the verification code by redis
        String cacheCode = stringRedisTemplate.opsForValue().get(LOGIN_CODE_KEY + phone);
        String code = loginForm.getCode();
        if (cacheCode == null || !cacheCode.equals(code)) {
            // 3. If they do not match, return an error
            return Result.fail("the code is invalid");
        }

        // 4. If they match, query the user by phone number
        User user = query().eq("phone", phone).one();

        // 5. Check whether the user exists
        if (user == null) {
            // 6. If the user does not exist, create a new user and save it
            user = createUserWithPhone(phone);
        }

        // 7. Save user information to Redis
        // 7.1 Generate a random token as the login credential
        String token = UUID.randomUUID().toString(true);

        // 7.2 Convert the User object to a Hash for storage
        UserDTO userDTO = BeanUtil.copyProperties(user, UserDTO.class);
        Map<String, Object> userMap = BeanUtil.beanToMap(userDTO, new HashMap<>(), CopyOptions.create().setIgnoreNullValue(true).setFieldValueEditor((fieldName, fieldValue) -> fieldValue.toString()));

        // 7.3 Store the data in Redis
        String tokenKey = LOGIN_USER_KEY + token;
        stringRedisTemplate.opsForHash().putAll(tokenKey, userMap);
        // Set token expiration time
        stringRedisTemplate.expire(tokenKey, LOGIN_USER_TTL, TimeUnit.MINUTES);

        // save
        return Result.ok(token);
    }

    @Override
    public Result sign() {
        // 1. Get the currently logged-in user
        Long userId = UserHolder.getUser().getId();
        // 2. Get the current date
        LocalDateTime now = LocalDateTime.now();
        // 3. Build the key
        String keySuffix = now.format(DateTimeFormatter.ofPattern(":yyyyMM"));
        String key = USER_SIGN_KEY + userId + keySuffix;
        // 4. Get today’s day-of-month index
        int dayOfMonth = now.getDayOfMonth();
        // 5. Write to Redis: SETBIT key offset 1
        stringRedisTemplate.opsForValue().setBit(key, dayOfMonth - 1, true);
        return Result.ok();
    }

    @Override
    public Result signCount() {
        // 1. Get the currently logged-in user
        Long userId = UserHolder.getUser().getId();
        // 2. Get the current date
        LocalDateTime now = LocalDateTime.now();
        // 3. Build the key
        String keySuffix = now.format(DateTimeFormatter.ofPattern(":yyyyMM"));
        String key = USER_SIGN_KEY + userId + keySuffix;
        // 4. Get today’s day-of-month index
        int dayOfMonth = now.getDayOfMonth();
        // 5. Retrieve all sign-in records of the current month up to today; the result is a decimal number
        List<Long> result = stringRedisTemplate.opsForValue().bitField(
                key,
                BitFieldSubCommands.create()
                        .get(BitFieldSubCommands.BitFieldType.unsigned(dayOfMonth)).valueAt(0)
        );
        if (result == null || result.isEmpty()) {
            return Result.ok(0);
        }
        Long num = result.get(0);
        if (num == null || num == 0) {
            return Result.ok(0);
        }
        // 6. Loop through the bits
        int count = 0;
        while (true) {
            // 6.1 Perform a bitwise AND with 1 to get the last bit of the number // Check whether this bit is 0
            if ((num & 1) == 0) {
                // If it is 0, it means the user did not sign in; end the process
                break;
            } else {
                // If it is not 0, it means the user has signed in; increment the counter by 1
                count++;
            }
            // Right-shift the number by one bit, discard the last bit, and continue to the next bit
            num >>>= 1;
        }
        return Result.ok(count);
    }

    private User createUserWithPhone(String phone) {
        User user = new User();
        user.setPhone(phone);
        user.setNickName(USER_NICK_NAME_PREFIX + RandomUtil.randomString(10));

        save(user);
        return user;
    }
}
