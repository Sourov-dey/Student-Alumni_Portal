$ErrorActionPreference = 'Stop'
$base='http://localhost:8080/api'

Write-Host 'Creating student...'
$student = Invoke-RestMethod -Method Post -Uri "$base/auth/dev-login" -Body (@{email='student3@example.com'; role='student'; name='Stu3'} | ConvertTo-Json) -ContentType 'application/json'
$studentToken = $student.token
Write-Host "student id: $($student.user._id) token len: $($studentToken.Length)"

Write-Host 'Creating alumni...'
$alumni = Invoke-RestMethod -Method Post -Uri "$base/auth/dev-login" -Body (@{email='alumni3@example.com'; role='alumni'; name='Alu3'} | ConvertTo-Json) -ContentType 'application/json'
$alumniToken = $alumni.token
Write-Host "alumni id: $($alumni.user._id) token len: $($alumniToken.Length)"

Write-Host 'Student requests conversation...'
$create = Invoke-RestMethod -Method Post -Uri "$base/conversations" -Headers @{Authorization="Bearer $studentToken"} -Body (@{alumniId=$alumni.user._id} | ConvertTo-Json) -ContentType 'application/json'
Write-Host "Create response:`n"; $create | ConvertTo-Json -Depth 5

Write-Host 'Alumni lists incoming requests...'
$reqs = Invoke-RestMethod -Method Get -Uri "$base/conversations/requests" -Headers @{Authorization="Bearer $alumniToken"}
Write-Host "incoming requests count: $($reqs.Count)"; if ($reqs.Count -gt 0) { Write-Host "first: $($reqs[0]._id)" }

Write-Host 'Alumni accepts conversation...'
$accept = Invoke-RestMethod -Method Patch -Uri "$base/conversations/$($create._id)/accept" -Headers @{Authorization="Bearer $alumniToken"}
Write-Host "accepted conv status: $($accept.status)"

Write-Host 'Student posts a message...'
$post = Invoke-RestMethod -Method Post -Uri "$base/conversations/$($create._id)/messages" -Headers @{Authorization="Bearer $studentToken"} -Body (@{text='Hello alumni'} | ConvertTo-Json) -ContentType 'application/json'
Write-Host "posted message id: $($post._id) body: $($post.body)"

Write-Host 'Listing messages...'
$list = Invoke-RestMethod -Method Get -Uri "$base/conversations/$($create._id)/messages" -Headers @{Authorization="Bearer $studentToken"}
Write-Host "messages count: $($list.items.Count)"
