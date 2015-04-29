// This script will be executed in the context of a native script module
var window = window || {};
var isNativeScriptApplication = ((typeof android !== 'undefined' && android && android.widget && android.widget.Button)
    || (typeof UIButton !== 'undefined' && UIButton));
