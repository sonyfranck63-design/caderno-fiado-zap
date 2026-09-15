.class Lnet/mikespub/mywebview/MyAppWebViewClient$1;
.super Landroid/content/BroadcastReceiver;
.source "MyAppWebViewClient.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lnet/mikespub/mywebview/MyAppWebViewClient;->setReceiver()V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;


# direct methods
.method constructor <init>(Lnet/mikespub/mywebview/MyAppWebViewClient;)V
    .locals 0

    .line 75
    iput-object p1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    invoke-direct {p0}, Landroid/content/BroadcastReceiver;-><init>()V

    return-void
.end method


# virtual methods
.method public onReceive(Landroid/content/Context;Landroid/content/Intent;)V
    .locals 3

    .line 79
    const-string p1, "extra_download_id"

    const-wide/16 v0, -0x1

    invoke-virtual {p2, p1, v0, v1}, Landroid/content/Intent;->getLongExtra(Ljava/lang/String;J)J

    move-result-wide p1

    cmp-long v0, p1, v0

    if-lez v0, :cond_3

    .line 81
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-wide v0, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mDownloadId:J

    cmp-long p1, v0, p1

    if-nez p1, :cond_3

    iget-object p1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object p1, p1, Lnet/mikespub/mywebview/MyAppWebViewClient;->mDownloadManager:Landroid/app/DownloadManager;

    if-nez p1, :cond_0

    goto :goto_0

    .line 84
    :cond_0
    new-instance p1, Ljava/lang/StringBuilder;

    const-string p2, "Receive: "

    invoke-direct {p1, p2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    iget-object p2, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-wide v0, p2, Lnet/mikespub/mywebview/MyAppWebViewClient;->mDownloadId:J

    invoke-virtual {p1, v0, v1}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    const-string p2, "Web Update"

    invoke-static {p2, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 87
    iget-object p1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object p1, p1, Lnet/mikespub/mywebview/MyAppWebViewClient;->mDownloadManager:Landroid/app/DownloadManager;

    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-wide v0, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mDownloadId:J

    invoke-virtual {p1, v0, v1}, Landroid/app/DownloadManager;->getUriForDownloadedFile(J)Landroid/net/Uri;

    move-result-object p1

    .line 89
    new-instance v0, Ljava/lang/StringBuilder;

    const-string v1, "Uri: "

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {p2, v0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    if-nez p1, :cond_1

    return-void

    .line 95
    :cond_1
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-boolean v0, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mDownloadExtract:Z

    if-nez v0, :cond_2

    return-void

    .line 101
    :cond_2
    :try_start_0
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object v0, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    invoke-virtual {v0}, Lnet/mikespub/mywebview/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v0

    invoke-virtual {v0, p1}, Landroid/content/ContentResolver;->openInputStream(Landroid/net/Uri;)Ljava/io/InputStream;

    move-result-object p1

    .line 102
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient$1;->this$0:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    sget-object v0, Landroid/os/Environment;->DIRECTORY_DOCUMENTS:Ljava/lang/String;

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MainActivity;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object p0

    const/4 v0, 0x1

    .line 103
    new-array v0, v0, [Ljava/lang/String;

    const-string v1, "settings.json"

    const/4 v2, 0x0

    aput-object v1, v0, v2

    .line 104
    invoke-static {p1, p0, v0}, Lnet/mikespub/myutils/MyAssetUtility;->unzipStream(Ljava/io/InputStream;Ljava/io/File;[Ljava/lang/String;)V

    if-eqz p1, :cond_3

    .line 106
    invoke-virtual {p1}, Ljava/io/InputStream;->close()V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    move-exception p0

    .line 110
    invoke-virtual {p0}, Ljava/lang/Exception;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p2, p0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    :cond_3
    :goto_0
    return-void
.end method
