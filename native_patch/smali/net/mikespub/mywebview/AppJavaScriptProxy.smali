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

.method public showToast(Ljava/lang/String;)V
    .locals 2

    iget-object v0, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    new-instance v1, Lnet/mikespub/mywebview/AppJavaScriptProxy$2;

    invoke-direct {v1, p0, v0, p1}, Lnet/mikespub/mywebview/AppJavaScriptProxy$2;-><init>(Lnet/mikespub/mywebview/AppJavaScriptProxy;Landroidx/appcompat/app/AppCompatActivity;Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Landroidx/appcompat/app/AppCompatActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    return-void
.end method

.method public isNativeApp()Z
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    const/4 v0, 0x1

    return v0
.end method

.method public saveBase64File(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 6
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    const-string v0, "AppJavaScriptProxy"

    const/4 v1, 0x0

    if-eqz p1, :cond_exit

    if-nez p2, :cond_start

    goto/16 :cond_exit

    :cond_start
    :try_start_save
    const-string v2, ","

    invoke-virtual {p1, v2}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result v2

    const/4 v3, -0x1

    if-eq v2, v3, :cond_prefix_stripped

    add-int/lit8 v2, v2, 0x1

    invoke-virtual {p1, v2}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    :cond_prefix_stripped
    invoke-static {p1, v1}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B

    move-result-object v0

    if-eqz p3, :cond_mime_set

    invoke-virtual {p3}, Ljava/lang/String;->isEmpty()Z

    move-result v2

    if-eqz v2, :cond_mime_ready

    :cond_mime_set
    const-string p3, "application/pdf"

    :cond_mime_ready
    sget v2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v3, 0x1d

    if-lt v2, v3, :cond_save_legacy

    new-instance v2, Landroid/content/ContentValues;

    invoke-direct {v2}, Landroid/content/ContentValues;-><init>()V

    const-string v3, "_display_name"

    invoke-virtual {v2, v3, p2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    const-string v3, "mime_type"

    invoke-virtual {v2, v3, p3}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    sget-object v3, Landroid/os/Environment;->DIRECTORY_DOWNLOADS:Ljava/lang/String;

    const-string v4, "relative_path"

    invoke-virtual {v2, v4, v3}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    iget-object v3, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    invoke-virtual {v3}, Landroidx/appcompat/app/AppCompatActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v3

    sget-object v4, Landroid/provider/MediaStore$Downloads;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    invoke-virtual {v3, v4, v2}, Landroid/content/ContentResolver;->insert(Landroid/net/Uri;Landroid/content/ContentValues;)Landroid/net/Uri;

    move-result-object v2

    if-eqz v2, :cond_save_legacy

    invoke-virtual {v3, v2}, Landroid/content/ContentResolver;->openOutputStream(Landroid/net/Uri;)Ljava/io/OutputStream;

    move-result-object v2

    if-eqz v2, :cond_save_legacy

    invoke-virtual {v2, v0}, Ljava/io/OutputStream;->write([B)V

    invoke-virtual {v2}, Ljava/io/OutputStream;->flush()V

    invoke-virtual {v2}, Ljava/io/OutputStream;->close()V

    goto :cond_notify_success

    :cond_save_legacy
    sget-object v2, Landroid/os/Environment;->DIRECTORY_DOWNLOADS:Ljava/lang/String;

    invoke-static {v2}, Landroid/os/Environment;->getExternalStoragePublicDirectory(Ljava/lang/String;)Ljava/io/File;

    move-result-object v2

    invoke-virtual {v2}, Ljava/io/File;->exists()Z

    move-result v3

    if-nez v3, :cond_leg_dir

    invoke-virtual {v2}, Ljava/io/File;->mkdirs()Z

    :cond_leg_dir
    new-instance v3, Ljava/io/File;

    invoke-direct {v3, v2, p2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    new-instance v2, Ljava/io/FileOutputStream;

    invoke-direct {v2, v3}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V

    invoke-virtual {v2, v0}, Ljava/io/FileOutputStream;->write([B)V

    invoke-virtual {v2}, Ljava/io/FileOutputStream;->flush()V

    invoke-virtual {v2}, Ljava/io/FileOutputStream;->close()V

    iget-object v0, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    const/4 v2, 0x1

    new-array v4, v2, [Ljava/lang/String;

    invoke-virtual {v3}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v3

    aput-object v3, v4, v1

    new-array v2, v2, [Ljava/lang/String;

    aput-object p3, v2, v1

    const/4 v3, 0x0

    invoke-static {v0, v4, v2, v3}, Landroid/media/MediaScannerConnection;->scanFile(Landroid/content/Context;[Ljava/lang/String;[Ljava/lang/String;Landroid/media/MediaScannerConnection$OnScanCompletedListener;)V

    :cond_notify_success
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Arquivo salvo em Downloads:\n"

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/AppJavaScriptProxy;->showToast(Ljava/lang/String;)V
    :try_end_save
    .catch Ljava/lang/Exception; {:try_start_save .. :try_end_save} :catch_save

    const/4 v0, 0x1

    return v0

    :catch_save
    move-exception v0

    const-string v2, "AppJavaScriptProxy"

    const-string v3, "saveBase64File error"

    invoke-static {v2, v3, v0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "Erro ao salvar arquivo: "

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/AppJavaScriptProxy;->showToast(Ljava/lang/String;)V

    :cond_exit
    return v1
.end method

.method public shareBase64File(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 5
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    const-string v0, "AppJavaScriptProxy"

    const/4 v1, 0x0

    if-eqz p1, :cond_exit

    if-nez p2, :cond_start

    goto/16 :cond_exit

    :cond_start
    :try_start_share
    const-string v2, ","

    invoke-virtual {p1, v2}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result v2

    const/4 v3, -0x1

    if-eq v2, v3, :cond_prefix_stripped

    add-int/lit8 v2, v2, 0x1

    invoke-virtual {p1, v2}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    :cond_prefix_stripped
    invoke-static {p1, v1}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B

    move-result-object v0

    if-eqz p3, :cond_mime_set

    invoke-virtual {p3}, Ljava/lang/String;->isEmpty()Z

    move-result v2

    if-eqz v2, :cond_mime_ready

    :cond_mime_set
    const-string p3, "application/pdf"

    :cond_mime_ready
    iget-object v2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    const-string v3, "Download"

    invoke-virtual {v2, v3}, Landroidx/appcompat/app/AppCompatActivity;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object v2

    if-nez v2, :cond_dir_ok

    iget-object v2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    const/4 v3, 0x0

    invoke-virtual {v2, v3}, Landroidx/appcompat/app/AppCompatActivity;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object v2

    :cond_dir_ok
    if-nez v2, :cond_dir_not_null

    iget-object v2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    invoke-virtual {v2}, Landroidx/appcompat/app/AppCompatActivity;->getCacheDir()Ljava/io/File;

    move-result-object v2

    :cond_dir_not_null
    invoke-virtual {v2}, Ljava/io/File;->exists()Z

    move-result v3

    if-nez v3, :cond_dir_created

    invoke-virtual {v2}, Ljava/io/File;->mkdirs()Z

    :cond_dir_created
    new-instance v3, Ljava/io/File;

    invoke-direct {v3, v2, p2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    new-instance v2, Ljava/io/FileOutputStream;

    invoke-direct {v2, v3}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V

    invoke-virtual {v2, v0}, Ljava/io/FileOutputStream;->write([B)V

    invoke-virtual {v2}, Ljava/io/FileOutputStream;->flush()V

    invoke-virtual {v2}, Ljava/io/FileOutputStream;->close()V

    iget-object v0, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    const-string v2, "net.mikespub.mywebview.fileprovider"

    invoke-static {v0, v2, v3}, Lnet/mikespub/myutils/MyFileProvider;->getUriForFile(Landroid/content/Context;Ljava/lang/String;Ljava/io/File;)Landroid/net/Uri;

    move-result-object v0

    new-instance v2, Landroid/content/Intent;

    const-string v3, "android.intent.action.SEND"

    invoke-direct {v2, v3}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    invoke-virtual {v2, p3}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    const-string v3, "android.intent.extra.STREAM"

    invoke-virtual {v2, v3, v0}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Landroid/os/Parcelable;)Landroid/content/Intent;

    if-eqz p5, :cond_skip_text

    invoke-virtual {p5}, Ljava/lang/String;->isEmpty()Z

    move-result v0

    if-nez v0, :cond_skip_text

    const-string v0, "android.intent.extra.TEXT"

    invoke-virtual {v2, v0, p5}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    :cond_skip_text
    if-eqz p4, :cond_skip_title

    invoke-virtual {p4}, Ljava/lang/String;->isEmpty()Z

    move-result v0

    if-nez v0, :cond_skip_title

    const-string v0, "android.intent.extra.TITLE"

    invoke-virtual {v2, v0, p4}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    :cond_skip_title
    const/4 v0, 0x1

    invoke-virtual {v2, v0}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    if-eqz p4, :cond_default_chooser

    invoke-virtual {p4}, Ljava/lang/String;->isEmpty()Z

    move-result v0

    if-eqz v0, :cond_chooser_title_ok

    :cond_default_chooser
    const-string p4, "Enviar documento..."

    :cond_chooser_title_ok
    invoke-static {v2, p4}, Landroid/content/Intent;->createChooser(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;

    move-result-object v0

    const/high16 v2, 0x10000000

    invoke-virtual {v0, v2}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    iget-object v2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    invoke-virtual {v2, v0}, Landroidx/appcompat/app/AppCompatActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_share
    .catch Ljava/lang/Exception; {:try_start_share .. :try_end_share} :catch_share

    const/4 v0, 0x1

    return v0

    :catch_share
    move-exception v0

    const-string v2, "AppJavaScriptProxy"

    const-string v3, "shareBase64File error"

    invoke-static {v2, v3, v0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "Erro ao compartilhar: "

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p0, v0}, Lnet/mikespub/mywebview/AppJavaScriptProxy;->showToast(Ljava/lang/String;)V

    :cond_exit
    return v1
.end method

.method public shareText(Ljava/lang/String;Ljava/lang/String;)Z
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    const/4 v0, 0x0

    if-eqz p1, :cond_exit

    :try_start_text
    new-instance v1, Landroid/content/Intent;

    const-string v2, "android.intent.action.SEND"

    invoke-direct {v1, v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    const-string v2, "text/plain"

    invoke-virtual {v1, v2}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    const-string v2, "android.intent.extra.TEXT"

    invoke-virtual {v1, v2, p1}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    if-eqz p2, :cond_default_title

    invoke-virtual {p2}, Ljava/lang/String;->isEmpty()Z

    move-result v2

    if-eqz v2, :cond_title_ok

    :cond_default_title
    const-string p2, "Compartilhar texto"

    :cond_title_ok
    const-string v2, "android.intent.extra.TITLE"

    invoke-virtual {v1, v2, p2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    invoke-static {v1, p2}, Landroid/content/Intent;->createChooser(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;

    move-result-object v1

    const/high16 v2, 0x10000000

    invoke-virtual {v1, v2}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    iget-object v2, p0, Lnet/mikespub/mywebview/AppJavaScriptProxy;->activity:Landroidx/appcompat/app/AppCompatActivity;

    invoke-virtual {v2, v1}, Landroidx/appcompat/app/AppCompatActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_text
    .catch Ljava/lang/Exception; {:try_start_text .. :try_end_text} :catch_text

    const/4 v0, 0x1

    return v0

    :catch_text
    move-exception v1

    const-string v2, "AppJavaScriptProxy"

    const-string p1, "shareText error"

    invoke-static {v2, p1, v1}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :cond_exit
    return v0
.end method
