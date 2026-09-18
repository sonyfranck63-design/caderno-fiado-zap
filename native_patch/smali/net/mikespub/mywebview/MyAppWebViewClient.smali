.class Lnet/mikespub/mywebview/MyAppWebViewClient;
.super Landroid/webkit/WebViewClient;
.source "MyAppWebViewClient.java"


# instance fields
.field final activity:Lnet/mikespub/mywebview/MainActivity;

.field final domainName:Ljava/lang/String;

.field final domainUrl:Ljava/lang/String;

.field mDownloadExtract:Z

.field mDownloadId:J

.field mDownloadManager:Landroid/app/DownloadManager;

.field myCustomWebSettings:Ljava/util/Map;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation
.end field

.field private myMatchCompare:[[Ljava/lang/String;

.field private final myRequestHandler:Lnet/mikespub/mywebview/MyRequestHandler;

.field final mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

.field private mySkipCompare:[[Ljava/lang/String;


# direct methods
.method constructor <init>(Lnet/mikespub/mywebview/MainActivity;)V
    .locals 2

    .line 59
    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V

    const-wide/16 v0, -0x1

    .line 50
    iput-wide v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mDownloadId:J

    const/4 v0, 0x1

    .line 51
    iput-boolean v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mDownloadExtract:Z

    .line 60
    iput-object p1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    .line 61
    const-string v0, "Web Create"

    invoke-virtual {p1}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-static {v0, v1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 63
    invoke-virtual {p1}, Lnet/mikespub/mywebview/MainActivity;->getSavedStateModel()Lnet/mikespub/mywebview/MySavedStateModel;

    move-result-object v0

    iput-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const v0, 0x7f0e001c

    .line 64
    invoke-virtual {p1, v0}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainName:Ljava/lang/String;

    .line 65
    new-instance v0, Ljava/lang/StringBuilder;

    const-string v1, "https://"

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string v0, "/"

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    .line 66
    new-instance p1, Lnet/mikespub/mywebview/MyRequestHandler;

    invoke-direct {p1, p0}, Lnet/mikespub/mywebview/MyRequestHandler;-><init>(Lnet/mikespub/mywebview/MyAppWebViewClient;)V

    iput-object p1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myRequestHandler:Lnet/mikespub/mywebview/MyRequestHandler;

    .line 67
    invoke-virtual {p0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->loadSettings()V

    .line 68
    invoke-direct {p0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->setReceiver()V

    return-void
.end method

.method private loadStringConfig()V
    .locals 10

    .line 270
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    invoke-virtual {v0}, Lnet/mikespub/mywebview/MainActivity;->getResources()Landroid/content/res/Resources;

    move-result-object v0

    const/high16 v1, 0x7f030000

    invoke-virtual {v0, v1}, Landroid/content/res/Resources;->getStringArray(I)[Ljava/lang/String;

    move-result-object v0

    .line 271
    iget-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    invoke-virtual {v1}, Lnet/mikespub/mywebview/MainActivity;->getResources()Landroid/content/res/Resources;

    move-result-object v1

    const v2, 0x7f030001

    invoke-virtual {v1, v2}, Landroid/content/res/Resources;->getStringArray(I)[Ljava/lang/String;

    move-result-object v1

    .line 273
    array-length v2, v0

    const/4 v3, 0x2

    new-array v4, v3, [I

    const/4 v5, 0x1

    const/4 v6, 0x3

    aput v6, v4, v5

    const/4 v7, 0x0

    aput v2, v4, v7

    const-class v2, Ljava/lang/String;

    invoke-static {v2, v4}, Ljava/lang/reflect/Array;->newInstance(Ljava/lang/Class;[I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, [[Ljava/lang/String;

    iput-object v2, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myMatchCompare:[[Ljava/lang/String;

    move v2, v7

    .line 274
    :goto_0
    array-length v4, v0

    const-string v8, "\\|"

    if-ge v2, v4, :cond_0

    .line 275
    iget-object v4, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myMatchCompare:[[Ljava/lang/String;

    aget-object v9, v0, v2

    invoke-virtual {v9, v8}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object v8

    aput-object v8, v4, v2

    add-int/lit8 v2, v2, 0x1

    goto :goto_0

    .line 277
    :cond_0
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myMatchCompare:[[Ljava/lang/String;

    invoke-static {v0}, Ljava/util/Arrays;->deepToString([Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v0

    const-string v2, "Settings"

    invoke-static {v2, v0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 278
    array-length v0, v1

    new-array v3, v3, [I

    aput v6, v3, v5

    aput v0, v3, v7

    const-class v0, Ljava/lang/String;

    invoke-static {v0, v3}, Ljava/lang/reflect/Array;->newInstance(Ljava/lang/Class;[I)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [[Ljava/lang/String;

    iput-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySkipCompare:[[Ljava/lang/String;

    .line 279
    :goto_1
    array-length v0, v1

    if-ge v7, v0, :cond_1

    .line 280
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySkipCompare:[[Ljava/lang/String;

    aget-object v3, v1, v7

    invoke-virtual {v3, v8}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object v3

    aput-object v3, v0, v7

    add-int/lit8 v7, v7, 0x1

    goto :goto_1

    .line 282
    :cond_1
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySkipCompare:[[Ljava/lang/String;

    invoke-static {p0}, Ljava/util/Arrays;->deepToString([Ljava/lang/Object;)Ljava/lang/String;

    move-result-object p0

    invoke-static {v2, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-void
.end method

.method private setReceiver()V
    .locals 2

    .line 75
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    new-instance v1, Lnet/mikespub/mywebview/MyAppWebViewClient$1;

    invoke-direct {v1, p0}, Lnet/mikespub/mywebview/MyAppWebViewClient$1;-><init>(Lnet/mikespub/mywebview/MyAppWebViewClient;)V

    invoke-virtual {v0, v1}, Lnet/mikespub/mywebview/MainActivity;->startDownloadReceiver(Landroid/content/BroadcastReceiver;)V

    return-void
.end method

.method private testInterceptRequest(Landroid/webkit/WebView;Ljava/lang/String;)Landroid/webkit/WebResourceResponse;
    .locals 1

    .line 626
    const-string v0, "Web Intercept"

    invoke-static {v0, p2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 631
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {p2, v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v0

    if-nez v0, :cond_0

    const-string v0, "http://localhost/"

    invoke-virtual {p2, v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v0

    if-nez v0, :cond_0

    const/4 p0, 0x0

    return-object p0

    .line 634
    :cond_0
    invoke-static {p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object p2

    .line 635
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myRequestHandler:Lnet/mikespub/mywebview/MyRequestHandler;

    invoke-virtual {p0, p1, p2}, Lnet/mikespub/mywebview/MyRequestHandler;->handleRequest(Landroid/webkit/WebView;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;

    move-result-object p0

    return-object p0
.end method

.method private testOverrideUrlLoading(Landroid/webkit/WebView;Ljava/lang/String;)Z
    .locals 17

    move-object/from16 v0, p0

    move-object/from16 v1, p1

    move-object/from16 v2, p2

    .line 492
    const-string v3, "Web Override"

    invoke-static {v3, v2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    const-string v4, "blob:"

    invoke-virtual {v2, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_safe_blob

    const/4 v0, 0x0

    return v0

    :cond_safe_blob
    const-string v4, "data:"

    invoke-virtual {v2, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_safe_data

    const/4 v0, 0x0

    return v0

    :cond_safe_data

    .line 493
    iget-object v4, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {v2, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    const/4 v5, 0x0

    if-nez v4, :cond_9

    const-string v4, "http://localhost/"

    invoke-virtual {v2, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_0

    goto/16 :goto_5

    .line 502
    :cond_0
    invoke-static/range {p2 .. p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v4

    invoke-virtual {v0, v4}, Lnet/mikespub/mywebview/MyAppWebViewClient;->getSiteUrlFromAppLink(Landroid/net/Uri;)Ljava/lang/String;

    move-result-object v4

    .line 503
    invoke-virtual {v4}, Ljava/lang/String;->isEmpty()Z

    move-result v6

    const/4 v7, 0x1

    if-nez v6, :cond_1

    .line 504
    new-instance v0, Ljava/lang/StringBuilder;

    const-string v2, "Reload with site link "

    invoke-direct {v0, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v3, v0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 505
    invoke-virtual {v1, v4}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return v7

    .line 508
    :cond_1
    invoke-static/range {p2 .. p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v2

    .line 513
    new-instance v3, Ljava/util/HashMap;

    invoke-direct {v3}, Ljava/util/HashMap;-><init>()V

    .line 514
    const-string v4, "host"

    invoke-virtual {v2}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v6

    invoke-virtual {v3, v4, v6}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 515
    const-string v4, "path"

    invoke-virtual {v2}, Landroid/net/Uri;->getPath()Ljava/lang/String;

    move-result-object v6

    invoke-virtual {v3, v4, v6}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 516
    const-string v4, "query"

    invoke-virtual {v2}, Landroid/net/Uri;->getQuery()Ljava/lang/String;

    move-result-object v6

    invoke-virtual {v3, v4, v6}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 517
    const-string v4, "url"

    invoke-virtual {v2}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object v6

    invoke-virtual {v3, v4, v6}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 523
    iget-object v4, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myMatchCompare:[[Ljava/lang/String;

    array-length v6, v4

    move v8, v5

    move v9, v8

    move v10, v9

    :goto_0
    if-ge v8, v6, :cond_6

    aget-object v11, v4, v8

    .line 524
    aget-object v12, v11, v5

    invoke-virtual {v3, v12}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v12

    check-cast v12, Ljava/lang/String;

    .line 525
    new-instance v13, Ljava/lang/StringBuilder;

    const-string v14, "Value "

    invoke-direct {v13, v14}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    aget-object v15, v11, v5

    invoke-virtual {v13, v15}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v13

    const-string v15, ": "

    invoke-virtual {v13, v15}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v13

    invoke-virtual {v13, v12}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v13

    invoke-virtual {v13}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v13

    const-string v5, "WebView Match"

    invoke-static {v5, v13}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 526
    aget-object v5, v11, v7

    const/4 v13, 0x2

    aget-object v11, v11, v13

    invoke-static {v12, v5, v11}, Lnet/mikespub/myutils/MyReflectUtility;->stringCompare(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z

    move-result v5

    if-nez v5, :cond_2

    move-object/from16 v16, v3

    goto :goto_3

    .line 534
    :cond_2
    iget-object v5, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySkipCompare:[[Ljava/lang/String;

    array-length v9, v5

    const/4 v10, 0x0

    :goto_1
    if-ge v10, v9, :cond_4

    aget-object v11, v5, v10

    const/4 v12, 0x0

    .line 535
    aget-object v13, v11, v12

    invoke-virtual {v3, v13}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v13

    check-cast v13, Ljava/lang/String;

    .line 536
    new-instance v7, Ljava/lang/StringBuilder;

    invoke-direct {v7, v14}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v16, v3

    aget-object v3, v11, v12

    invoke-virtual {v7, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3, v15}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3, v13}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    const-string v7, "WebView Skip"

    invoke-static {v7, v3}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    const/4 v3, 0x1

    .line 537
    aget-object v7, v11, v3

    const/4 v3, 0x2

    aget-object v11, v11, v3

    invoke-static {v13, v7, v11}, Lnet/mikespub/myutils/MyReflectUtility;->stringCompare(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z

    move-result v7

    if-eqz v7, :cond_3

    const/4 v10, 0x1

    goto :goto_2

    :cond_3
    add-int/lit8 v10, v10, 0x1

    move v13, v3

    move-object/from16 v3, v16

    const/4 v7, 0x1

    goto :goto_1

    :cond_4
    move-object/from16 v16, v3

    const/4 v10, 0x0

    :goto_2
    if-nez v10, :cond_5

    const/4 v3, 0x0

    return v3

    :cond_5
    const/4 v9, 0x1

    :goto_3
    add-int/lit8 v8, v8, 0x1

    move-object/from16 v3, v16

    const/4 v5, 0x0

    const/4 v7, 0x1

    goto/16 :goto_0

    .line 548
    :cond_6
    const-string v3, "\n\nOpen with"

    const-string v4, "android.intent.action.VIEW"

    if-eqz v9, :cond_7

    if-eqz v10, :cond_7

    .line 549
    new-instance v0, Landroid/content/Intent;

    invoke-direct {v0, v4, v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V

    .line 551
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v4, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    .line 552
    invoke-static {v0, v2}, Landroid/content/Intent;->createChooser(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;

    move-result-object v0

    .line 553
    invoke-virtual/range {p1 .. p1}, Landroid/webkit/WebView;->getContext()Landroid/content/Context;

    move-result-object v1

    :try_start_start_act1
    invoke-virtual {v1, v0}, Landroid/content/Context;->startActivity(Landroid/content/Intent;)V
    :try_end_start_act1
    .catch Ljava/lang/Exception; {:try_start_start_act1 .. :try_end_start_act1} :catch_start_act1

    goto :act1_done

    :catch_start_act1
    move-exception v0

    const-string v1, "Web Override"

    const-string v2, "Failed to start activity"

    invoke-static {v1, v2, v0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :act1_done
    const/4 v0, 0x1

    return v0

    .line 557
    :cond_7
    invoke-virtual/range {p0 .. p0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->hasNotMatching()Ljava/lang/Boolean;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0

    if-eqz v0, :cond_8

    .line 558
    new-instance v0, Landroid/content/Intent;

    invoke-direct {v0, v4, v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V

    .line 560
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v4, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    .line 561
    invoke-static {v0, v2}, Landroid/content/Intent;->createChooser(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;

    move-result-object v0

    .line 562
    invoke-virtual/range {p1 .. p1}, Landroid/webkit/WebView;->getContext()Landroid/content/Context;

    move-result-object v1

    :try_start_start_act2
    invoke-virtual {v1, v0}, Landroid/content/Context;->startActivity(Landroid/content/Intent;)V
    :try_end_start_act2
    .catch Ljava/lang/Exception; {:try_start_start_act2 .. :try_end_start_act2} :catch_start_act2

    goto :act2_done

    :catch_start_act2
    move-exception v0

    const-string v1, "Web Override"

    const-string v2, "Failed to start activity 2"

    invoke-static {v1, v2, v0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :act2_done
    const/4 v2, 0x1

    goto :goto_4

    .line 564
    :cond_8
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v2, "\n\nLink not matching. You can allow opening via regular browser in Advanced Options."

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    .line 566
    invoke-virtual/range {p1 .. p1}, Landroid/webkit/WebView;->getContext()Landroid/content/Context;

    move-result-object v1

    invoke-virtual {v1}, Landroid/content/Context;->getApplicationContext()Landroid/content/Context;

    move-result-object v1

    const/4 v2, 0x1

    .line 565
    invoke-static {v1, v0, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v0

    .line 569
    invoke-virtual {v0}, Landroid/widget/Toast;->show()V

    :goto_4
    return v2

    .line 495
    :cond_9
    :goto_5
    invoke-static/range {p2 .. p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v2

    .line 496
    iget-object v3, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myRequestHandler:Lnet/mikespub/mywebview/MyRequestHandler;

    invoke-virtual {v3, v2}, Lnet/mikespub/mywebview/MyRequestHandler;->getIntentPrefixFromUri(Landroid/net/Uri;)Ljava/lang/String;

    move-result-object v3

    if-eqz v3, :cond_a

    .line 497
    iget-object v0, v0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myRequestHandler:Lnet/mikespub/mywebview/MyRequestHandler;

    invoke-virtual {v0, v1, v2}, Lnet/mikespub/mywebview/MyRequestHandler;->handleIntentUri(Landroid/webkit/WebView;Landroid/net/Uri;)Ljava/lang/Boolean;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0

    return v0

    :cond_a
    const/4 v0, 0x0

    return v0
.end method


# virtual methods
.method getLocalConfig()Ljava/util/Map;
    .locals 1
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()",
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .line 194
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "local_config"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/util/Map;

    return-object p0
.end method

.method getSiteUrlFromAppLink(Landroid/net/Uri;)Ljava/lang/String;
    .locals 12

    .line 356
    invoke-virtual {p1}, Landroid/net/Uri;->getScheme()Ljava/lang/String;

    move-result-object v0

    .line 357
    invoke-virtual {p1}, Landroid/net/Uri;->getEncodedAuthority()Ljava/lang/String;

    move-result-object v1

    .line 358
    invoke-virtual {p1}, Landroid/net/Uri;->getEncodedPath()Ljava/lang/String;

    move-result-object p1

    .line 359
    invoke-virtual {p1}, Ljava/lang/String;->isEmpty()Z

    move-result v2

    const-string v3, "/"

    if-eqz v2, :cond_0

    move-object p1, v3

    .line 362
    :cond_0
    invoke-virtual {p1, v3}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v2

    if-nez v2, :cond_1

    .line 363
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    .line 365
    :cond_1
    iget-object v2, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    const v4, 0x7f0e002a

    invoke-virtual {v2, v4}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v0, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    const-string v2, "link2"

    const-string v4, "link"

    const-string v5, ""

    const-string v6, "AppLink"

    const/4 v7, 0x1

    if-eqz v0, :cond_2

    .line 366
    new-instance v0, Ljava/lang/StringBuilder;

    const-string v8, "Path: "

    invoke-direct {v0, v8}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v6, v0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    goto/16 :goto_0

    .line 367
    :cond_2
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    const v8, 0x7f0e0028

    invoke-virtual {v0, v8}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    const-string v8, "!="

    const-string v9, "Failed to resolve canonical path for "

    if-eqz v0, :cond_5

    .line 368
    new-instance v0, Ljava/io/File;

    invoke-direct {v0, p1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 371
    :try_start_0
    invoke-virtual {v0}, Ljava/io/File;->getCanonicalPath()Ljava/lang/String;

    move-result-object v0
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    .line 376
    invoke-virtual {v0}, Ljava/lang/String;->length()I

    move-result v9

    if-le v9, v7, :cond_3

    invoke-virtual {v0, v3, v7}, Ljava/lang/String;->indexOf(Ljava/lang/String;I)I

    move-result v9

    if-gez v9, :cond_3

    .line 377
    new-instance v9, Ljava/lang/StringBuilder;

    invoke-direct {v9}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v9, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    .line 379
    :cond_3
    iget-object v9, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    const v10, 0x7f0e0029

    invoke-virtual {v9, v10}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v9

    invoke-virtual {v0, v9}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v9

    const-string v11, "Link: "

    if-eqz v9, :cond_4

    .line 380
    new-instance v8, Ljava/lang/StringBuilder;

    invoke-direct {v8, v11}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v8, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {v6, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 382
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    const v6, 0x7f0e002b

    invoke-virtual {v1, v6}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    iget-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    invoke-virtual {v1, v10}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/String;->length()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    move-object v1, v4

    goto/16 :goto_0

    .line 384
    :cond_4
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0, v11}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {v6, p0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    return-object v5

    .line 373
    :catch_0
    new-instance p0, Ljava/lang/IllegalArgumentException;

    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0, v9}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 387
    :cond_5
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    const v10, 0x7f0e0025

    invoke-virtual {v0, v10}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_e

    .line 388
    new-instance v0, Ljava/io/File;

    invoke-direct {v0, p1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 391
    :try_start_1
    invoke-virtual {v0}, Ljava/io/File;->getCanonicalPath()Ljava/lang/String;

    move-result-object v0
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_1

    .line 396
    invoke-virtual {v0}, Ljava/lang/String;->length()I

    move-result v9

    if-le v9, v7, :cond_6

    invoke-virtual {v0, v3, v7}, Ljava/lang/String;->indexOf(Ljava/lang/String;I)I

    move-result v9

    if-gez v9, :cond_6

    .line 397
    new-instance v9, Ljava/lang/StringBuilder;

    invoke-direct {v9}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v9, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    .line 399
    :cond_6
    iget-object v9, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    const v10, 0x7f0e0026

    invoke-virtual {v9, v10}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v9

    invoke-virtual {v0, v9}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v9

    const-string v11, "Link2: "

    if-eqz v9, :cond_d

    .line 400
    new-instance v8, Ljava/lang/StringBuilder;

    invoke-direct {v8, v11}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v8, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {v6, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 402
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    const v6, 0x7f0e0027

    invoke-virtual {v1, v6}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    iget-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    invoke-virtual {v1, v10}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/String;->length()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    move-object v1, v2

    .line 414
    :goto_0
    invoke-virtual {v1}, Ljava/lang/String;->hashCode()I

    move-result v0

    const/4 v6, 0x5

    const/4 v8, 0x4

    const/4 v9, 0x3

    const/4 v10, 0x2

    sparse-switch v0, :sswitch_data_0

    goto :goto_1

    :sswitch_0
    const-string v0, "sites"

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_7

    move v0, v10

    goto :goto_2

    :sswitch_1
    const-string v0, "other"

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_7

    const/4 v0, 0x6

    goto :goto_2

    :sswitch_2
    const-string v0, "local"

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_7

    move v0, v7

    goto :goto_2

    :sswitch_3
    invoke-virtual {v1, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_7

    move v0, v6

    goto :goto_2

    :sswitch_4
    invoke-virtual {v1, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_7

    move v0, v8

    goto :goto_2

    :sswitch_5
    const-string v0, "web"

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_7

    const/4 v0, 0x0

    goto :goto_2

    :sswitch_6
    invoke-virtual {v1, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_7

    move v0, v9

    goto :goto_2

    :cond_7
    :goto_1
    const/4 v0, -0x1

    :goto_2
    if-eqz v0, :cond_c

    if-eq v0, v7, :cond_c

    if-eq v0, v10, :cond_a

    if-eq v0, v9, :cond_9

    if-eq v0, v8, :cond_8

    if-eq v0, v6, :cond_8

    return-object v5

    .line 444
    :cond_8
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    goto :goto_3

    .line 431
    :cond_9
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    const v0, 0x7f0e002d

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MainActivity;->getString(I)Ljava/lang/String;

    move-result-object p0

    invoke-virtual {p1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    goto :goto_3

    .line 424
    :cond_a
    invoke-virtual {p1}, Ljava/lang/String;->length()I

    move-result v0

    if-le v0, v7, :cond_b

    invoke-virtual {p1, v3, v7}, Ljava/lang/String;->indexOf(Ljava/lang/String;I)I

    move-result v0

    if-gez v0, :cond_b

    .line 425
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    .line 427
    :cond_b
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    goto :goto_3

    .line 419
    :cond_c
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string v0, "assets/"

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    :goto_3
    return-object p0

    .line 404
    :cond_d
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0, v11}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {v6, p0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    return-object v5

    .line 393
    :catch_1
    new-instance p0, Ljava/lang/IllegalArgumentException;

    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0, v9}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 408
    :cond_e
    new-instance p0, Ljava/lang/StringBuilder;

    const-string v0, "Site: "

    invoke-direct {p0, v0}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {v6, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-object v5

    nop

    :sswitch_data_0
    .sparse-switch
        0x0 -> :sswitch_6
        0x1cb54 -> :sswitch_5
        0x32affa -> :sswitch_4
        0x6234f78 -> :sswitch_3
        0x625df6b -> :sswitch_2
        0x6527f10 -> :sswitch_1
        0x6860a0c -> :sswitch_0
    .end sparse-switch
.end method

.method getUpdateZip()Ljava/lang/String;
    .locals 1

    .line 176
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "update_zip"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/lang/String;

    return-object p0
.end method

.method getWebSettings()Ljava/util/Map;
    .locals 1
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()",
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .line 185
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "web_settings"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/util/Map;

    return-object p0
.end method

.method hasConsoleLog()Ljava/lang/Boolean;
    .locals 1

    .line 131
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "console_log"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/lang/Boolean;

    return-object p0
.end method

.method hasContextMenu()Ljava/lang/Boolean;
    .locals 1

    .line 149
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "context_menu"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/lang/Boolean;

    return-object p0
.end method

.method hasDebuggingEnabled()Ljava/lang/Boolean;
    .locals 1

    .line 122
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "remote_debug"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/lang/Boolean;

    return-object p0
.end method

.method hasJavascriptInterface()Ljava/lang/Boolean;
    .locals 1

    .line 140
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "js_interface"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/lang/Boolean;

    return-object p0
.end method

.method hasLocalSites()Ljava/lang/Boolean;
    .locals 1

    .line 167
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "local_sites"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/lang/Boolean;

    return-object p0
.end method

.method hasNotMatching()Ljava/lang/Boolean;
    .locals 1

    .line 158
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    const-string v0, "not_matching"

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/lang/Boolean;

    return-object p0
.end method

.method loadAppLink(Landroid/webkit/WebView;Landroid/net/Uri;Ljava/lang/Boolean;)Z
    .locals 2

    .line 326
    invoke-virtual {p0, p2}, Lnet/mikespub/mywebview/MyAppWebViewClient;->getSiteUrlFromAppLink(Landroid/net/Uri;)Ljava/lang/String;

    move-result-object v0

    .line 327
    invoke-virtual {v0}, Ljava/lang/String;->isEmpty()Z

    move-result v1

    if-eqz v1, :cond_1

    .line 328
    invoke-virtual {p3}, Ljava/lang/Boolean;->booleanValue()Z

    move-result p3

    if-eqz p3, :cond_0

    .line 329
    new-instance p3, Ljava/lang/StringBuilder;

    invoke-direct {p3}, Ljava/lang/StringBuilder;-><init>()V

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {p3, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string p3, "assets/local/404.jsp?link="

    invoke-virtual {p0, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p2}, Landroid/net/Uri;->getEncodedAuthority()Ljava/lang/String;

    move-result-object p3

    invoke-virtual {p0, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p2}, Landroid/net/Uri;->getEncodedPath()Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    .line 330
    invoke-virtual {p1, p0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    :cond_0
    const/4 p0, 0x0

    return p0

    .line 334
    :cond_1
    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    const/4 p0, 0x1

    return p0
.end method

.method loadContent(Landroid/webkit/WebView;Ljava/lang/String;)V
    .locals 1

    .line 313
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string v0, "content/"

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    .line 314
    invoke-virtual {p1, p0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void
.end method

.method loadDocument(Landroid/webkit/WebView;Ljava/lang/String;)V
    .locals 1

    .line 302
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string v0, "document/"

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    .line 303
    invoke-virtual {p1, p0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void
.end method

.method loadHomePage(Landroid/webkit/WebView;)V
    .locals 2

    .line 291
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    invoke-virtual {p0}, Lnet/mikespub/mywebview/MainActivity;->getResources()Landroid/content/res/Resources;

    move-result-object p0

    const v1, 0x7f0e002d

    invoke-virtual {p0, v1}, Landroid/content/res/Resources;->getString(I)Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    .line 292
    invoke-virtual {p1, p0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void
.end method

.method loadNotFound(Landroid/webkit/WebView;Ljava/lang/String;)V
    .locals 1

    .line 345
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->domainUrl:Ljava/lang/String;

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string v0, "assets/local/404.jsp?link="

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    .line 346
    invoke-virtual {p1, p0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void
.end method

.method loadSettings()V
    .locals 11

    .line 233
    iget-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySavedStateModel:Lnet/mikespub/mywebview/MySavedStateModel;

    iget-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->activity:Lnet/mikespub/mywebview/MainActivity;

    invoke-virtual {v0, v1}, Lnet/mikespub/mywebview/MySavedStateModel;->getSettings(Landroidx/appcompat/app/AppCompatActivity;)Ljava/util/HashMap;

    move-result-object v0

    .line 234
    const-string v1, "State Get"

    invoke-virtual {v0}, Ljava/util/HashMap;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-static {v1, v2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    if-nez v0, :cond_0

    .line 236
    invoke-direct {p0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->loadStringConfig()V

    return-void

    .line 240
    :cond_0
    const-string v1, "match"

    invoke-virtual {v0, v1}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/util/ArrayList;

    .line 241
    invoke-virtual {v1}, Ljava/util/ArrayList;->size()I

    move-result v2

    const/4 v3, 0x2

    new-array v4, v3, [I

    const/4 v5, 0x1

    const/4 v6, 0x3

    aput v6, v4, v5

    const/4 v7, 0x0

    aput v2, v4, v7

    const-class v2, Ljava/lang/String;

    invoke-static {v2, v4}, Ljava/lang/reflect/Array;->newInstance(Ljava/lang/Class;[I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, [[Ljava/lang/String;

    iput-object v2, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myMatchCompare:[[Ljava/lang/String;

    .line 243
    invoke-virtual {v1}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v1

    move v2, v7

    :goto_0
    invoke-interface {v1}, Ljava/util/Iterator;->hasNext()Z

    move-result v4

    if-eqz v4, :cond_2

    invoke-interface {v1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v4

    .line 245
    check-cast v4, Ljava/util/ArrayList;

    invoke-virtual {v4}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v4

    move v8, v7

    :goto_1
    invoke-interface {v4}, Ljava/util/Iterator;->hasNext()Z

    move-result v9

    if-eqz v9, :cond_1

    invoke-interface {v4}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v9

    check-cast v9, Ljava/lang/String;

    .line 246
    iget-object v10, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myMatchCompare:[[Ljava/lang/String;

    aget-object v10, v10, v2

    aput-object v9, v10, v8

    add-int/2addr v8, v5

    goto :goto_1

    :cond_1
    add-int/lit8 v2, v2, 0x1

    goto :goto_0

    .line 251
    :cond_2
    iget-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myMatchCompare:[[Ljava/lang/String;

    invoke-static {v1}, Ljava/util/Arrays;->deepToString([Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v1

    const-string v2, "Settings"

    invoke-static {v2, v1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 252
    const-string v1, "skip"

    invoke-virtual {v0, v1}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Ljava/util/ArrayList;

    .line 253
    invoke-virtual {v0}, Ljava/util/ArrayList;->size()I

    move-result v1

    new-array v3, v3, [I

    aput v6, v3, v5

    aput v1, v3, v7

    const-class v1, Ljava/lang/String;

    invoke-static {v1, v3}, Ljava/lang/reflect/Array;->newInstance(Ljava/lang/Class;[I)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, [[Ljava/lang/String;

    iput-object v1, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySkipCompare:[[Ljava/lang/String;

    .line 255
    invoke-virtual {v0}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v0

    move v1, v7

    :goto_2
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v3

    if-eqz v3, :cond_4

    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v3

    .line 257
    check-cast v3, Ljava/util/ArrayList;

    invoke-virtual {v3}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v3

    move v4, v7

    :goto_3
    invoke-interface {v3}, Ljava/util/Iterator;->hasNext()Z

    move-result v6

    if-eqz v6, :cond_3

    invoke-interface {v3}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v6

    check-cast v6, Ljava/lang/String;

    .line 258
    iget-object v8, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySkipCompare:[[Ljava/lang/String;

    aget-object v8, v8, v1

    aput-object v6, v8, v4

    add-int/2addr v4, v5

    goto :goto_3

    :cond_3
    add-int/lit8 v1, v1, 0x1

    goto :goto_2

    .line 263
    :cond_4
    iget-object p0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->mySkipCompare:[[Ljava/lang/String;

    invoke-static {p0}, Ljava/util/Arrays;->deepToString([Ljava/lang/Object;)Ljava/lang/String;

    move-result-object p0

    invoke-static {v2, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-void
.end method

.method setWebSettings(Landroid/webkit/WebSettings;)V
    .locals 6

    .line 203
    invoke-virtual {p0}, Lnet/mikespub/mywebview/MyAppWebViewClient;->getWebSettings()Ljava/util/Map;

    move-result-object v0

    iput-object v0, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myCustomWebSettings:Ljava/util/Map;

    .line 204
    const-string v1, "WebSettings"

    if-nez v0, :cond_0

    .line 205
    const-string p0, "No custom settings"

    invoke-static {v1, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-void

    .line 208
    :cond_0
    invoke-virtual {v0}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v1, v0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 210
    invoke-static {p1}, Lnet/mikespub/myutils/MyReflectUtility;->getValues(Ljava/lang/Object;)Ljava/util/Map;

    move-result-object v0

    .line 213
    iget-object v2, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myCustomWebSettings:Ljava/util/Map;

    invoke-interface {v2}, Ljava/util/Map;->keySet()Ljava/util/Set;

    move-result-object v2

    invoke-interface {v2}, Ljava/util/Set;->iterator()Ljava/util/Iterator;

    move-result-object v2

    :cond_1
    :goto_0
    invoke-interface {v2}, Ljava/util/Iterator;->hasNext()Z

    move-result v3

    if-eqz v3, :cond_4

    invoke-interface {v2}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/lang/String;

    .line 214
    invoke-interface {v0, v3}, Ljava/util/Map;->containsKey(Ljava/lang/Object;)Z

    move-result v4

    if-nez v4, :cond_2

    .line 215
    new-instance v4, Ljava/lang/StringBuilder;

    const-string v5, "Unknown key: "

    invoke-direct {v4, v5}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-static {v1, v3}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 218
    :cond_2
    new-instance v4, Ljava/lang/StringBuilder;

    const-string v5, "Key: "

    invoke-direct {v4, v5}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    const-string v5, " - default: "

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-interface {v0, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v4

    const-string v5, " - custom: "

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    iget-object v5, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myCustomWebSettings:Ljava/util/Map;

    invoke-interface {v5, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-static {v1, v4}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 219
    iget-object v4, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myCustomWebSettings:Ljava/util/Map;

    invoke-interface {v4, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    if-eqz v4, :cond_1

    invoke-interface {v0, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    iget-object v5, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myCustomWebSettings:Ljava/util/Map;

    invoke-interface {v5, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    if-eq v4, v5, :cond_1

    invoke-interface {v0, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    instance-of v4, v4, Ljava/lang/String;

    if-eqz v4, :cond_3

    invoke-interface {v0, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    iget-object v5, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myCustomWebSettings:Ljava/util/Map;

    invoke-interface {v5, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    invoke-virtual {v4, v5}, Ljava/lang/Object;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_3

    goto/16 :goto_0

    .line 221
    :cond_3
    iget-object v4, p0, Lnet/mikespub/mywebview/MyAppWebViewClient;->myCustomWebSettings:Ljava/util/Map;

    invoke-interface {v4, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    invoke-static {p1, v3, v4}, Lnet/mikespub/myutils/MyReflectUtility;->set(Ljava/lang/Object;Ljava/lang/String;Ljava/lang/Object;)V

    goto/16 :goto_0

    :cond_4
    return-void
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .locals 0

    .line 598
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object p2

    invoke-virtual {p2}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object p2

    .line 599
    invoke-direct {p0, p1, p2}, Lnet/mikespub/mywebview/MyAppWebViewClient;->testInterceptRequest(Landroid/webkit/WebView;Ljava/lang/String;)Landroid/webkit/WebResourceResponse;

    move-result-object p0

    return-object p0
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Z
    .locals 0

    .line 464
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object p2

    invoke-virtual {p2}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object p2

    .line 465
    invoke-direct {p0, p1, p2}, Lnet/mikespub/mywebview/MyAppWebViewClient;->testOverrideUrlLoading(Landroid/webkit/WebView;Ljava/lang/String;)Z

    move-result p0

    return p0
.end method
