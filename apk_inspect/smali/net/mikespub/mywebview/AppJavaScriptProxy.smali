.class Lnet/mikespub/mywebview/AppJavaScriptProxy;
.super Ljava/lang/Object;
.source "AppJavaScriptProxy.java"


# instance fields
.field private final activity:Landroidx/appcompat/app/AppCompatActivity;

.field private final webView:Landroid/webkit/WebView;


# direct methods
.method constructor <init>(Landroidx/appcompat/app/AppCompatActivity;Landroid/webkit/WebView;)V
    .locals 0

    .line 24
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 26
    iput-object p1, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    .line 27
    iput-object p2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->webView:Landroid/webkit/WebView;

    return-void
.end method


# virtual methods
.method public showMessage(Ljava/lang/String;)V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 36
    iget-object v0, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    .line 37
    iget-object v1, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->webView:Landroid/webkit/WebView;

    .line 40
    new-instance v2, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;

    invoke-direct {v2, p0, v1, v0, p1}, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;-><init>(Lnet/mikespub/mywebview/AppJavaScriptProxy;Landroid/webkit/WebView;Landroidx/appcompat/app/AppCompatActivity;Ljava/lang/String;)V

    invoke-virtual {v0, v2}, Landroidx/appcompat/app/AppCompatActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    return-void
.end method
