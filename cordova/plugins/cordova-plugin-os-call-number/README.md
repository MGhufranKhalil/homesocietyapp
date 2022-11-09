CordovaCallNumberPlugin
=======================

Call a number directly from your cordova application.

Install the plugin using:


``` 
cordova plugin add cordova-plugin-os-call-number --save
```

or if you use Ionic

```
ionic cordova plugin add cordova-plugin-os-call-number
```

Use the plugin in your JS file:
``` javascript
window.plugins.CallNumber.callNumber(onSuccess, onError, number, bypassAppChooser);
window.plugins.CallNumber.dialNumber(onSuccess, onError, number, bypassAppChooser);
```
Or by importing it as a Module
``` javascript
import { CallNumber } from 'cordova-plugin-os-call-number';

CallNumber.callNumber(onSuccess, onError, number, bypassAppChooser);
CallNumber.dialNumber(onSuccess, onError, number, bypassAppChooser);
```

**number:** *String;* phone number to call (e.g. "1234567890")

**bypassAppChooser:** *boolean;* true if you always wish to bypass the app chooser if user has multiple applications installed that can handle calls

Make sure to create onSuccess and onError call back functions.

Example:
``` javascript
function onSuccess(result){
  console.log("Success:"+result);
}

function onError(result) {
  console.log("Error:"+result);
}
```
