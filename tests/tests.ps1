
Invoke-RestMethod 'http://localhost:3333/instance/init?key=123' -Method 'GET'
Invoke-RestMethod 'http://localhost:3333/init/text?key=bot' -Method 'POST' -Headers @{"id"="+5518996206006"; "message"="test"} -Body $body