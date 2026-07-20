#!/bin/bash
set -e

echo "=== Installing Java and Unzip ==="
export DEBIAN_FRONTEND=noninteractive
dpkg --configure --force-confold --force-confdef -a
apt-get update
if ! command -v unzip &> /dev/null; then
    apt-get install -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y unzip
fi
if ! command -v java &> /dev/null || ! java -version 2>&1 | grep -q "21"; then
    apt-get install -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y openjdk-21-jdk-headless
fi

export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

echo "=== Creating directories ==="
mkdir -p /opt/android-sdk/cmdline-tools

echo "=== Downloading Command Line Tools ==="
if [ ! -f /tmp/cmdline-tools.zip ]; then
    wget -q --show-progress -O /tmp/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
fi

echo "=== Extracting Command Line Tools ==="
rm -rf /opt/android-sdk/cmdline-tools/latest
unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-extracted
mkdir -p /opt/android-sdk/cmdline-tools/latest
mv /tmp/cmdline-tools-extracted/cmdline-tools/* /opt/android-sdk/cmdline-tools/latest/
rm -rf /tmp/cmdline-tools-extracted /tmp/cmdline-tools.zip

echo "=== Licensing and Installing SDK components ==="
export PATH=/opt/android-sdk/cmdline-tools/latest/bin:$PATH

yes | sdkmanager --sdk_root=/opt/android-sdk --licenses

echo "=== Installing packages ==="
# Install platforms and build-tools
sdkmanager --sdk_root=/opt/android-sdk "platform-tools" "platforms;android-35" "build-tools;35.0.0"

echo "=== Writing local.properties ==="
mkdir -p /app/applet/android
echo "sdk.dir=/opt/android-sdk" > /app/applet/android/local.properties

echo "=== SDK Installation Complete ==="
