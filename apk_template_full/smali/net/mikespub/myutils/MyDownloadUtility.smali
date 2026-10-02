.class public Lnet/mikespub/myutils/MyDownloadUtility;
.super Ljava/lang/Object;
.source "MyDownloadUtility.java"


# static fields
.field private static final TAG:Ljava/lang/String; = "Download"


# direct methods
.method public constructor <init>()V
    .locals 0

    .line 17
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static getDownloadManager(Landroidx/appcompat/app/AppCompatActivity;)Landroid/app/DownloadManager;
    .locals 1

    .line 65
    const-string v0, "download"

    invoke-virtual {p0, v0}, Landroidx/appcompat/app/AppCompatActivity;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Landroid/app/DownloadManager;

    return-object p0
.end method

.method public static getDownloadStatus(Landroidx/appcompat/app/AppCompatActivity;I)I
    .locals 4

    .line 76
    invoke-static {p0}, Lnet/mikespub/myutils/MyDownloadUtility;->getDownloadManager(Landroidx/appcompat/app/AppCompatActivity;)Landroid/app/DownloadManager;

    move-result-object p0

    .line 78
    new-instance v0, Landroid/app/DownloadManager$Query;

    invoke-direct {v0}, Landroid/app/DownloadManager$Query;-><init>()V

    int-to-long v1, p1

    const/4 p1, 0x1

    new-array p1, p1, [J

    const/4 v3, 0x0

    aput-wide v1, p1, v3

    invoke-virtual {v0, p1}, Landroid/app/DownloadManager$Query;->setFilterById([J)Landroid/app/DownloadManager$Query;

    move-result-object p1

    invoke-virtual {p0, p1}, Landroid/app/DownloadManager;->query(Landroid/app/DownloadManager$Query;)Landroid/database/Cursor;

    move-result-object p1

    .line 79
    invoke-interface {p1}, Landroid/database/Cursor;->moveToFirst()Z

    move-result v0

    if-eqz v0, :cond_1

    .line 80
    const-string v0, "status"

    invoke-interface {p1, v0}, Landroid/database/Cursor;->getColumnIndex(Ljava/lang/String;)I

    move-result v0

    const/4 v3, -0x1

    if-le v0, v3, :cond_1

    .line 82
    invoke-interface {p1, v0}, Landroid/database/Cursor;->getInt(I)I

    move-result p1

    const/16 v0, 0x8

    if-ne p1, v0, :cond_0

    .line 87
    invoke-virtual {p0, v1, v2}, Landroid/app/DownloadManager;->getUriForDownloadedFile(J)Landroid/net/Uri;

    move-result-object p0

    if-eqz p0, :cond_0

    .line 89
    new-instance v0, Ljava/lang/StringBuilder;

    const-string v1, "URI: "

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    const-string v0, "Download"

    invoke-static {v0, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return p1

    :cond_1
    const/16 p0, 0x10

    return p0
.end method

.method public static getMyDownloadFiles(Landroidx/appcompat/app/AppCompatActivity;)Ljava/util/List;
    .locals 1
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Landroidx/appcompat/app/AppCompatActivity;",
            ")",
            "Ljava/util/List<",
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Ljava/lang/Object;",
            ">;>;"
        }
    .end annotation

    .line 55
    const-string v0, "content://downloads/my_downloads"

    invoke-static {v0}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v0

    invoke-static {p0, v0}, Lnet/mikespub/myutils/MyContentUtility;->getContentItems(Landroidx/appcompat/app/AppCompatActivity;Landroid/net/Uri;)Ljava/util/List;

    move-result-object p0

    return-object p0
.end method

.method public static showMyDownloadFiles(Landroidx/appcompat/app/AppCompatActivity;Z)V
    .locals 1

    .line 51
    const-string v0, "content://downloads/my_downloads"

    invoke-static {p0, v0, p1}, Lnet/mikespub/myutils/MyContentUtility;->showContentFiles(Landroidx/appcompat/app/AppCompatActivity;Ljava/lang/String;Z)V

    return-void
.end method
