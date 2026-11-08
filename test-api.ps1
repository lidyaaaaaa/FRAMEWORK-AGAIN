$base = "http://localhost:3000"
$run = Get-Random

function Call($method, $path, $body = $null) {
  $p = @{ Method = $method; Uri = "$base$path"; ContentType = "application/json" }
  if ($body) { $p.Body = ($body | ConvertTo-Json) }
  try {
    $r = Invoke-RestMethod @p
    Write-Host "  OK" -ForegroundColor Green
    return $r.data
  } catch {
    $code = [int]$_.Exception.Response.StatusCode
    Write-Host "  -> $code : $($_.ErrorDetails.Message)" -ForegroundColor Red
  }
}

Write-Host "`n[1] Buat team" -ForegroundColor Cyan
$team = Call POST "/teams" @{ name = "Tim Backend $run"; description = "Tim pengembang API" }

Write-Host "`n[2] Buat member (teamId)" -ForegroundColor Cyan
$member = Call POST "/members" @{ name = "Andi"; email = "andi$run@example.com"; teamId = $team.id }

Write-Host "`n[3] Buat project (teamId)" -ForegroundColor Cyan
$project = Call POST "/projects" @{ name = "Project Alpha"; teamId = $team.id }

Write-Host "`n[4] Buat task (projectId)" -ForegroundColor Cyan
$task = Call POST "/tasks" @{ title = "Setup database"; projectId = $project.id }

Write-Host "`n[5] Assign task (memberIds = array)" -ForegroundColor Cyan
$assign = Call POST "/task-assignments" @{ taskId = $task.id; memberIds = @($member.id) }

Write-Host "`n[6] NEGATIF: assign dobel (harus 409)" -ForegroundColor Yellow
Call POST "/task-assignments" @{ taskId = $task.id; memberIds = @($member.id) } | Out-Null

Write-Host "`n[7] NEGATIF: todo langsung ke done (harus 400)" -ForegroundColor Yellow
Call PATCH "/tasks/$($task.id)/status" @{ status = "done" } | Out-Null

Write-Host "`n[8] NEGATIF: status ngawur (harus 400)" -ForegroundColor Yellow
Call PATCH "/tasks/$($task.id)/status" @{ status = "ngawur" } | Out-Null

Write-Host "`n[9] Alur status: in_progress -> review -> done" -ForegroundColor Cyan
Call PATCH "/tasks/$($task.id)/status" @{ status = "in_progress" } | Out-Null
Call PATCH "/tasks/$($task.id)/status" @{ status = "review" } | Out-Null
$done = Call PATCH "/tasks/$($task.id)/status" @{ status = "done" }
Write-Host "  completedAt = $($done.completedAt)  (harus terisi)"

Write-Host "`n[10] NEGATIF: assign ke task yang sudah done (harus 400)" -ForegroundColor Yellow
Call POST "/task-assignments" @{ taskId = $task.id; memberIds = @($member.id) } | Out-Null

Write-Host "`n[11] NEGATIF: id tidak ada (harus 404)" -ForegroundColor Yellow
Call GET "/tasks/00000000-0000-4000-8000-000000000000" | Out-Null

Write-Host "`n[12] NEGATIF: id bukan UUID (harus 400)" -ForegroundColor Yellow
Call GET "/tasks/bukan-uuid" | Out-Null

Write-Host "`n[13] NEGATIF: field tidak dikenal (harus 400)" -ForegroundColor Yellow
Call POST "/teams" @{ name = "X$run"; foo = "bar" } | Out-Null

Write-Host "`n[14] NEGATIF: hapus team yang masih punya project (harus ditolak)" -ForegroundColor Yellow
Call DELETE "/teams/$($team.id)" | Out-Null

Write-Host "`n[15] CASCADE: hapus project, lalu task-nya harus 404" -ForegroundColor Yellow
Call DELETE "/projects/$($project.id)" | Out-Null
Call GET "/tasks/$($task.id)" | Out-Null