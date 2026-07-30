import apiClient from "./apiClient";

const DEFAULT_CARD_CONFIG = {
    members: {
        icon: "👥",
        color: "blue",
    },
    companies: {
        icon: "🏢",
        color: "purple",
    },
    cars: {
        icon: "🚗",
        color: "green",
    },
    transactions: {
        icon: "✓",
        color: "yellow",
    },
};

function normalizeNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}

function normalizeChartData(chartData) {
    if (!Array.isArray(chartData)) {
        return Array.from(
            { length: 30 },
            () => 0
        );
    }

    const normalized = chartData.map(
        normalizeNumber
    );

    if (normalized.length === 0) {
        return Array.from(
            { length: 30 },
            () => 0
        );
    }

    return normalized;
}

function normalizeDashboardCard(card) {
    const key = String(
        card?.key || ""
    ).toLowerCase();

    const config =
        DEFAULT_CARD_CONFIG[key] || {
            icon: "📊",
            color: "blue",
        };

    const trend = String(
        card?.trend || "SAME"
    ).toUpperCase();

    return {
        key,
        title: card?.title || "-",
        value: normalizeNumber(card?.value),
        unit: card?.unit || "",
        description:
            card?.description || "",
        currentPeriodCount:
            normalizeNumber(
                card?.currentPeriodCount
            ),
        previousPeriodCount:
            normalizeNumber(
                card?.previousPeriodCount
            ),
        changeRate:
            normalizeNumber(card?.changeRate),
        trend,
        chartData: normalizeChartData(
            card?.chartData
        ),
        icon: config.icon,
        color: config.color,
    };
}

function normalizeRecentAccount(account) {
    return {
        id: account?.id,
        name: account?.name || "-",
        loginId: account?.loginId || "-",
        email: account?.email || "-",
        phone: account?.phone || "-",
        status: account?.status || "-",
        createdAt:
            account?.createdAt || null,
    };
}

function normalizeRecentCar(car) {
    return {
        ...car,
        id:
            car?.carId ??
            car?.id ??
            null,
    };
}

function normalizeMonthlyStats(stats) {
    return {
        months: Array.isArray(stats?.months)
            ? stats.months
            : [],
        members: Array.isArray(stats?.members)
            ? stats.members.map(normalizeNumber)
            : [],
        cars: Array.isArray(stats?.cars)
            ? stats.cars.map(normalizeNumber)
            : [],
        transactions: Array.isArray(
            stats?.transactions
        )
            ? stats.transactions.map(
                normalizeNumber
            )
            : [],
    };
}

export async function getAdminDashboardSummary() {
    const result = await apiClient.get(
        "/admin/dashboard/summary"
    );

    return {
        totalMembers:
            normalizeNumber(
                result?.totalMembers
            ),
        totalCompanies:
            normalizeNumber(
                result?.totalCompanies
            ),
        totalDealers:
            normalizeNumber(
                result?.totalDealers
            ),
        totalCars:
            normalizeNumber(
                result?.totalCars
            ),
        totalCompletedTransactions:
            normalizeNumber(
                result?.totalCompletedTransactions
            ),
        currentMonthCompletedTransactions:
            normalizeNumber(
                result?.currentMonthCompletedTransactions
            ),
        pendingReportsCount:
            normalizeNumber(
                result?.pendingReportsCount
            ),
        summaryCards: Array.isArray(
            result?.summaryCards
        )
            ? result.summaryCards.map(
                normalizeDashboardCard
            )
            : [],
        recentAccounts: Array.isArray(
            result?.recentAccounts
        )
            ? result.recentAccounts.map(
                normalizeRecentAccount
            )
            : [],
        recentCars: Array.isArray(
            result?.recentCars
        )
            ? result.recentCars.map(
                normalizeRecentCar
            )
            : [],
        monthlyStats:
            normalizeMonthlyStats(
                result?.monthlyStats
            ),
    };
}