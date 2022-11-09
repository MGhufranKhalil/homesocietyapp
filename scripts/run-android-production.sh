#!/bin/bash

source scripts/version
export NODE_ENV="production"
#export API_URL="http://10.0.2.2:8000/api/"
#export API_DOMAIN="http://10.0.2.2:8000"

export API_URL="https://sumairas33.homesociety.pk/api/"
export API_DOMAIN="https://sumairas33.homesociety.pk"
export ONESIGNAL_ID="7c26ba7f-5519-4e1e-bcd0-379cc11694d6"

export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_131.jdk/Contents/Home
npm run run-android
npm run adb