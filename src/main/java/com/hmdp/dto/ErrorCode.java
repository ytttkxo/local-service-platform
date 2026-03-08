package com.hmdp.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // Client errors (4xx)
    BAD_REQUEST(400, "Bad request"),
    UNAUTHORIZED(401, "Authentication required"),
    FORBIDDEN(403, "Access denied"),
    NOT_FOUND(404, "Resource not found"),

    // Business errors (1xxx)
    INVALID_PHONE(1001, "Invalid phone number"),
    INVALID_CODE(1002, "Invalid verification code"),
    SHOP_NOT_FOUND(1003, "Shop not found"),
    VOUCHER_NOT_FOUND(1004, "Voucher not found"),
    STOCK_INSUFFICIENT(1005, "Insufficient stock"),
    ORDER_DUPLICATE(1006, "Duplicate order: one per user"),
    SECKILL_NOT_STARTED(1007, "Flash sale has not started yet"),
    SECKILL_ENDED(1008, "Flash sale has ended"),
    BLOG_NOT_FOUND(1009, "Blog not found"),
    BLOG_SAVE_FAILED(1010, "Failed to save blog"),
    INVALID_FILENAME(1011, "Invalid file name"),
    NOT_IMPLEMENTED(1012, "Feature not implemented"),

    // Server errors (5xxx)
    INTERNAL_ERROR(5000, "Internal server error");

    private final int code;
    private final String message;
}
