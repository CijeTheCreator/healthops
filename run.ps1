$HOST_IP = (
  (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue).IPAddress ??
  (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet" -ErrorAction SilentlyContinue).IPAddress ??
  "127.0.0.1"
)

Write-Host "Starting HealthOps with HOST_IP=$HOST_IP"

docker run -it `
  -p 3000:3000 `
  -p 3005:3005 `
  -e HOST_IP="$HOST_IP" `
  legends22/healthops
