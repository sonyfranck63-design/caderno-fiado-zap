.class Lnet/mikespub/mywebview/MainActivity$5;
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
        "Landroid/net/Uri;",
        ">;"
    }
.end annotation


# instance fields
.field final synthetic this$0:Lnet/mikespub/mywebview/MainActivity;


# direct methods
.method constructor <init>(Lnet/mikespub/mywebview/MainActivity;)V
    .locals 0

    .line 130
    iput-object p1, p0, Lnet/mikespub/mywebview/MainActivity$5;->this$0:Lnet/mikespub/mywebview/MainActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public onActivityResult(Landroid/net/Uri;)V
    .locals 1

    .line 134
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity$5;->this$0:Lnet/mikespub/mywebview/MainActivity;

    invoke-static {v0, p1}, Lnet/mikespub/mywebview/MainActivity;->-$$Nest$mshowDocumentUri(Lnet/mikespub/mywebview/MainActivity;Landroid/net/Uri;)Z

    move-result v0

    if-nez v0, :cond_0

    return-void

    .line 138
    :cond_0
    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity$5;->this$0:Lnet/mikespub/mywebview/MainActivity;

    invoke-static {p0, p1}, Lnet/mikespub/mywebview/MainActivity;->-$$Nest$mreadReturnUri(Lnet/mikespub/mywebview/MainActivity;Landroid/net/Uri;)V

    return-void
.end method

.method public bridge synthetic onActivityResult(Ljava/lang/Object;)V
    .locals 0

    .line 130
    check-cast p1, Landroid/net/Uri;

    invoke-virtual {p0, p1}, Lnet/mikespub/mywebview/MainActivity$5;->onActivityResult(Landroid/net/Uri;)V

    return-void
.end method
