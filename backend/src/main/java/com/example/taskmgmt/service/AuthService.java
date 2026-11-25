package com.example.taskmgmt.service;

import com.example.taskmgmt.dto.request.LoginRequest;
import com.example.taskmgmt.dto.response.LoginResponse;
import com.example.taskmgmt.dto.response.UserSummaryResponse;
import com.example.taskmgmt.exception.BusinessException;
import com.example.taskmgmt.exception.ErrorCode;
import com.example.taskmgmt.security.CustomUserDetails;
import com.example.taskmgmt.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username().trim(),
                            request.password()
                    )
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(userDetails);

            return new LoginResponse(
                    token,
                    "Bearer",
                    jwtService.getExpirationSeconds(),
                    UserSummaryResponse.from(userDetails)
            );
        } catch (AuthenticationException ex) {
            // Không tiết lộ tài khoản có tồn tại hay không -> luôn trả 401 BAD_CREDENTIALS
            throw new BusinessException(ErrorCode.BAD_CREDENTIALS);
        }
    }
}
