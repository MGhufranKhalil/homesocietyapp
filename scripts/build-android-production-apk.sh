#!/bin/bash

source scripts/version
export NODE_ENV="production"
export API_URL="https://sumairas33.homesociety.pk/api/"
export API_DOMAIN="https://sumairas33.homesociety.pk"
export ONESIGNAL_ID="7c26ba7f-5519-4e1e-bcd0-379cc11694d6"

export ANDROID_SDK="/www/android-sdk"
export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk1.8.0_131.jdk/Contents/Home"
export PATH="/Library/Java/JavaVirtualMachines/jdk1.8.0_131.jdk/Contents/Home:$PATH"

#echo
#echo "*** Is the file patched for SSL certificate verification issue?***"
#echo
#read -p "cordova/platforms/android/CordovaLib/src/org/apache/cordova/engine/SystemWebViewClient.java"

npm run build-prod-cordova-android-apk
