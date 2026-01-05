package com.hmdp.utils;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.hmdp.dto.UserDTO;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * ClassName:LoginInterceptor
 * Package: com.hmdp.utils
 * Description:
 *
 * @Autor: Tong
 * @Create: 03.01.26 - 16:24
 * @Version: v1.0
 *
 */
public class LoginInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Determine whether the request needs to be intercepted
        if (UserHolder.getUser() == null) {
            // No user found, interception is required — set status code
            response.setStatus(401);
            // Block the request
            return false;
        }
        // User exists, allow the request to proceed
        return true;
    }
}
