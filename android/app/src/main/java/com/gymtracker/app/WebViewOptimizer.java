package com.gymtracker.app;

import android.webkit.WebSettings;
import android.webkit.WebView;
import android.os.Build;


public class WebViewOptimizer {
    
    public static void optimizeWebView(WebView webView) {
        WebSettings settings = webView.getSettings();
        
        // Enable hardware acceleration
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        
        // Optimize JavaScript performance
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        
        // Enable DOM storage for PWA support
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        
        // Optimize caching strategy
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Optimize rendering performance
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        }
        
        // Optimize media playback
        settings.setMediaPlaybackRequiresUserGesture(false);
        
        // Enable safe browsing
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }
        
        // Optimize text rendering
        settings.setTextZoom(100);
        settings.setDefaultTextEncodingName("UTF-8");
        
        // Enable zoom controls but hide zoom buttons
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(true);
        
        // Optimize loading
        settings.setLoadsImagesAutomatically(true);
        settings.setBlockNetworkImage(false);
        settings.setBlockNetworkLoads(false);
        
        // Enable mixed content for HTTPS PWAs
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        
        // Optimize user agent for better compatibility
        String userAgent = settings.getUserAgentString();
        settings.setUserAgentString(userAgent + " SportTrackerApp/1.0");
        
        // Enable geolocation (if needed for fitness tracking)
        settings.setGeolocationEnabled(true);
        
        // Optimize viewport
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        
        // Enable focus handling
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        
        // Optimize scrolling performance
        webView.setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);
        webView.setScrollbarFadingEnabled(true);
        
        // Enable debugging in debug builds only
        // Note: WebView debugging is enabled by default in debug builds
        WebView.setWebContentsDebuggingEnabled(true);
    }
}