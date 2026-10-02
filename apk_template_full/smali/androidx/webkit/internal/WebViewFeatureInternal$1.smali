.class Landroidx/webkit/internal/WebViewFeatureInternal$1;
.super Landroidx/webkit/internal/ApiFeature$T;
.source "WebViewFeatureInternal.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Landroidx/webkit/internal/WebViewFeatureInternal;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field private final mVersionPattern:Ljava/util/regex/Pattern;


# direct methods
.method constructor <init>(Ljava/lang/String;Ljava/lang/String;)V
    .locals 0

    .line 420
    invoke-direct {p0, p1, p2}, Landroidx/webkit/internal/ApiFeature$T;-><init>(Ljava/lang/String;Ljava/lang/String;)V

    .line 421
    const-string p1, "\\A\\d+"

    invoke-static {p1}, Ljava/util/regex/Pattern;->compile(Ljava/lang/String;)Ljava/util/regex/Pattern;

    move-result-object p1

    iput-object p1, p0, Landroidx/webkit/internal/WebViewFeatureInternal$1;->mVersionPattern:Ljava/util/regex/Pattern;

    return-void
.end method


# virtual methods
.method public isSupportedByWebView()Z
    .locals 0

    .line 424
    invoke-super {p0}, Landroidx/webkit/internal/ApiFeature$T;->isSupportedByWebView()Z

    move-result p0

    return p0
.end method
