package com.car.app.dealer;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DealerChurnRepository extends JpaRepository<DealerChurn, Long> {
    Optional<DealerChurn> findFirstByDealerDealerIdOrderByCalculatedAtDesc(Long dealerId);
    List<DealerChurn> findAllByOrderByCalculatedAtDesc();
}
