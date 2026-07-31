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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PurchaseRequestServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CarRepository carRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private DealerRepository dealerRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PurchaseRequestService purchaseRequestService;

    @Test
    void purchaseRequestDoesNotSellCarBeforeDealerApproval() {
        Dealer dealer = Dealer.builder()
                .dealerId(3L)
                .loginId("dealer")
                .build();
        Member buyer = Member.builder()
                .memberId(7L)
                .loginId("member")
                .name("구매회원")
                .build();
        Car car = Car.builder()
                .carId(99L)
                .dealer(dealer)
                .year(2022)
                .make("현대")
                .model("쏘나타")
                .sellingPrice(20_000_000L)
                .status("REGISTERED")
                .build();

        when(carRepository.findById(99L))
                .thenReturn(Optional.of(car));
        when(memberRepository.findByLoginId("member"))
                .thenReturn(Optional.of(buyer));
        when(transactionRepository
                .existsByCarCarIdAndBuyerTypeAndBuyerIdAndStatus(
                        99L,
                        "MEMBER",
                        7L,
                        PurchaseRequestService.PURCHASE_REQUESTED))
                .thenReturn(false);
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> {
                    Transaction transaction = invocation.getArgument(0);
                    transaction.setTransactionId(100L);
                    return transaction;
                });

        TransactionDto.Response response =
                purchaseRequestService.requestPurchase(
                        99L,
                        "member");

        assertEquals(
                PurchaseRequestService.PURCHASE_REQUESTED,
                response.getStatus());
        assertEquals("REGISTERED", car.getStatus());
        assertEquals("구매회원", response.getBuyerName());
        verify(carRepository, never()).save(any(Car.class));
        verify(notificationService).sendNotification(
                "DEALER",
                3L,
                PurchaseRequestService.PURCHASE_REQUESTED,
                "구매회원님이 2022년식 현대 쏘나타 차량 구매를 요청했습니다.",
                99L);
    }

    @Test
    void dealerApprovalSellsCarAndCancelsOtherRequests() {
        Dealer dealer = Dealer.builder()
                .dealerId(3L)
                .loginId("dealer")
                .build();
        Member buyer = Member.builder()
                .memberId(7L)
                .name("승인회원")
                .build();
        Car car = Car.builder()
                .carId(99L)
                .dealer(dealer)
                .make("현대")
                .model("쏘나타")
                .status("REGISTERED")
                .build();
        Transaction approvedRequest = Transaction.builder()
                .transactionId(100L)
                .car(car)
                .buyerType("MEMBER")
                .buyerId(7L)
                .sellerType("DEALER")
                .sellerId(3L)
                .status(PurchaseRequestService.PURCHASE_REQUESTED)
                .build();
        Transaction otherRequest = Transaction.builder()
                .transactionId(101L)
                .car(car)
                .buyerType("MEMBER")
                .buyerId(8L)
                .sellerType("DEALER")
                .sellerId(3L)
                .status(PurchaseRequestService.PURCHASE_REQUESTED)
                .build();

        when(dealerRepository.findByLoginId("dealer"))
                .thenReturn(Optional.of(dealer));
        when(transactionRepository.findByIdForUpdate(100L))
                .thenReturn(Optional.of(approvedRequest));
        when(carRepository.findByIdForUpdate(99L))
                .thenReturn(Optional.of(car));
        when(transactionRepository.findByCarCarIdAndStatus(
                99L,
                PurchaseRequestService.PURCHASE_REQUESTED))
                .thenReturn(List.of(
                        approvedRequest,
                        otherRequest));
        when(transactionRepository.save(approvedRequest))
                .thenReturn(approvedRequest);
        when(memberRepository.findById(7L))
                .thenReturn(Optional.of(buyer));

        TransactionDto.Response response =
                purchaseRequestService.approveRequest(
                        100L,
                        "dealer");

        assertEquals("SOLD", car.getStatus());
        assertEquals("COMPLETED", approvedRequest.getStatus());
        assertEquals("CANCELLED", otherRequest.getStatus());
        assertEquals("승인회원", response.getBuyerName());
        verify(carRepository).save(car);
        verify(transactionRepository).saveAll(any());
    }
}
