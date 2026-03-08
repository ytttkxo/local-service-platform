package com.hmdp.config;

import com.hmdp.dto.BusinessException;
import com.hmdp.dto.ErrorCode;
import com.hmdp.dto.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class WebExceptionAdvice {

    @ExceptionHandler(BusinessException.class)
    public Result handleBusinessException(BusinessException e) {
        // Business error: log at WARN level (not a bug, just user/business logic issue)
        log.warn("Business error: [{}] {}", e.getErrorCode().getCode(), e.getMessage());
        return Result.fail(e.getErrorCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result handleException(Exception e) {
        // Unexpected error: log at ERROR level (this is a bug, needs developer attention)
        log.error("Unexpected error", e);
        return Result.fail(ErrorCode.INTERNAL_ERROR);
    }
}
