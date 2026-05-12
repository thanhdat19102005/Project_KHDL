$v1Path = "project_khdl.client/public/mock_api/v1"
$v2Path = "project_khdl.client/public/mock_api/v2"

# Helper to write JSON
function Write-JsonFile($path, $data) {
    $data | ConvertTo-Json -Depth 10 | Out-File -FilePath $path -Encoding utf8
}

# --- KPI ---
$kpiV1 = @{
    totalUsers = 2110184
    totalSearch = 1635542
    avgSearchPerUser = 0.775
    updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}
Write-JsonFile "$v1Path/kpi.json" $kpiV1

$kpiV2 = @{
    totalUsers = 2110184 + 150
    totalSearch = 1635542 + 4500
    avgSearchPerUser = 0.776
    updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}
Write-JsonFile "$v2Path/kpi.json" $kpiV2

# --- Monthly Trend (Hourly) ---
$hourlyV1 = 0..23 | ForEach-Object { @{ search_hour = $_; total_search = 5000 + (Get-Random -Minimum 0 -Maximum 2000) } }
Write-JsonFile "$v1Path/monthly-trend.json" $hourlyV1

$hourlyV2 = 0..23 | ForEach-Object { @{ search_hour = $_; total_search = 5500 + (Get-Random -Minimum 0 -Maximum 2500) } }
Write-JsonFile "$v2Path/monthly-trend.json" $hourlyV2

# --- Search Distribution (Monthly) ---
$monthlyV1 = 1..12 | ForEach-Object { @{ search_month = $_; total_search = 100000 + (Get-Random -Minimum 0 -Maximum 50000) } }
Write-JsonFile "$v1Path/search-distribution.json" $monthlyV1

$monthlyV2 = 1..12 | ForEach-Object { @{ search_month = $_; total_search = 120000 + (Get-Random -Minimum 0 -Maximum 60000) } }
Write-JsonFile "$v2Path/search-distribution.json" $monthlyV2

# --- Top Keywords ---
$keywordsV1 = @("iphone", "samsung", "oppo", "xiaomi", "realme") | ForEach-Object { @{ keyword = $_; searchCount = (Get-Random -Minimum 10000 -Maximum 50000) } }
Write-JsonFile "$v1Path/top-keywords.json" $keywordsV1

$keywordsV2 = @("iphone 15", "samsung s24", "oppo reno", "xiaomi 14", "realme 12") | ForEach-Object { @{ keyword = $_; searchCount = (Get-Random -Minimum 15000 -Maximum 60000) } }
Write-JsonFile "$v2Path/top-keywords.json" $keywordsV2

# --- Top Categories ---
$categoriesV1 = @(
    @{ category_name = "Điện thoại"; total_search = 500000; percentage = "45.0" }
    @{ category_name = "Máy tính bảng"; total_search = 300000; percentage = "25.0" }
    @{ category_name = "Phụ kiện"; total_search = 200000; percentage = "20.0" }
)
Write-JsonFile "$v1Path/top-categories.json" $categoriesV1

$categoriesV2 = @(
    @{ category_name = "Điện thoại"; total_search = 550000; percentage = "46.0" }
    @{ category_name = "Máy tính bảng"; total_search = 320000; percentage = "26.0" }
    @{ category_name = "Phụ kiện"; total_search = 210000; percentage = "18.0" }
)
Write-JsonFile "$v2Path/top-categories.json" $categoriesV2

# --- Platform Distribution ---
$platformsV1 = @(
    @{ platform = "android"; total_search = 800000; percentage = "50.0" }
    @{ platform = "ios"; total_search = 600000; percentage = "40.0" }
    @{ platform = "web"; total_search = 200000; percentage = "10.0" }
)
Write-JsonFile "$v1Path/platform-distribution.json" $platformsV1

$platformsV2 = @(
    @{ platform = "android"; total_search = 850000; percentage = "51.0" }
    @{ platform = "ios"; total_search = 650000; percentage = "41.0" }
    @{ platform = "web"; total_search = 150000; percentage = "8.0" }
)
Write-JsonFile "$v2Path/platform-distribution.json" $platformsV2

# --- Cluster Summaries ---
$summariesV1 = @(
    @{ cluster = 0; totalUsers = 500000; color = "#3b82f6" }
    @{ cluster = 1; totalUsers = 400000; color = "#10b981" }
    @{ cluster = 2; totalUsers = 300000; color = "#f59e0b" }
    @{ cluster = 3; totalUsers = 200000; color = "#ef4444" }
)
Write-JsonFile "$v1Path/cluster-summaries.json" $summariesV1

$summariesV2 = @(
    @{ cluster = 0; totalUsers = 510000; color = "#3b82f6" }
    @{ cluster = 1; totalUsers = 410000; color = "#10b981" }
    @{ cluster = 2; totalUsers = 310000; color = "#f59e0b" }
    @{ cluster = 3; totalUsers = 210000; color = "#ef4444" }
)
Write-JsonFile "$v2Path/cluster-summaries.json" $summariesV2

# --- Segment Scatter ---
$scatterV1 = 1..100 | ForEach-Object { @{ x = (Get-Random -Minimum 0 -Maximum 100); y = (Get-Random -Minimum 0 -Maximum 100); cluster = (Get-Random -Minimum 0 -Maximum 4) } }
Write-JsonFile "$v1Path/segment-scatter.json" $scatterV1

$scatterV2 = 1..100 | ForEach-Object { @{ x = (Get-Random -Minimum 5 -Maximum 105); y = (Get-Random -Minimum 5 -Maximum 105); cluster = (Get-Random -Minimum 0 -Maximum 4) } }
Write-JsonFile "$v2Path/segment-scatter.json" $scatterV2

# --- Segment Insights ---
$insightsV1 = @(
    @{ cluster = 0; title = "Core Value Users v1"; text = "Highly Engaged" }
)
Write-JsonFile "$v1Path/segment-insights.json" $insightsV1

$insightsV2 = @(
    @{ cluster = 0; title = "Core Value Users v2"; text = "Extremely Engaged" }
)
Write-JsonFile "$v2Path/segment-insights.json" $insightsV2

# --- Segment Users ---
$usersV1 = @{
    data = 1..15 | ForEach-Object { @{ customerId = "USER_$_"; totalSearch = (Get-Random -Minimum 10 -Maximum 100) } }
    totalCount = 100
}
Write-JsonFile "$v1Path/segment-users.json" $usersV1

$usersV2 = @{
    data = 1..15 | ForEach-Object { @{ customerId = "USER_$_"; totalSearch = (Get-Random -Minimum 20 -Maximum 120) } }
    totalCount = 120
}
Write-JsonFile "$v2Path/segment-users.json" $usersV2

Write-Host "Mock data generated successfully!"
