# One-shot setup for the dedicated SSH identity of the Emifree2026/elementor repo.
#
#   powershell -ExecutionPolicy Bypass -File setup-elementor-ssh.ps1
#
# What it does:
#   1. generates ~/.ssh/id_ed25519_elementor (ed25519, no passphrase)
#   2. writes the "github-emifree-elementor" host alias into ~/.ssh/config
#   3. adds the alias entries to ~/.ssh/known_hosts (so the first push does not
#      stop on an interactive host-key prompt)
#   4. repoints the elementor repo's origin at that alias
#   5. copies the public key to the clipboard, ready to paste into
#      GitHub > Settings > Deploy keys > Add deploy key ("Allow write access")
#
# Idempotent: re-running never regenerates an existing key and never duplicates
# the ssh config or known_hosts entries.

$ErrorActionPreference = 'Stop'

$home       = $env:USERPROFILE
$sshDir     = Join-Path $home '.ssh'
$keyPath    = Join-Path $sshDir 'id_ed25519_elementor'
$pubPath    = "$keyPath.pub"
$configPath = Join-Path $sshDir 'config'
$knownPath  = Join-Path $sshDir 'known_hosts'
$alias      = 'github-emifree-elementor'
$repo       = 'C:\Users\vpedr\Projects\emifree-elementor'
$comment    = 'vpedr@emifree-elementor'

# --- 1. key -----------------------------------------------------------------
if (Test-Path $keyPath) {
    Write-Output "[1/5] key already exists, keeping it: $keyPath"
} else {
    Write-Output "[1/5] generating ed25519 key..."
    # -N '' is an empty passphrase. It must not be the LAST argument or PowerShell
    # can drop it, so -q is passed after it.
    & ssh-keygen @('-t', 'ed25519', '-C', $comment, '-f', $keyPath, '-N', '', '-q')
    if ($LASTEXITCODE -ne 0) { throw "ssh-keygen failed with exit code $LASTEXITCODE" }
    Write-Output "      created $keyPath"
}

# --- 2. ssh config ---------------------------------------------------------
$block = @"
Host $alias
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_elementor
    IdentitiesOnly yes
"@

if (-not (Test-Path $configPath)) {
    Set-Content -Path $configPath -Value $block -Encoding ascii
    Write-Output "[2/5] created $configPath"
} elseif ((Get-Content $configPath -Raw) -match [regex]::Escape("Host $alias")) {
    Write-Output "[2/5] host alias already present in $configPath"
} else {
    Add-Content -Path $configPath -Value $block -Encoding ascii
    Write-Output "[2/5] appended host alias to $configPath"
}

# --- 3. known_hosts --------------------------------------------------------
# The alias is a different hostname to SSH, so the host key has to be trusted
# under the alias name too or the first connection prompts interactively.
if (Test-Path $knownPath) {
    $known = Get-Content $knownPath
    $added = $false
    foreach ($line in $known) {
        if ($line -match '^github\.com (\S+ \S+)') {
            $entry = "$alias $($Matches[1])"
            if ($known -notcontains $entry) {
                Add-Content -Path $knownPath -Value $entry -Encoding ascii
                $added = $true
            }
        }
    }
    Write-Output "[3/5] known_hosts: alias entries $(if ($added) { 'added' } else { 'already present' })"
} else {
    Write-Output "[3/5] known_hosts: no file yet, ssh will prompt on first connect"
}

# --- 4. remote -------------------------------------------------------------
git -C $repo remote set-url origin "git@${alias}:Emifree2026/elementor.git"
Write-Output "[4/5] origin -> $(git -C $repo remote get-url origin)"

# --- 5. public key to clipboard ---------------------------------------------
$pub = (Get-Content $pubPath -Raw).Trim()
if ($pub -notmatch '^ssh-ed25519 [A-Za-z0-9+/]+=* ') {
    throw "public key does not look like OpenSSH format: $pub"
}
Set-Clipboard -Value $pub

Write-Output '[5/5] public key copied to the clipboard'
Write-Output ''
Write-Output '===== PASTE THIS INTO GITHUB (Deploy keys > Add deploy key) ====='
Write-Output $pub
Write-Output '==============================================================='
Write-Output ''
Write-Output "Add it to: https://github.com/Emifree2026/elementor/settings/keys/new"
Write-Output 'Tick "Allow write access". Then run:'
Write-Output "  git -C `"$repo`" push -u origin main"
