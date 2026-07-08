package com.car.app.transaction;

import com.car.app.car.Car;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TransactionRepository transactionRepository;

    /**
     * 거래 완료 후 상대방(딜러)에 대한 리뷰와 별점 평가를 등록합니다.
     */
    @Transactional
    public Review createReview(Long transactionId, String writerEmail, ReviewDto.Request request) {
        // 1. 거래 조회
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래 내역입니다."));

        // 2. 중복 리뷰 체크
        if (reviewRepository.existsByTransactionTransactionId(transactionId)) {
            throw new IllegalArgumentException("이미 리뷰가 등록된 거래입니다.");
        }

        // 3. 작성자 권한 검증: 현재 거래 차량의 원래 소유자(판매 회원)인지 확인
        Car car = transaction.getCar();
        if (car.getMember() == null || !car.getMember().getEmail().equalsIgnoreCase(writerEmail)) {
            throw new SecurityException("본인이 판매한 거래 건에 대해서만 리뷰를 작성할 수 있습니다.");
        }

        // 4. 입력 평점 범위 검증 (1 ~ 5)
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("평점은 1점부터 5점 사이여야 합니다.");
        }

        // 5. 리뷰 생성 및 저장
        Review review = Review.builder()
                .transaction(transaction)
                .rating(request.getRating())
                .content(request.getContent())
                .build();

        return reviewRepository.save(review);
    }
}
