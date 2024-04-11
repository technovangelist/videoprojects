param (
    [string]$prompt = $args -join ' '
)

# Define the API URL
$apiUrl = "http://localhost:11434/api/embeddings"

# Prepare the payload
$body = @{
    model = "nomic-embed-text"
    prompt = $prompt
} | ConvertTo-Json

# Send the request
$response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"

# Extract the embedding and copy to clipboard
$response.embedding | Set-Clipboard

# Output a custom message
Write-Host "Embedding added to clipboard."
