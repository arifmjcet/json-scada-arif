Get-service | Where-Object {$_.Name -match "^JSON_SCADA_"} | Select-Object -ExpandProperty Name | foreach { & sc.exe STOP $_  }
Get-service | Where-Object {$_.Name -match "^JSON_SCADA_"} | Select-Object -ExpandProperty Name | foreach { & sc.exe DELETE $_  }