import {
    CalendarPlus,
    Cpu,
    Factory,
    Layers3,
    type LucideIcon,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";

import type {
    ViewerDashboardResponse,
} from "@/schemas/dashboard";

/**
 * Props accepted by the system metrics panel.
 *
 * The component receives dashboard data that has already been retrieved
 * and validated by the dashboard API layer.
 */
type MetricsStatsPanelProps = {
    dashboardData:
        | ViewerDashboardResponse
        | null;

    isLoading?: boolean;
};

/**
 * Describes the configuration required to render a single metric card.
 *
 * Each metric includes a display title, numeric value, short description,
 * and Lucide icon component.
 */
type MetricDefinition = {
    title: string;
    value: number;
    description: string;
    icon: LucideIcon;
};

/**
 * Renders placeholder metric cards while dashboard data is loading.
 *
 * The component mirrors the layout of the real metrics grid using four
 * shadcn/ui Card components containing Skeleton placeholders.
 *
 * Keeping the skeleton dimensions similar to the final content helps reduce
 * layout shifting when the backend response becomes available.
 *
 * @returns A responsive grid containing four loading-placeholder metric cards.
 */
function MetricsStatsPanelSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
                (_, index) => (
                    <Card
                        key={index}
                        className="border-gray-200 bg-white shadow-sm"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-28" />

                            <Skeleton className="h-9 w-9 rounded-lg" />
                        </CardHeader>

                        <CardContent>
                            <Skeleton className="mb-2 h-9 w-16" />

                            <Skeleton className="h-3 w-40" />
                        </CardContent>
                    </Card>
                )
            )}
        </div>
    );
}

export default function MetricsStatsPanel({
                                              dashboardData,
                                              isLoading = false,
                                          }: MetricsStatsPanelProps) {
    if (isLoading) {
        return (
            <MetricsStatsPanelSkeleton />
        );
    }

    if (!dashboardData) {
        return (
            <Card className="border-gray-200 bg-white shadow-sm">
                <CardContent className="p-6 text-center">
                    <p className="text-sm font-semibold text-gray-700">
                        Dashboard metrics unavailable.
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        The platform statistics could
                        not be loaded.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const metrics: MetricDefinition[] = [
        {
            title: "Active Devices",
            value:
            dashboardData.activeDevices,
            description:
                "Devices currently available",
            icon: Cpu,
        },
        {
            title: "Manufacturers",
            value:
            dashboardData.totalManufacturers,
            description:
                "Distinct device manufacturers",
            icon: Factory,
        },
        {
            title: "Device Models",
            value:
            dashboardData.totalModels,
            description:
                "Distinct registered models",
            icon: Layers3,
        },
        {
            title: "Added This Month",
            value:
            dashboardData
                .devicesAddedThisMonth,
            description:
                "Devices registered this month",
            icon: CalendarPlus,
        },
    ];

    return (
        <section
            aria-label="Dashboard metrics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
            {metrics.map(
                ({
                     title,
                     value,
                     description,
                     icon: Icon,
                 }) => (
                    <Card
                        key={title}
                        className="border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                {title}
                            </CardTitle>

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                                <Icon
                                    aria-hidden="true"
                                    className="h-4 w-4 text-gray-600"
                                />
                            </div>
                        </CardHeader>

                        <CardContent>
                            <p className="text-3xl font-bold tracking-tight text-gray-900">
                                {value.toLocaleString()}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                {description}
                            </p>
                        </CardContent>
                    </Card>
                )
            )}
        </section>
    );
}