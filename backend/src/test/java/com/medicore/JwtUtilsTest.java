package com.medicore;

import com.medicore.entity.User;
import com.medicore.security.CustomUserDetails;
import com.medicore.security.JwtUtils;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;
    private final String testSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final int testExpirationMs = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", testExpirationMs);
    }

    private Authentication createAuth(String username, User.Role role) {
        User user = new User(username, username + "@medicore.com", "hash", "Test User", "1234567890", role);
        user.setId(101L);
        CustomUserDetails userDetails = CustomUserDetails.build(user);
        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    @Test
    @DisplayName("Should generate valid JWT token and parse username correctly")
    void testGenerateAndValidateJwtToken() {
        Authentication auth = createAuth("pharmacist", User.Role.PHARMACIST);
        String token = jwtUtils.generateJwtToken(auth);

        assertNotNull(token);
        assertTrue(jwtUtils.validateJwtToken(token));
        assertEquals("pharmacist", jwtUtils.getUserNameFromJwtToken(token));
    }

    @Test
    @DisplayName("Should reject expired JWT token")
    void testExpiredJwtTokenValidationReturnsFalse() {
        byte[] keyBytes = Decoders.BASE64.decode(testSecret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        // Build token that expired 10 minutes ago
        String expiredToken = Jwts.builder()
                .subject("expiredUser")
                .claim("userId", 999L)
                .claim("roles", "ROLE_PHARMACIST")
                .issuedAt(new Date(System.currentTimeMillis() - 600000))
                .expiration(new Date(System.currentTimeMillis() - 300000))
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        assertFalse(jwtUtils.validateJwtToken(expiredToken));
    }

    @Test
    @DisplayName("Should reject JWT token signed with an invalid or untrusted secret")
    void testTamperedSignatureJwtTokenReturnsFalse() {
        // Sign token with a different random 256-bit secret key
        String differentSecret = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
        // 32 bytes base64 encoded
        byte[] foreignKeyBytes = Decoders.BASE64.decode("dGhpc2lzYXZlcnlzZWN1cmVhbmRsb25na2V5Zm9ydGVzdGluZzEyMzQ1");
        SecretKey foreignKey = Keys.hmacShaKeyFor(foreignKeyBytes);

        String forgedToken = Jwts.builder()
                .subject("attacker")
                .claim("roles", "ROLE_ADMIN")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(foreignKey, Jwts.SIG.HS256)
                .compact();

        assertFalse(jwtUtils.validateJwtToken(forgedToken));
    }

    @Test
    @DisplayName("Should reject malformed and empty JWT tokens")
    void testMalformedAndEmptyTokenReturnsFalse() {
        assertFalse(jwtUtils.validateJwtToken("not-a-real-jwt-token"));
        assertFalse(jwtUtils.validateJwtToken(""));
        assertFalse(jwtUtils.validateJwtToken(null));
    }
}

