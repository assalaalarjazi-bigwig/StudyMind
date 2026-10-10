package com.studymind.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "StudyMindApp";
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + ASSET_HOST + "/index.html";

    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;
    private final static int FILE_CHOOSER_RESULT_CODE = 101;
    private WebViewAssetLoader assetLoader;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        // Enable JavaScript execution for React SPA
        settings.setJavaScriptEnabled(true);
        // Enable persistent local storage and IndexedDB for offline document saving
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // File and content access
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        // Viewport and rendering
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Official AndroidX WebViewAssetLoader configuration
        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(ASSET_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    WebResourceResponse response = handleLocalAsset(request.getUrl());
                    if (response != null) {
                        return response;
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @SuppressWarnings("deprecation")
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                if (url != null) {
                    WebResourceResponse response = handleLocalAsset(Uri.parse(url));
                    if (response != null) {
                        return response;
                    }
                }
                return super.shouldInterceptRequest(view, url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && ASSET_HOST.equalsIgnoreCase(uri.getHost())) {
                    return false; // Stay inside WebView for internal app pages
                }
                // External links open in default device browser
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    Log.w(TAG, "Failed to launch external browser for URL: " + uri, e);
                    return false;
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    Log.w(TAG, "WebView error encountered: " + error.getDescription() + " on URL: " + request.getUrl());
                    // Fallback to direct file scheme if assetloader fails
                    String url = request.getUrl().toString();
                    if (url.contains(ASSET_HOST)) {
                        view.loadUrl("file:///android_asset/index.html");
                    }
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            // Forward web console logs to adb logcat for easy debugging
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d(TAG, "[Console] " + consoleMessage.message() + " (" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + ")");
                return true;
            }

            // Android document picker for uploading PDF, DOCX, TXT study files
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                String[] mimetypes = {
                    "application/pdf",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/msword",
                    "text/plain"
                };
                intent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);

                startActivityForResult(Intent.createChooser(intent, "اختر المستند الأكاديمي"), FILE_CHOOSER_RESULT_CODE);
                return true;
            }
        });

        // Load the bundled offline application directly from the APK assets
        Log.i(TAG, "Loading StudyMind app from: " + START_URL);
        webView.loadUrl(START_URL);
    }

    /**
     * Intercepts local requests to appassets.androidplatform.net and serves files directly
     * from android/app/src/main/assets with guaranteed, correct MIME types and UTF-8 encoding.
     */
    private WebResourceResponse handleLocalAsset(Uri uri) {
        if (uri == null) return null;
        String host = uri.getHost();
        if (host == null || !ASSET_HOST.equalsIgnoreCase(host)) {
            return null; // Not our local asset host, let WebView perform standard network request
        }

        String path = uri.getPath();
        if (path == null || path.isEmpty() || path.equals("/")) {
            path = "index.html";
        }
        if (path.startsWith("/")) {
            path = path.substring(1);
        }

        // Try direct asset resolution with guaranteed MIME type
        InputStream stream = null;
        try {
            stream = getAssets().open(path);
        } catch (IOException e1) {
            // If path had an extra prefix like "assets/index.html", try stripping
            if (path.startsWith("assets/")) {
                try {
                    stream = getAssets().open(path.substring("assets/".length()));
                } catch (IOException ignored) {}
            }
            // For SPA navigation paths without extension, serve index.html
            if (stream == null && !path.contains(".")) {
                try {
                    stream = getAssets().open("index.html");
                    path = "index.html";
                } catch (IOException ignored) {}
            }
        }

        if (stream != null) {
            String mimeType = getMimeType(path);
            String encoding = (mimeType.startsWith("text/") || mimeType.contains("javascript") || mimeType.contains("json")) ? "UTF-8" : null;
            Map<String, String> headers = new HashMap<>();
            headers.put("Access-Control-Allow-Origin", "*");
            headers.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mimeType, encoding, 200, "OK", headers, stream);
        }

        // Fallback to AndroidX WebViewAssetLoader if custom resolver didn't find the file
        if (assetLoader != null) {
            return assetLoader.shouldInterceptRequest(uri);
        }

        return null;
    }

    /**
     * Maps file extensions to exact, standard MIME types required by Chromium.
     */
    private static String getMimeType(String path) {
        if (path == null) return "application/octet-stream";
        String lower = path.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        if (lower.endsWith(".otf")) return "font/otf";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (fileUploadCallback == null) return;
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
