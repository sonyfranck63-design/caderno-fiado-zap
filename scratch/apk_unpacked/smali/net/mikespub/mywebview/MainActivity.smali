.class public Lnet/mikespub/mywebview/MainActivity;
.super Landroidx/appcompat/app/AppCompatActivity;
.source "MainActivity.java"


# static fields
.field private static final TAG:Ljava/lang/String; = "MainActivity"


# instance fields
.field final mCreateDocument:Landroidx/activity/result/ActivityResultLauncher;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Landroidx/activity/result/ActivityResultLauncher<",
            "Ljava/lang/String;",
            ">;"
        }
    .end annotation
.end field

.field final mGetContent:Landroidx/activity/result/ActivityResultLauncher;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Landroidx/activity/result/ActivityResultLauncher<",
            "Ljava/lang/String;",
            ">;"
        }
    .end annotation
.end field

.field final mOpenDocument:Landroidx/activity/result/ActivityResultLauncher;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Landroidx/activity/result/ActivityResultLauncher<",
            "[",
            "Ljava/lang/String;",
            ">;"
        }
    .end annotation
.end field

.field final mOpenDocumentTree:Landroidx/activity/result/ActivityResultLauncher;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Landroidx/activity/result/ActivityResultLauncher<",
            "Landroid/net/Uri;",
            ">;"
        }
    .end annotation
.end field

.field final mPickForResult:Landroidx/activity/result/ActivityResultLauncher;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Landroidx/activity/result/ActivityResultLauncher<",
            "Landroid/content/Intent;",
            ">;"
        }
    .end annotation
.end field

.field protected myWebView:Landroid/webkit/WebView;

.field protected myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

.field onDownloadComplete:Landroid/content/BroadcastReceiver;


# direct methods
.method static bridge synthetic -$$Nest$mgetActivityResultUri(Lnet/mikespub/mywebview/MainActivity;IILandroid/content/Intent;)Landroid/net/Uri;
    .locals 0

    invoke-direct {p0, p1, p2, p3}, Lnet/mikespub/mywebview/MainActivity;->getActivityResultUri(IILandroid/content/Intent;)Landroid/net/Uri;

    move-result-object p0

    return-object p0
.end method

.method static bridge synthetic -$$Nest$mreadReturnUri(Lnet/mikespub/mywebview/MainActivity;Landroid/net/Uri;)V
    .locals 0

    invoke-direct {p0, p1}, Lnet/mikespub/mywebview/MainActivity;->readReturnUri(Landroid/net/Uri;)V

    return-void
.end method

.method static bridge synthetic -$$Nest$mshowContentUri(Lnet/mikespub/mywebview/MainActivity;Landroid/net/Uri;)Z
    .locals 0

    invoke-direct {p0, p1}, Lnet/mikespub/mywebview/MainActivity;->showContentUri(Landroid/net/Uri;)Z

    move-result p0

    return p0
.end method

.method static bridge synthetic -$$Nest$mshowDocumentTree(Lnet/mikespub/mywebview/MainActivity;Landroid/net/Uri;I)V
    .locals 0

    invoke-direct {p0, p1, p2}, Lnet/mikespub/mywebview/MainActivity;->showDocumentTree(Landroid/net/Uri;I)V

    return-void
.end method

.method static bridge synthetic -$$Nest$mshowDocumentUri(Lnet/mikespub/mywebview/MainActivity;Landroid/net/Uri;)Z
    .locals 0

    invoke-direct {p0, p1}, Lnet/mikespub/mywebview/MainActivity;->showDocumentUri(Landroid/net/Uri;)Z

    move-result p0

    return p0
.end method

.method public constructor <init>()V
    .locals 2

    .line 45
    invoke-direct {p0}, Landroidx/appcompat/app/AppCompatActivity;-><init>()V

    .line 60
    new-instance v0, Landroidx/activity/result/contract/ActivityResultContracts$GetContent;

    invoke-direct {v0}, Landroidx/activity/result/contract/ActivityResultContracts$GetContent;-><init>()V

    new-instance v1, Lnet/mikespub/mywebview/MainActivity$1;

    invoke-direct {v1, p0}, Lnet/mikespub/mywebview/MainActivity$1;-><init>(Lnet/mikespub/mywebview/MainActivity;)V

    invoke-virtual {p0, v0, v1}, Lnet/mikespub/mywebview/MainActivity;->registerForActivityResult(Landroidx/activity/result/contract/ActivityResultContract;Landroidx/activity/result/ActivityResultCallback;)Landroidx/activity/result/ActivityResultLauncher;

    move-result-object v0

    iput-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->mGetContent:Landroidx/activity/result/ActivityResultLauncher;

    .line 74
    new-instance v0, Landroidx/activity/result/contract/ActivityResultContracts$OpenDocument;

    invoke-direct {v0}, Landroidx/activity/result/contract/ActivityResultContracts$OpenDocument;-><init>()V

    new-instance v1, Lnet/mikespub/mywebview/MainActivity$2;

    invoke-direct {v1, p0}, Lnet/mikespub/mywebview/MainActivity$2;-><init>(Lnet/mikespub/mywebview/MainActivity;)V

    invoke-virtual {p0, v0, v1}, Lnet/mikespub/mywebview/MainActivity;->registerForActivityResult(Landroidx/activity/result/contract/ActivityResultContract;Landroidx/activity/result/ActivityResultCallback;)Landroidx/activity/result/ActivityResultLauncher;

    move-result-object v0

    iput-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->mOpenDocument:Landroidx/activity/result/ActivityResultLauncher;

    .line 87
    new-instance v0, Landroidx/activity/result/contract/ActivityResultContracts$OpenDocumentTree;

    invoke-direct {v0}, Landroidx/activity/result/contract/ActivityResultContracts$OpenDocumentTree;-><init>()V

    new-instance v1, Lnet/mikespub/mywebview/MainActivity$3;

    invoke-direct {v1, p0}, Lnet/mikespub/mywebview/MainActivity$3;-><init>(Lnet/mikespub/mywebview/MainActivity;)V

    invoke-virtual {p0, v0, v1}, Lnet/mikespub/mywebview/MainActivity;->registerForActivityResult(Landroidx/activity/result/contract/ActivityResultContract;Landroidx/activity/result/ActivityResultCallback;)Landroidx/activity/result/ActivityResultLauncher;

    move-result-object v0

    iput-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->mOpenDocumentTree:Landroidx/activity/result/ActivityResultLauncher;

    .line 101
    new-instance v0, Landroidx/activity/result/contract/ActivityResultContracts$StartActivityForResult;

    invoke-direct {v0}, Landroidx/activity/result/contract/ActivityResultContracts$StartActivityForResult;-><init>()V

    new-instance v1, Lnet/mikespub/mywebview/MainActivity$4;

    invoke-direct {v1, p0}, Lnet/mikespub/mywebview/MainActivity$4;-><init>(Lnet/mikespub/mywebview/MainActivity;)V

    invoke-virtual {p0, v0, v1}, Lnet/mikespub/mywebview/MainActivity;->registerForActivityResult(Landroidx/activity/result/contract/ActivityResultContract;Landroidx/activity/result/ActivityResultCallback;)Landroidx/activity/result/ActivityResultLauncher;

    move-result-object v0

    iput-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->mPickForResult:Landroidx/activity/result/ActivityResultLauncher;

    .line 129
    new-instance v0, Landroidx/activity/result/contract/ActivityResultContracts$CreateDocument;

    invoke-direct {v0}, Landroidx/activity/result/contract/ActivityResultContracts$CreateDocument;-><init>()V

    new-instance v1, Lnet/mikespub/mywebview/MainActivity$5;

    invoke-direct {v1, p0}, Lnet/mikespub/mywebview/MainActivity$5;-><init>(Lnet/mikespub/mywebview/MainActivity;)V

    invoke-virtual {p0, v0, v1}, Lnet/mikespub/mywebview/MainActivity;->registerForActivityResult(Landroidx/activity/result/contract/ActivityResultContract;Landroidx/activity/result/ActivityResultCallback;)Landroidx/activity/result/ActivityResultLauncher;

    move-result-object v0

    iput-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->mCreateDocument:Landroidx/activity/result/ActivityResultLauncher;

    return-void
.end method

.method private checkActivityResult(IILandroid/content/Intent;)Z
    .locals 5

    const/4 p0, -0x1

    const/4 v0, 0x0

    .line 465
    const-string v1, " Result: "

    const-string v2, "Request: "

    const-string v3, "Activity Result"

    if-eq p2, p0, :cond_1

    .line 467
    const-string p0, " Not OK: "

    if-eqz p3, :cond_0

    .line 468
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v4, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {v3, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 470
    :cond_0
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v4, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {v3, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    :goto_0
    return v0

    :cond_1
    if-nez p3, :cond_2

    .line 475
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string p1, " Intent: "

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {v3, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return v0

    :cond_2
    const/4 p0, 0x1

    return p0
.end method

.method private getActivityResultUri(IILandroid/content/Intent;)Landroid/net/Uri;
    .locals 9

    .line 440
    invoke-direct {p0, p1, p2, p3}, Lnet/mikespub/mywebview/MainActivity;->checkActivityResult(IILandroid/content/Intent;)Z

    move-result p0

    const/4 v0, 0x0

    if-nez p0, :cond_0

    return-object v0

    .line 444
    :cond_0
    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p0

    .line 445
    invoke-virtual {p3}, Landroid/content/Intent;->getExtras()Landroid/os/Bundle;

    move-result-object v1

    .line 446
    const-string v2, " Extras: "

    const-string v3, " Intent: "

    const-string v4, " Result: "

    const-string v5, "Request: "

    const-string v6, "Activity Result"

    if-nez p0, :cond_2

    const/4 p0, 0x0

    .line 448
    const-string v7, " No Uri: "

    if-eqz v1, :cond_1

    .line 449
    new-instance v8, Ljava/lang/StringBuilder;

    invoke-direct {v8, v5}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v8, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p3, p0}, Landroid/content/Intent;->toUri(I)Ljava/lang/String;

    move-result-object p0

    invoke-virtual {p1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {v6, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 451
    :cond_1
    new-instance v8, Ljava/lang/StringBuilder;

    invoke-direct {v8, v5}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v8, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p3, p0}, Landroid/content/Intent;->toUri(I)Ljava/lang/String;

    move-result-object p0

    invoke-virtual {p1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {v6, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    :goto_0
    return-object v0

    .line 455
    :cond_2
    const-string v0, " Uri: "

    if-eqz v1, :cond_3

    .line 456
    new-instance v7, Ljava/lang/StringBuilder;

    invoke-direct {v7, v5}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v7, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {v6, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_1

    .line 458
    :cond_3
    new-instance v7, Ljava/lang/StringBuilder;

    invoke-direct {v7, v5}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v7, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {v6, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    :goto_1
    return-object p0
.end method

.method private readReturnUri(Landroid/net/Uri;)V
    .locals 2

    .line 553
    const-string v0, "MainActivity"

    :try_start_0
    invoke-virtual {p0}, Lnet/mikespub/mywebview/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object p0

    const-string v1, "r"

    invoke-virtual {p0, p1, v1}, Landroid/content/ContentResolver;->openFileDescriptor(Landroid/net/Uri;Ljava/lang/String;)Landroid/os/ParcelFileDescriptor;

    move-result-object p0
    :try_end_0
    .catch Ljava/io/FileNotFoundException; {:try_start_0 .. :try_end_0} :catch_2

    .line 559
    invoke-virtual {p0}, Landroid/os/ParcelFileDescriptor;->getFileDescriptor()Ljava/io/FileDescriptor;

    move-result-object p1

    .line 561
    :try_start_1
    new-instance v1, Ljava/io/FileInputStream;

    invoke-direct {v1, p1}, Ljava/io/FileInputStream;-><init>(Ljava/io/FileDescriptor;)V

    .line 562
    invoke-virtual {v1}, Ljava/io/FileInputStream;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_0

    goto :goto_0

    :catch_0
    move-exception p1

    .line 564
    const-string v1, "Result File Error"

    invoke-static {v0, v1, p1}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    .line 568
    :goto_0
    :try_start_2
    invoke-virtual {p0}, Landroid/os/ParcelFileDescriptor;->close()V
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_1

    goto :goto_1

    :catch_1
    move-exception p0

    .line 570
    const-string p1, "Result File Close"

    invoke-static {v0, p1, p0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :goto_1
    return-void

    :catch_2
    move-exception p0

    .line 555
    const-string p1, "Result File not found."

    invoke-static {v0, p1, p0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    return-void
.end method

.method private showContentUri(Landroid/net/Uri;)Z
    .locals 3

    const/4 v0, 0x0

    if-nez p1, :cond_0

    return v0

    .line 527
    :cond_0
    invoke-static {p0, p1}, Landroid/provider/DocumentsContract;->isDocumentUri(Landroid/content/Context;Landroid/net/Uri;)Z

    move-result v1

    if-eqz v1, :cond_1

    .line 528
    invoke-direct {p0, p1}, Lnet/mikespub/mywebview/MainActivity;->showDocumentUri(Landroid/net/Uri;)Z

    move-result p0

    return p0

    .line 531
    :cond_1
    :try_start_0
    invoke-static {p0, p1}, Lnet/mikespub/myutils/MyContentUtility;->showContent(Landroidx/appcompat/app/AppCompatActivity;Landroid/net/Uri;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 536
    invoke-virtual {p1}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object p1

    const-string v0, "content://"

    invoke-virtual {v0}, Ljava/lang/String;->length()I

    move-result v0

    invoke-virtual {p1, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    .line 537
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {v0, p0, p1}, Lnet/mikespub/mywebview/MyAppWebViewClient;->loadContent(Landroid/webkit/WebView;Ljava/lang/String;)V

    const/4 p0, 0x1

    return p0

    :catch_0
    move-exception p0

    .line 533
    new-instance v1, Ljava/lang/StringBuilder;

    const-string v2, "Content Error: "

    invoke-direct {v1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    const-string v1, "Activity Result"

    invoke-static {v1, p1, p0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    return v0
.end method

.method private showDocumentTree(Landroid/net/Uri;I)V
    .locals 1

    if-nez p1, :cond_0

    return-void

    .line 496
    :cond_0
    invoke-static {p1}, Lnet/mikespub/myutils/MyDocumentUtility;->checkTreeUri(Landroid/net/Uri;)Z

    move-result v0

    if-eqz v0, :cond_1

    .line 497
    invoke-static {p0, p1, p2}, Lnet/mikespub/myutils/MyDocumentUtility;->savePermissions(Landroidx/appcompat/app/AppCompatActivity;Landroid/net/Uri;I)V

    .line 498
    invoke-static {p0}, Lnet/mikespub/myutils/MyDocumentUtility;->showPermissions(Landroidx/appcompat/app/AppCompatActivity;)V

    .line 499
    invoke-static {p0, p1}, Lnet/mikespub/myutils/MyDocumentUtility;->showTreeFiles(Landroidx/appcompat/app/AppCompatActivity;Landroid/net/Uri;)V

    .line 504
    invoke-virtual {p1}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object p1

    const-string p2, "content://"

    invoke-virtual {p2}, Ljava/lang/String;->length()I

    move-result p2

    invoke-virtual {p1, p2}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    .line 505
    iget-object p2, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {p2, p0, p1}, Lnet/mikespub/mywebview/MyAppWebViewClient;->loadDocument(Landroid/webkit/WebView;Ljava/lang/String;)V

    return-void

    .line 501
    :cond_1
    const-string p0, "Activity Result"

    const-string p1, "Not a tree?"

    invoke-static {p0, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-void
.end method

.method private showDocumentUri(Landroid/net/Uri;)Z
    .locals 3

    const/4 v0, 0x0

    if-nez p1, :cond_0

    return v0

    .line 513
    :cond_0
    :try_start_0
    invoke-static {p0, p1}, Lnet/mikespub/myutils/MyDocumentUtility;->showDocument(Landroidx/appcompat/app/AppCompatActivity;Landroid/net/Uri;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 518
    invoke-virtual {p1}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object p1

    const-string v0, "content://"

    invoke-virtual {v0}, Ljava/lang/String;->length()I

    move-result v0

    invoke-virtual {p1, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    .line 519
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {v0, p0, p1}, Lnet/mikespub/mywebview/MyAppWebViewClient;->loadDocument(Landroid/webkit/WebView;Ljava/lang/String;)V

    const/4 p0, 0x1

    return p0

    :catch_0
    move-exception p0

    .line 515
    new-instance v1, Ljava/lang/StringBuilder;

    const-string v2, "Document Error: "

    invoke-direct {v1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    const-string v1, "Activity Result"

    invoke-static {v1, p1, p0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    return v0
.end method

.method private showUriToast(Landroid/net/Uri;)V
    .locals 1

    .line 484
    invoke-virtual {p1}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object p1

    const/4 v0, 0x1

    .line 482
    invoke-static {p0, p1, v0}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p0

    .line 486
    invoke-virtual {p0}, Landroid/widget/Toast;->show()V

    return-void
.end method


# virtual methods
.method public applyOverrideConfiguration(Landroid/content/res/Configuration;)V
    .locals 0

    .line 354
    invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->applyOverrideConfiguration(Landroid/content/res/Configuration;)V

    return-void
.end method

.method public getSavedStateModel()Lnet/mikespub/mywebview/MySavedStateModel;
    .locals 1

    .line 328
    new-instance v0, Landroidx/lifecycle/ViewModelProvider;

    invoke-direct {v0, p0}, Landroidx/lifecycle/ViewModelProvider;-><init>(Landroidx/lifecycle/ViewModelStoreOwner;)V

    const-class p0, Lnet/mikespub/mywebview/MySavedStateModel;

    invoke-virtual {v0, p0}, Landroidx/lifecycle/ViewModelProvider;->get(Ljava/lang/Class;)Landroidx/lifecycle/ViewModel;

    move-result-object p0

    check-cast p0, Lnet/mikespub/mywebview/MySavedStateModel;

    return-object p0
.end method

.method public onActivityResult_Unused(IILandroid/content/Intent;)V
    .locals 0

    .line 413
    invoke-super {p0, p1, p2, p3}, Landroidx/appcompat/app/AppCompatActivity;->onActivityResult(IILandroid/content/Intent;)V

    .line 415
    invoke-direct {p0, p1, p2, p3}, Lnet/mikespub/mywebview/MainActivity;->getActivityResultUri(IILandroid/content/Intent;)Landroid/net/Uri;

    return-void
.end method

.method public onBackPressed()V
    .locals 1

    .line 338
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z

    move-result v0

    if-eqz v0, :cond_0

    .line 339
    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {p0}, Landroid/webkit/WebView;->goBack()V

    goto :goto_0

    .line 341
    :cond_0
    invoke-super {p0}, Landroidx/appcompat/app/AppCompatActivity;->onBackPressed()V

    :goto_0
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 5

    .line 149
    invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->onCreate(Landroid/os/Bundle;)V

    const v0, 0x7f0c001c

    .line 150
    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MainActivity;->setContentView(I)V

    const v0, 0x7f090042

    .line 157
    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MainActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/webkit/WebView;

    iput-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    .line 159
    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;

    move-result-object v0

    const/4 v1, 0x1

    .line 160
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V

    .line 186
    new-instance v2, Lnet/mikespub/mywebview/MyAppWebViewClient;

    invoke-direct {v2, p0}, Lnet/mikespub/mywebview/MyAppWebViewClient;-><init>(Lnet/mikespub/mywebview/MainActivity;)V

    iput-object v2, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    .line 188
    invoke-virtual {v2}, Lnet/mikespub/mywebview/MyAppWebViewClient;->hasDebuggingEnabled()Ljava/lang/Boolean;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v2

    if-eqz v2, :cond_0

    .line 189
    invoke-static {v1}, Landroid/webkit/WebView;->setWebContentsDebuggingEnabled(Z)V

    .line 193
    :cond_0
    iget-object v2, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    invoke-virtual {v2, v0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->setWebSettings(Landroid/webkit/WebSettings;)V

    .line 194
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    iget-object v2, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    .line 196
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    invoke-virtual {v0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->hasJavascriptInterface()Ljava/lang/Boolean;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0

    if-eqz v0, :cond_1

    .line 197
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    new-instance v2, Lnet/mikespub/mywebview/AppJavaScriptProxy;

    iget-object v3, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-direct {v2, p0, v3}, Lnet/mikespub/mywebview/AppJavaScriptProxy;-><init>(Landroidx/appcompat/app/AppCompatActivity;Landroid/webkit/WebView;)V

    const-string v3, "androidAppProxy"

    invoke-virtual {v0, v2, v3}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    .line 198
    const-string v0, "WebView"

    const-string v2, "Enable Javascript interface"

    invoke-static {v0, v2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 201
    :cond_1
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    invoke-virtual {v0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->hasConsoleLog()Ljava/lang/Boolean;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0

    if-eqz v0, :cond_2

    .line 203
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    new-instance v2, Lnet/mikespub/mywebview/MainActivity$6;

    invoke-direct {v2, p0, p0}, Lnet/mikespub/mywebview/MainActivity$6;-><init>(Lnet/mikespub/mywebview/MainActivity;Lnet/mikespub/mywebview/MainActivity;)V

    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    .line 221
    :cond_2
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    invoke-virtual {v0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->hasContextMenu()Ljava/lang/Boolean;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0

    if-eqz v0, :cond_3

    .line 223
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setLongClickable(Z)V

    .line 225
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    new-instance v2, Lnet/mikespub/mywebview/MainActivity$7;

    invoke-direct {v2, p0}, Lnet/mikespub/mywebview/MainActivity$7;-><init>(Lnet/mikespub/mywebview/MainActivity;)V

    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setOnLongClickListener(Landroid/view/View$OnLongClickListener;)V

    .line 286
    :cond_3
    invoke-virtual {p0}, Lnet/mikespub/mywebview/MainActivity;->getIntent()Landroid/content/Intent;

    move-result-object v0

    if-eqz v0, :cond_4

    .line 289
    invoke-virtual {v0}, Landroid/content/Intent;->getAction()Ljava/lang/String;

    move-result-object v2

    .line 291
    const-string v3, "android.intent.action.VIEW"

    invoke-virtual {v2, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_4

    .line 292
    invoke-virtual {v0}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object v0

    .line 293
    new-instance v3, Ljava/lang/StringBuilder;

    const-string v4, "Action: "

    invoke-direct {v3, v4}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    const-string v3, " - Data: "

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    const-string v3, "Intent"

    invoke-static {v3, v2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    if-eqz v0, :cond_4

    .line 295
    iget-object p1, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-static {v1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v1

    invoke-virtual {p1, p0, v0, v1}, Lnet/mikespub/mywebview/MyAppWebViewClient;->loadAppLink(Landroid/webkit/WebView;Landroid/net/Uri;Ljava/lang/Boolean;)Z

    return-void

    :cond_4
    if-nez p1, :cond_5

    .line 303
    iget-object p1, p0, Lnet/mikespub/mywebview/MainActivity;->myWebViewClient:Lnet/mikespub/mywebview/MyAppWebViewClient;

    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {p1, p0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->loadHomePage(Landroid/webkit/WebView;)V

    :cond_5
    return-void
.end method

.method public onDestroy()V
    .locals 0

    .line 608
    invoke-super {p0}, Landroidx/appcompat/app/AppCompatActivity;->onDestroy()V

    .line 609
    invoke-virtual {p0}, Lnet/mikespub/mywebview/MainActivity;->stopDownloadReceiver()V

    return-void
.end method

.method public onRequestPermissionsResult(I[Ljava/lang/String;[I)V
    .locals 2

    .line 578
    new-instance v0, Ljava/lang/StringBuilder;

    const-string v1, "Request permission result for "

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, " Permissions: "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-static {p2}, Ljava/util/Arrays;->toString([Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, " Grant: "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-static {p3}, Ljava/util/Arrays;->toString([I)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    const-string v1, "Activity"

    invoke-static {v1, v0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 579
    invoke-super {p0, p1, p2, p3}, Landroidx/appcompat/app/AppCompatActivity;->onRequestPermissionsResult(I[Ljava/lang/String;[I)V

    const/4 p0, 0x1

    if-eq p1, p0, :cond_0

    .line 599
    const-string p0, "Other Permission?"

    invoke-static {v1, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-void

    .line 583
    :cond_0
    array-length p0, p3

    if-lez p0, :cond_1

    const/4 p0, 0x0

    aget p0, p3, p0

    if-nez p0, :cond_1

    .line 587
    const-string p0, "Permission granted"

    invoke-static {v1, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 591
    :cond_1
    const-string p0, "Permission denied"

    invoke-static {v1, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    :goto_0
    return-void
.end method

.method protected onRestoreInstanceState(Landroid/os/Bundle;)V
    .locals 2

    .line 377
    invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->onRestoreInstanceState(Landroid/os/Bundle;)V

    .line 378
    const-string v0, "Web Restore"

    invoke-virtual {p1}, Landroid/os/Bundle;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-static {v0, v1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 379
    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {p0, p1}, Landroid/webkit/WebView;->restoreState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;

    return-void
.end method

.method protected onSaveInstanceState(Landroid/os/Bundle;)V
    .locals 0

    .line 363
    invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->onSaveInstanceState(Landroid/os/Bundle;)V

    .line 364
    iget-object p0, p0, Lnet/mikespub/mywebview/MainActivity;->myWebView:Landroid/webkit/WebView;

    invoke-virtual {p0, p1}, Landroid/webkit/WebView;->saveState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;

    .line 365
    const-string p0, "Web Save"

    invoke-virtual {p1}, Landroid/os/Bundle;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p0, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-void
.end method

.method startDownloadReceiver(Landroid/content/BroadcastReceiver;)V
    .locals 2

    .line 389
    invoke-virtual {p0}, Lnet/mikespub/mywebview/MainActivity;->stopDownloadReceiver()V

    .line 390
    iput-object p1, p0, Lnet/mikespub/mywebview/MainActivity;->onDownloadComplete:Landroid/content/BroadcastReceiver;

    .line 391
    const-string p1, "Web Create"

    const-string v0, "register receiver"

    invoke-static {p1, v0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 392
    iget-object p1, p0, Lnet/mikespub/mywebview/MainActivity;->onDownloadComplete:Landroid/content/BroadcastReceiver;

    new-instance v0, Landroid/content/IntentFilter;

    const-string v1, "android.intent.action.DOWNLOAD_COMPLETE"

    invoke-direct {v0, v1}, Landroid/content/IntentFilter;-><init>(Ljava/lang/String;)V

    const/4 v1, 0x4

    invoke-virtual {p0, p1, v0, v1}, Lnet/mikespub/mywebview/MainActivity;->registerReceiver(Landroid/content/BroadcastReceiver;Landroid/content/IntentFilter;I)Landroid/content/Intent;

    return-void
.end method

.method stopDownloadReceiver()V
    .locals 2

    .line 399
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->onDownloadComplete:Landroid/content/BroadcastReceiver;

    if-eqz v0, :cond_0

    .line 400
    const-string v0, "Web Create"

    const-string v1, "unregister receiver"

    invoke-static {v0, v1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 401
    iget-object v0, p0, Lnet/mikespub/mywebview/MainActivity;->onDownloadComplete:Landroid/content/BroadcastReceiver;

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MainActivity;->unregisterReceiver(Landroid/content/BroadcastReceiver;)V

    :cond_0
    return-void
.end method
