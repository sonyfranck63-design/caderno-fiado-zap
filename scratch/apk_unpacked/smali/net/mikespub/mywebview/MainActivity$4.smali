.class Lnet/mikespub/mywebview/MainActivity$4;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Landroidx/activity/result/ActivityResultCallback;


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lnet/mikespub/mywebview/MainActivity;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation

.annotation system Ldalvik/annotation/Signature;
    value = {
        "Ljava/lang/Object;",
        "Landroidx/activity/result/ActivityResultCallback<",
        "Landroidx/activity/result/ActivityResult;",
        ">;"
    }
.end annotation


# instance fields
.field final synthetic this$0:Lnet/mikespub/mywebview/MainActivity;


# direct methods
.method constructor <init>(Lnet/mikespub/mywebview/MainActivity;)V
    .locals 0

    .line 102
    iput-object p1, p0, Lnet/mikespub/mywebview/MainActivity$4;->this$0:Lnet/mikespub/mywebview/MainActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public onActivityResult(Landroidx/activity/result/ActivityResult;)V
    .locals 3

    .line 113
    invoke-virtual {p1}, Landroidx/activity/result/ActivityResult;->getResultCode()I

    move-result v0

    .line 114
    invoke-virtual {p1}, Landroidx/activity/result/ActivityResult;->getData()Landroid/content/Intent;

    move-result-object p1

    .line 116
    iget-object v1, p0, Lnet/mikespub/mywebview/MainActivity$4;->this$0:Lnet/mikespub/mywebview/MainActivity;

    const/4 v2, 0x1

    invoke-static {v1, v2, v0, p1}, Lnet/mikespub/mywebview/MainActivity;->-$$Nest$mgetActivityResultUri(Lnet/mikespub/mywebview/MainActivity;IILandroid/content/Intent;)Landroid/net/Uri;

    move-result-object p1

    if-nez p1, :cond_0

    return-void

    .line 120
    :cond_0
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity$4;->this$0:Lnet/mikespub/mywebview/MainActivity;

    invoke-static {v0, p1}, Lnet/mikespub/mywebview/MainActivity;->-$$Nest$mshowContentUri(Lnet/mikespub/mywebview/MainActivity;Landroid/net/Uri;)Z

    move-result v0

    if-nez v0, :cond_1

    return-void

    .line 124
    :cond_1
    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity$4;->this$0:Lnet/mikespub/mywebview/MainActivity;

    invoke-static {p0, p1}, Lnet/mikespub/mywebview/MainActivity;->-$$Nest$mreadReturnUri(Lnet/mikespub/mywebview/MainActivity;Landroid/net/Uri;)V

    return-void
.end method

.method public bridge synthetic onActivityResult(Ljava/lang/Object;)V
    .locals 0

    .line 102
    check-cast p1, Landroidx/activity/result/ActivityResult;

    invoke-virtual {p0, p1}, Lnet/mikespub/mywebview/MainActivity$4;->onActivityResult(Landroidx/activity/result/ActivityResult;)V

    return-void
.end method
