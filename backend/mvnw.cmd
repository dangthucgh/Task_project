@ECHO OFF
SETLOCAL
SET "MAVEN_VERSION=3.9.9"
SET "M2_WRAPPER_DIR=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%"
SET "MVN_BIN=%M2_WRAPPER_DIR%\apache-maven-%MAVEN_VERSION%\bin\mvn.cmd"

IF NOT EXIST "%MVN_BIN%" (
    ECHO Downloading Apache Maven %MAVEN_VERSION%...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; New-Item -ItemType Directory -Force -Path '%M2_WRAPPER_DIR%' | Out-Null; $zip='%M2_WRAPPER_DIR%\maven.zip'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile $zip -UseBasicParsing; Expand-Archive -Path $zip -DestinationPath '%M2_WRAPPER_DIR%' -Force; Remove-Item $zip -Force"
)

CALL "%MVN_BIN%" %*
EXIT /B %ERRORLEVEL%
