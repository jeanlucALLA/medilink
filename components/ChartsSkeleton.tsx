import { BarChart3, TrendingUp, Users, LineChart } from 'lucide-react'

export function ChartsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-200 rounded"></div>
                        <div className="h-4 w-96 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-10 w-48 bg-gray-200 rounded"></div>
                </div>
            </div>

            {/* Filter Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 w-64 bg-gray-200 rounded"></div>
            </div>

            {/* Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
                <div className="h-96 w-full bg-gray-100 rounded flex items-end p-4 space-x-4">
                    {/* Fake bars for visual effect */}
                    <div className="h-1/3 w-full bg-gray-200 rounded-t"></div>
                    <div className="h-2/3 w-full bg-gray-200 rounded-t"></div>
                    <div className="h-1/2 w-full bg-gray-200 rounded-t"></div>
                    <div className="h-3/4 w-full bg-gray-200 rounded-t"></div>
                    <div className="h-full w-full bg-gray-200 rounded-t"></div>
                </div>
            </div>
        </div>
    )
}
