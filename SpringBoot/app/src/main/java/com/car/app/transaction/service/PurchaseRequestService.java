package com.car.app.transaction.service;

import com.car.app.car.entity.Car;
import com.car.app.car.repository.CarRepository;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.member.entity.Member;
import com.car.app.member.repository.MemberRepository;
import com.car.app.notification.service.NotificationService;
import com.car.app.transaction.dto.TransactionDto;
import com.car.app.transaction.entity.Transaction;
import com.car.app.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseRequestService {

    public static final String PURCHASE_REQUESTED = "PURCHASE_REQUESTED";

    private final TransactionRepository transactionRepository;
    private final CarRepository carRepository;
    private final MemberRepository memberRepository;
    private final DealerRepository dealerRepository;
    private final NotificationService notificationService;

    @Transactional
    public TransactionDto.Response requestPurchase(
            Long carId,
            String memberLoginId) {

        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 차량 매물입니다."));
        Member buyer = getMember(memberLoginId);

        if (car.getDealer() == null || car.getMember() != null) {
            throw new IllegalArgumentException(
                    "딜러가 등록한 일반 판매 차량만 구매 요청할 수 있습니다.");
        }
        if (!"REGISTERED".equalsIgnoreCase(car.getStatus())) {
            throw new IllegalArgumentException(
                    "현재 구매 요청이 가능한 차량이 아닙니다.");
        }
        if (transactionRepository
                .existsByCarCarIdAndBuyerTypeAndBuyerIdAndStatus(
                        carId,
                        "MEMBER",
                        buyer.getMemberId(),
                        PURCHASE_REQUESTED)) {
            throw new IllegalArgumentException(
                    "이미 구매 요청을 보낸 차량입니다.");
        }

        long dealPrice = car.getSellingPrice() == null
                ? 0L
                : car.getSellingPrice();
        BigDecimal commissionRate = new BigDecimal("0.0300");
        long commissionAmount =
                (long) (dealPrice * commissionRate.doubleValue());

        Transaction request = Transaction.builder()
                .car(car)
                .buyerType("MEMBER")
                .buyerId(buyer.getMemberId())
                .sellerType("DEALER")
                .sellerId(car.getDealer().getDealerId())
                .dealPrice(dealPrice)
                .commissionRate(commissionRate)
                .commissionAmount(commissionAmount)
                .status(PURCHASE_REQUESTED)
                .build();

        Transaction saved = transactionRepository.save(request);

        String message = String.format(
                "%s님이 %d년식 %s %s 차량 구매를 요청했습니다.",
                buyer.getName(),
                car.getYear(),
                car.getMake(),
                car.getModel());
        notificationService.sendNotification(
                "DEALER",
                car.getDealer().getDealerId(),
                PURCHASE_REQUESTED,
                message,
                car.getCarId());

        return toResponse(saved, buyer.getName());
    }

    @Transactional(readOnly = true)
    public TransactionDto.Response getMyPendingRequest(
            Long carId,
            String memberLoginId) {

        Member member = getMember(memberLoginId);

        return transactionRepository
                .findTopByCarCarIdAndBuyerTypeAndBuyerIdAndStatusOrderByCreatedAtDesc(
                        carId,
                        "MEMBER",
                        member.getMemberId(),
                        PURCHASE_REQUESTED)
                .map(transaction ->
                        toResponse(transaction, member.getName()))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<TransactionDto.Response> getReceivedRequests(
            String dealerLoginId) {

        Dealer dealer = getDealer(dealerLoginId);

        return transactionRepository
                .findBySellerTypeAndSellerIdAndBuyerTypeAndStatusOrderByCreatedAtDesc(
                        "DEALER",
                        dealer.getDealerId(),
                        "MEMBER",
                        PURCHASE_REQUESTED)
                .stream()
                .map(transaction -> {
                    String buyerName = memberRepository
                            .findById(transaction.getBuyerId())
                            .map(Member::getName)
                            .orElse("회원");
                    return toResponse(transaction, buyerName);
                })
                .toList();
    }

    @Transactional
    public TransactionDto.Response approveRequest(
            Long transactionId,
            String dealerLoginId) {

        Dealer dealer = getDealer(dealerLoginId);
        Transaction request = transactionRepository
                .findByIdForUpdate(transactionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 구매 요청입니다."));

        if (!PURCHASE_REQUESTED.equals(request.getStatus())) {
            throw new IllegalArgumentException(
                    "이미 처리되었거나 취소된 구매 요청입니다.");
        }
        if (!"DEALER".equals(request.getSellerType())
                || !dealer.getDealerId().equals(request.getSellerId())) {
            throw new AccessDeniedException(
                    "본인 차량의 구매 요청만 승인할 수 있습니다.");
        }

        Car car = carRepository
                .findByIdForUpdate(request.getCar().getCarId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "구매 요청 차량을 찾을 수 없습니다."));

        if (car.getDealer() == null
                || !dealer.getDealerId().equals(
                        car.getDealer().getDealerId())) {
            throw new AccessDeniedException(
                    "본인 차량의 구매 요청만 승인할 수 있습니다.");
        }
        if (!"REGISTERED".equalsIgnoreCase(car.getStatus())) {
            throw new IllegalArgumentException(
                    "이미 판매가 완료되었거나 구매할 수 없는 차량입니다.");
        }

        LocalDateTime now = LocalDateTime.now();
        request.setCar(car);
        request.setStatus("COMPLETED");
        request.setCompletedAt(now);
        car.setStatus("SOLD");

        List<Transaction> pendingRequests =
                transactionRepository.findByCarCarIdAndStatus(
                        car.getCarId(),
                        PURCHASE_REQUESTED);

        for (Transaction pendingRequest : pendingRequests) {
            if (pendingRequest.getTransactionId()
                    .equals(request.getTransactionId())) {
                continue;
            }

            pendingRequest.setStatus("CANCELLED");
            pendingRequest.setCancelledAt(now);
            notificationService.sendNotification(
                    "MEMBER",
                    pendingRequest.getBuyerId(),
                    "PURCHASE_CANCELLED",
                    String.format(
                            "%s %s 차량이 다른 회원에게 판매되어 구매 요청이 종료되었습니다.",
                            car.getMake(),
                            car.getModel()),
                    car.getCarId());
        }

        carRepository.save(car);
        transactionRepository.saveAll(pendingRequests);
        Transaction approved = transactionRepository.save(request);

        notificationService.sendNotification(
                "MEMBER",
                request.getBuyerId(),
                "PURCHASE_APPROVED",
                String.format(
                        "%s %s 차량 구매 요청이 승인되었습니다.",
                        car.getMake(),
                        car.getModel()),
                car.getCarId());

        String buyerName = memberRepository
                .findById(request.getBuyerId())
                .map(Member::getName)
                .orElse("회원");
        return toResponse(approved, buyerName);
    }

    private Member getMember(String loginId) {
        return memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 회원 계정입니다."));
    }

    private Dealer getDealer(String loginId) {
        return dealerRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 딜러 계정입니다."));
    }

    private TransactionDto.Response toResponse(
            Transaction transaction,
            String buyerName) {

        TransactionDto.Response response =
                TransactionDto.Response.fromEntity(transaction);
        response.setBuyerName(buyerName);
        return response;
    }
}
