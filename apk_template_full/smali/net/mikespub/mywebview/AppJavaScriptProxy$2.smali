.class Lnet/mikespub/mywebview/AppJavaScriptProxy$2;
.super Ljava/lang/Object;
.source "AppJavaScriptProxy.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lnet/mikespub/mywebview/AppJavaScriptProxy;->showToast(Ljava/lang/String;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lnet/mikespub/mywebview/AppJavaScriptProxy;

.field final synthetic val$message:Ljava/lang/String;

.field final synthetic val$myActivity:Landroidx/appcompat/app/AppCompatActivity;


# direct methods
.method constructor <init>(Lnet/mikespub/mywebview/AppJavaScriptProxy;Landroidx/appcompat/app/AppCompatActivity;Ljava/lang/String;)V
    .locals 0

    iput-object p1, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$2;->this$0:Lnet/mikespub/mywebview/AppJavaScriptProxy;

    iput-object p2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$2;->val$myActivity:Landroidx/appcompat/app/AppCompatActivity;

    iput-object p3, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$2;->val$message:Ljava/lang/String;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    iget-object v0, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$2;->val$myActivity:Landroidx/appcompat/app/AppCompatActivity;

    invoke-virtual {v0}, Landroidx/appcompat/app/AppCompatActivity;->getApplicationContext()Landroid/content/Context;

    move-result-object v0

    iget-object v1, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy$2;->val$message:Ljava/lang/String;

    const/4 v2, 0x1

    invoke-static {v0, v1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v0

    invoke-virtual {v0}, Landroid/widget/Toast;->show()V

    return-void
.end method
