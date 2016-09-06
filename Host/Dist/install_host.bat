REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.nicologies.difftool" /ve /t REG_SZ /d "%~dp0com.nicologies.difftool.json" /f
REG ADD "HKCU\Software\Mozilla\NativeMessagingHosts\com.nicologies.difftool" /ve /t REG_SZ /d "%~dp0com.nicologies.difftool.json" /f
