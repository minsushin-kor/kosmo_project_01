package com.car.app.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String secretKeyString;

    @Value("${jwt.expiration}")
    private long expirationMs;

    private SecretKey signingKey;

    @PostConstruct
    protected void init() {
        this.signingKey = Keys.hmacShaKeyFor(secretKeyString.getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(String username, String role, String name) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("name", name)
                .issuedAt(now)
                .expiration(validity)
                .signWith(signingKey)
                .compact();
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public String getName(String token) {
        return getClaims(token).get("name", String.class);
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            System.err.println("Expired JWT token: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("Unsupported JWT token: " + e.getMessage());
        } catch (MalformedJwtException e) {
            System.err.println("Malformed JWT token: " + e.getMessage());
        } catch (SignatureException e) {
            System.err.println("Invalid JWT signature: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("JWT claims string is empty: " + e.getMessage());
        }
        return false;
    }
}
