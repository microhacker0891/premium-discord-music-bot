// Popup script for StarkGlass settings
document.addEventListener('DOMContentLoaded', async () => {
  const providerSelect = document.getElementById('provider')
  const saveButton = document.getElementById('save-settings')
  const statusDiv = document.getElementById('status')

  // Show/hide provider-specific configs
  function showProviderConfig(provider) {
    // Hide all configs
    document.querySelectorAll('.provider-config').forEach(config => {
      config.classList.add('hidden')
    })
    
    // Show selected config
    const selectedConfig = document.getElementById(`${provider}-config`)
    if (selectedConfig) {
      selectedConfig.classList.remove('hidden')
    }
  }

  // Load saved settings
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['settings'])
      const settings = result.settings || {}
      
      // Set provider
      if (settings.dataSource?.provider) {
        providerSelect.value = settings.dataSource.provider
        showProviderConfig(settings.dataSource.provider)
      }
      
      // Set API keys
      if (settings.dataSource?.apiKey) {
        const apiKeyInput = document.getElementById(`${settings.dataSource.provider}-api-key`)
        if (apiKeyInput) {
          apiKeyInput.value = settings.dataSource.apiKey
        }
      }
      
      if (settings.dataSource?.accessToken) {
        const accessTokenInput = document.getElementById(`${settings.dataSource.provider}-access-token`)
        if (accessTokenInput) {
          accessTokenInput.value = settings.dataSource.accessToken
        }
      }
      
      // Set other settings
      if (settings.risk?.atrMultiplier) {
        document.getElementById('atr-multiplier').value = settings.risk.atrMultiplier
      }
      
      if (settings.risk?.maxRiskPercent) {
        document.getElementById('max-risk').value = settings.risk.maxRiskPercent
      }
      
      if (settings.alerts?.confluenceThreshold) {
        document.getElementById('confluence-threshold').value = settings.alerts.confluenceThreshold
      }
      
    } catch (error) {
      console.error('Error loading settings:', error)
      showStatus('Error loading settings', 'error')
    }
  }

  // Save settings
  async function saveSettings() {
    try {
      const provider = providerSelect.value
      const apiKeyInput = document.getElementById(`${provider}-api-key`)
      const accessTokenInput = document.getElementById(`${provider}-access-token`)
      
      const settings = {
        dataSource: {
          provider,
          apiKey: apiKeyInput?.value || '',
          accessToken: accessTokenInput?.value || ''
        },
        risk: {
          atrMultiplier: parseFloat(document.getElementById('atr-multiplier').value),
          maxRiskPercent: parseFloat(document.getElementById('max-risk').value)
        },
        alerts: {
          enabled: true,
          confluenceThreshold: parseInt(document.getElementById('confluence-threshold').value)
        }
      }
      
      await chrome.storage.local.set({ settings })
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        payload: settings
      })
      
      showStatus('Settings saved successfully!', 'success')
      
    } catch (error) {
      console.error('Error saving settings:', error)
      showStatus('Error saving settings', 'error')
    }
  }

  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message
    statusDiv.className = `status ${type}`
    statusDiv.classList.remove('hidden')
    
    setTimeout(() => {
      statusDiv.classList.add('hidden')
    }, 3000)
  }

  // Event listeners
  providerSelect.addEventListener('change', (e) => {
    showProviderConfig(e.target.value)
  })

  saveButton.addEventListener('click', saveSettings)

  // Load settings on startup
  await loadSettings()
})
