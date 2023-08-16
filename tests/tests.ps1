
Invoke-RestMethod 'http://localhost:3333/instance/init?key=123' -Method 'GET'

Invoke-RestMethod 'http://localhost:3333/instance/logout?key=123' -Method 'DELETE'

Invoke-RestMethod 'http://localhost:3333/message/text?key=123' -Method 'POST' -Headers  @{"content-type"="application/json"} -body (@{"id"="551896206006"; "message"="ola2"} | ConvertTo-Json)

Invoke-RestMethod 'http://localhost:3333/instance/qr?key=123' -Method 'GET'
Invoke-RestMethod 'http://localhost:3333/instance/qrbase64?key=123' -Method 'GET'
Invoke-RestMethod 'http://localhost:3333/instance/qrurl?key=123' -Method 'GET'

(Invoke-RestMethod 'http://localhost:3333/instance/list?key=123' -Method 'GET')
(Invoke-RestMethod 'http://localhost:3333/instance/list?key=123' -Method 'GET').data
(Invoke-RestMethod 'http://localhost:3333/instance/qr?key=123' -Method 'GET')
(Invoke-RestMethod 'http://localhost:3333/instance/info?key=123' -Method 'GET')

