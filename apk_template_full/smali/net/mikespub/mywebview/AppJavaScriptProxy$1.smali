.class Lnet/mikespub/mywebview/AppJavaScriptProxy$1;
.super Ljava/lang/Object;
.source "AppJavaScriptProxy.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lnet/mikespub/mywebview/AppJavaScriptProxy;->showMessage(Ljava/lang/String;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lnet/mikespub/mywebview/AppJavaScriptProxy;

.field final synthetic val$message:Ljava/lang/String;

.field final synthetic val$myActivity:Landroidx/appcompat/app/AppCompatActivity;

.field final synthetic val$myWebView:Landroid/webkit/WebView;


# direct methods
.method constructor <init>(Lnet/mikespub/mywebview/AppJavaScriptProxy;Landroid/webkit/WebView;Landroidx/appcompat/app/AppCompatActivity;Ljava/lang/String;)V
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 40
    iput-object p1, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;->this$0:Lnet/mikespub/mywebview/AppJavaScriptProxy;

    iput-object p2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;->val$myWebView:Landroid/webkit/WebView;

    iput-object p3, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;->val$myActivity:Landroidx/appcompat/app/AppCompatActivity;

    iput-object p4, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;->val$message:Ljava/lang/String;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 4

    .line 44
    iget-object v0, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;->val$myWebView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->getUrl()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v0

    .line 45
    invoke-virtual {v0}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v1

    iget-object v2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;->val$myActivity:Landroidx/appcompat/app/AppCompatActivity;

    const v3, 0x7f0e001c

    invoke-virtual {v2, v3}, Landroidx/appcompat/app/AppCompatActivity;->getString(I)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-nez v1, :cond_0

    .line 46
    new-instance p0, Ljava/lang/StringBuilder;

    const-string v1, "No Javascript Interface for "

    invoke-direct {p0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    const-string v0, "WebView"

    invoke-static {v0, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-void

    .line 50
    :cond_0
    iget-object v0, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;->val$myActivity:Landroidx/appcompat/app/AppCompatActivity;

    .line 51
    invoke-virtual {v0}, Landroidx/appcompat/app/AppCompatActivity;->getApplicationContext()Landroid/content/Context;

    move-result-object v0

    iget-object p0, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$1;->val$message:Ljava/lang/String;

    const/4 v1, 0x0

    .line 50
    invoke-static {v0, p0, v1}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p0

    .line 55
    invoke-virtual {p0}, Landroid/widget/Toast;->show()V

    return-void
.end method
