package com.hmdp.service.impl;

import com.hmdp.dto.BusinessException;
import com.hmdp.dto.ErrorCode;
import com.hmdp.dto.LoginFormDTO;
import com.hmdp.dto.Result;
import com.hmdp.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import javax.servlet.http.HttpSession;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserServiceImpl.
 *
 * KEY CONCEPTS — read this first:
 *
 * 1. @ExtendWith(MockitoExtension.class)
 *    Tells JUnit 5 to use Mockito. NO Spring, NO database, NO Redis.
 *    Tests run in milliseconds.
 *
 * 2. @Mock
 *    Creates a "fake" object. When you call any method on it, it returns null/0/false
 *    by default. You can use when(...).thenReturn(...) to control what it returns.
 *
 * 3. @InjectMocks
 *    Creates a REAL instance of the class under test, and injects all @Mock objects
 *    into its fields (matching by type).
 *
 * 4. Test naming: methodName_scenario_expectedResult
 *    e.g. sendCode_invalidPhone_throwsBusinessException
 *    This makes test output readable like a specification.
 *
 * 5. AAA pattern: Arrange → Act → Assert
 *    - Arrange: set up test data and mock behavior
 *    - Act: call the method being tested
 *    - Assert: verify the result is correct
 */
@ExtendWith(MockitoExtension.class)   // ← Use Mockito, not Spring
class UserServiceImplTest {

    // ── Mocks (fake dependencies) ──────────────────────────

    @Mock
    private StringRedisTemplate stringRedisTemplate;  // fake Redis

    @Mock
    private ValueOperations<String, String> valueOps; // fake Redis string ops

    @Mock
    private HashOperations<String, Object, Object> hashOps; // fake Redis hash ops

    @Mock
    private UserMapper userMapper;  // fake database mapper

    @Mock
    private HttpSession session;    // fake HTTP session

    // ── System under test ──────────────────────────────────

    @InjectMocks
    private UserServiceImpl userService;  // REAL object, mocks injected

    // ── Setup ──────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        // When userService calls stringRedisTemplate.opsForValue(),
        // return our mock valueOps instead of null.
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        lenient().when(stringRedisTemplate.opsForHash()).thenReturn(hashOps);
    }

    // ── Tests for sendCode() ───────────────────────────────

    @Nested  // ← Groups related tests together
    @DisplayName("sendCode")
    class SendCode {

        @Test
        @DisplayName("valid phone → stores code in Redis and returns OK")
        void validPhone_returnsOk() {
            // Arrange: nothing special needed, phone format is valid

            // Act: call the real method
            Result result = userService.sendCode("13812345678", session);

            // Assert: check that it returned success
            assertTrue(result.getSuccess());

            // Verify: confirm that Redis was called to store the code
            // verify() checks: "was this mock method actually called?"
            verify(valueOps).set(
                    startsWith("login:code:"),   // key starts with this prefix
                    anyString(),                  // any 6-digit code
                    anyLong(),                    // TTL value
                    any()                         // TimeUnit
            );
        }

        @Test
        @DisplayName("invalid phone → throws INVALID_PHONE")
        void invalidPhone_throwsException() {
            // Act + Assert: expect a BusinessException
            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> userService.sendCode("123", session)
            );

            // Verify the error code is correct
            assertEquals(ErrorCode.INVALID_PHONE, ex.getErrorCode());

            // Verify Redis was NEVER called (code should not be stored)
            verifyNoInteractions(valueOps);
        }

        @Test
        @DisplayName("null phone → throws INVALID_PHONE")
        void nullPhone_throwsException() {
            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> userService.sendCode(null, session)
            );
            assertEquals(ErrorCode.INVALID_PHONE, ex.getErrorCode());
        }

        @Test
        @DisplayName("empty phone → throws INVALID_PHONE")
        void emptyPhone_throwsException() {
            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> userService.sendCode("", session)
            );
            assertEquals(ErrorCode.INVALID_PHONE, ex.getErrorCode());
        }
    }

    // ── Tests for login() ──────────────────────────────────

    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("invalid phone → throws INVALID_PHONE")
        void invalidPhone_throwsException() {
            // Arrange
            LoginFormDTO form = new LoginFormDTO();
            form.setPhone("bad-number");
            form.setCode("123456");

            // Act + Assert
            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> userService.login(form, session)
            );
            assertEquals(ErrorCode.INVALID_PHONE, ex.getErrorCode());
        }

        @Test
        @DisplayName("wrong code → throws INVALID_CODE")
        void wrongCode_throwsException() {
            // Arrange
            LoginFormDTO form = new LoginFormDTO();
            form.setPhone("13812345678");
            form.setCode("000000");

            // Simulate: Redis has stored "123456" as the real code
            when(valueOps.get("login:code:13812345678")).thenReturn("123456");

            // Act + Assert: user sent "000000" but real code is "123456"
            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> userService.login(form, session)
            );
            assertEquals(ErrorCode.INVALID_CODE, ex.getErrorCode());
        }

        @Test
        @DisplayName("no code in Redis (expired) → throws INVALID_CODE")
        void expiredCode_throwsException() {
            // Arrange
            LoginFormDTO form = new LoginFormDTO();
            form.setPhone("13812345678");
            form.setCode("123456");

            // Simulate: Redis returns null (code expired or never sent)
            when(valueOps.get("login:code:13812345678")).thenReturn(null);

            // Act + Assert
            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> userService.login(form, session)
            );
            assertEquals(ErrorCode.INVALID_CODE, ex.getErrorCode());
        }
    }
}
